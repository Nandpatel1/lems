"use client";

import { useEffect, useRef } from "react";

/** One written entry. Task discussions and general-discussion topics store
 *  their threads in different tables, but a thread reads the same either way,
 *  so both flatten to this. */
export interface ThreadEntry {
  id: string;
  author: string;
  /** Null once the writer's profile is gone — the writing outlives them. */
  authorId: string | null;
  authorInitial: string;
  body: string;
  createdAt: string;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Entries carry a clock time; the date lives once, on the separator above
 *  them. A log spanning weeks stays readable without repeating itself. */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** A dated log of written entries, oldest first.
 *
 *  Deliberately not a chat transcript: entries are flat prose under an avatar
 *  gutter rather than bubbles, because the shape of the thing should invite a
 *  written thought, not a one-line reply. The framing around it — what the
 *  thread is, who can see it, what to say when it's empty — belongs to the
 *  caller, since that is the part that actually differs between a discussion
 *  about a task and one about an idea.
 *
 *  `entries` is null while loading. `pendingIds` marks entries that exist only
 *  optimistically, so they read as in-flight rather than saved. */
export default function ThreadLog({
  entries,
  currentUid,
  empty,
  className = "flex flex-col gap-4",
  autoScroll = false,
  pendingIds,
}: {
  entries: ThreadEntry[] | null;
  currentUid: string | null;
  empty: React.ReactNode;
  className?: string;
  autoScroll?: boolean;
  pendingIds?: ReadonlySet<string>;
}) {
  const logRef = useRef<HTMLDivElement>(null);

  /** In a scrolling log the newest entry is where you land — same as any log.
   *  A log that grows the page instead doesn't need this: the browser keeps
   *  your reading position, which is the right behaviour there. */
  useEffect(() => {
    if (!autoScroll || !entries || entries.length === 0) return;
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, autoScroll]);

  return (
    <div ref={logRef} className={className}>
      {entries === null ? (
        <p className="text-[12px] text-ink-3">Loading…</p>
      ) : entries.length === 0 ? (
        empty
      ) : (
        entries.map((c, i) => {
          const mine = Boolean(currentUid && c.authorId === currentUid);
          const pending = pendingIds?.has(c.id) ?? false;
          const newDay =
            i === 0 || dayKey(c.createdAt) !== dayKey(entries[i - 1].createdAt);
          return (
            <div key={c.id} className={newDay && i > 0 ? "mt-1" : undefined}>
              {newDay && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-ink-3">
                    {dayLabel(c.createdAt)}
                  </span>
                  <span aria-hidden="true" className="h-px flex-1 bg-hair" />
                </div>
              )}
              {/* Avatar in a gutter, prose at full width — a written entry,
                  not a speech bubble. */}
              <article
                className={`flex gap-2.5 transition-opacity duration-quick ${
                  pending ? "opacity-50" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-medium ${
                    mine ? "bg-accent-tint text-accent-ink" : "bg-surface-soft text-ink-2"
                  }`}
                >
                  {c.authorInitial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 text-[11px]">
                    <span className="font-medium text-ink-2">
                      {mine ? "You" : c.author}
                    </span>
                    <span className="text-ink-3 tabular-nums">
                      {pending ? "Posting…" : timeOfDay(c.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink">
                    {c.body}
                  </p>
                </div>
              </article>
            </div>
          );
        })
      )}
    </div>
  );
}
