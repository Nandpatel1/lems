"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, UserPlus } from "lucide-react";
import type { AppNotification } from "@/lib/data";
import {
  markNotificationsRead,
  markNotificationRead,
  fetchNotifications,
} from "@/app/actions";

/** How often an open tab re-checks. Notifications arrive from other people, so
 *  nothing local can invalidate them — but a founder leaves this tab open all
 *  day, and a bell that only updates on navigation reads as broken. */
const POLL_MS = 60_000;

/** Anything past this is stale enough that a date beats "3 days ago". */
const RELATIVE_LIMIT_MS = 6 * 24 * 60 * 60 * 1000;

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < RELATIVE_LIMIT_MS) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** What the row says, split into a headline and the quoted payload beneath it.
 *  Built here rather than stored as a sentence, so a renamed task reads right
 *  in a notification sent before the rename. */
function describe(n: AppNotification): { headline: React.ReactNode; detail?: string } {
  const who = n.actorName ?? "Someone";
  if (n.type === "comment") {
    return {
      headline: (
        <>
          <span className="font-medium text-ink">{who}</span> commented on{" "}
          <span className="font-medium text-ink">{n.taskTitle ?? "a task"}</span>
        </>
      ),
      detail: n.body,
    };
  }
  if (n.type === "assigned" && n.taskTitle) {
    return {
      headline: (
        <>
          <span className="font-medium text-ink">{who}</span> assigned you{" "}
          <span className="font-medium text-ink">{n.taskTitle}</span>
        </>
      ),
    };
  }
  // Older 'assigned' rows (folder hand-offs) and 'poke' rows already carry a
  // whole sentence in body — show it as written rather than re-wrapping it.
  return { headline: <span className="text-ink">{n.body}</span> };
}

function TypeIcon({ type }: { type: string }) {
  const Icon = type === "comment" ? MessageSquare : UserPlus;
  return <Icon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />;
}

export default function NotificationsBell({
  items,
  placement = "sidebar",
}: {
  items: AppNotification[];
  placement?: "sidebar" | "header";
}) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // The server render is the source of truth on navigation; polling refreshes
  // it in place between navigations.
  useEffect(() => setList(items), [items]);

  const refresh = useCallback(() => {
    fetchNotifications()
      .then(setList)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const id = setInterval(onFocus, POLL_MS);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  // Escape closes and hands focus back to the bell, so keyboard users aren't
  // dropped at the top of the document.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const unread = list.filter((n) => !n.read).length;

  /** Opening the panel deliberately does NOT clear everything: the dots are
   *  how you tell what you've already dealt with. Reading one clears one. */
  function openNotification(n: AppNotification) {
    setOpen(false);
    if (!n.read) {
      setList((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      startTransition(async () => {
        await markNotificationRead(n.id);
      });
    }
    if (n.taskId && n.taskOwnerId) {
      router.push(`/team/${n.taskOwnerId}?task=${n.taskId}`);
    }
  }

  function clearAll() {
    setList((prev) => prev.map((x) => ({ ...x, read: true })));
    startTransition(async () => {
      await markNotificationsRead();
    });
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative grid h-6 w-6 place-items-center rounded-full text-ink-3 outline-none transition-colors duration-quick hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-soft"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-accent px-1 text-[9px] font-medium tabular-nums text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            // Width is capped against the viewport: in the mobile header this
            // sits hard against the right edge and must not push the page wide.
            className={`absolute z-50 w-[min(21rem,calc(100vw-2rem))] origin-top overflow-hidden rounded-card border border-hair bg-surface shadow-lg animate-[pane-in_160ms_cubic-bezier(.2,.8,.2,1)] ${
              placement === "header" ? "right-0 top-8" : "bottom-8 left-0"
            }`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-hair px-3 py-2">
              <p className="text-[12px] font-medium text-ink">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={clearAll}
                  className="rounded-chip px-1.5 py-0.5 text-[11px] text-ink-3 outline-none transition-colors duration-quick hover:bg-surface-soft hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Mark all read
                </button>
              )}
            </div>

            {list.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-surface-soft">
                  <Bell className="h-4 w-4 text-ink-3" />
                </span>
                <p className="mt-2 text-[12px] font-medium text-ink-2">
                  You&apos;re all caught up
                </p>
                <p className="mt-0.5 text-[11px] text-ink-3">
                  Comments on your tasks land here.
                </p>
              </div>
            ) : (
              <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
                {list.map((n) => {
                  const { headline, detail } = describe(n);
                  // Only worth saying when there *was* a task to go to. A
                  // folder hand-off never carried one and isn't a dead end.
                  const orphaned = Boolean(n.taskId) && !n.taskOwnerId;
                  return (
                    <button
                      key={n.id}
                      onClick={() => openNotification(n)}
                      // Still clickable when the task is gone: the click has
                      // nowhere to go, but it can still clear the dot.
                      className={`flex w-full gap-2.5 border-b border-hair px-3 py-2.5 text-left outline-none transition-colors duration-quick last:border-b-0 focus-visible:bg-surface-soft ${
                        n.read ? "hover:bg-surface-soft" : "bg-accent-tint/40 hover:bg-accent-tint"
                      }`}
                    >
                      <span className="relative shrink-0">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-tint text-[11px] font-medium text-accent-ink">
                          {n.actorInitial ?? "•"}
                        </span>
                        {/* The kind of event, badged on the person who caused
                            it — one glyph instead of a second line of text. */}
                        <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-surface text-ink-3 ring-1 ring-hair">
                          <TypeIcon type={n.type} />
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] leading-snug text-ink-2">
                          {headline}
                        </span>
                        {detail && (
                          <span className="mt-0.5 block truncate text-[11px] text-ink-3">
                            &ldquo;{detail}&rdquo;
                          </span>
                        )}
                        <span className="mt-0.5 block text-[10px] text-ink-3">
                          {timeAgo(n.createdAt)}
                          {orphaned && " · task removed"}
                        </span>
                      </span>

                      {!n.read && (
                        <span
                          aria-label="Unread"
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
