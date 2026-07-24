"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import type { AppNotification } from "@/lib/data";
import { markNotificationsRead } from "@/app/actions";

export default function NotificationsBell({
  items,
  placement = "sidebar",
}: {
  items: AppNotification[];
  placement?: "sidebar" | "header";
}) {
  const [open, setOpen] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [, startTransition] = useTransition();

  const unread = cleared ? 0 : items.filter((n) => !n.read).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setCleared(true);
      startTransition(async () => {
        await markNotificationsRead();
      });
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative grid h-6 w-6 place-items-center rounded-full text-ink-3 transition-colors duration-quick hover:text-ink"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-accent px-1 text-[9px] font-medium text-white">
            {unread}
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
            className={`absolute z-50 w-72 rounded-card border border-hair bg-surface p-2 shadow-sm ${
              placement === "header" ? "top-8 right-0" : "bottom-8 left-0"
            }`}
          >
            <p className="px-2 py-1 text-[11px] text-ink-3">Notifications</p>
          {items.length === 0 ? (
            <p className="px-2 py-4 text-center text-[12px] text-ink-3">
              You&apos;re all caught up.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {items.map((n) => (
                <div
                  key={n.id}
                  className="flex gap-2 rounded-control px-2 py-2 hover:bg-surface-soft"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      n.read ? "bg-transparent" : "bg-accent"
                    }`}
                  />
                  <div>
                    <p className="text-[12px] leading-snug text-ink">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-ink-3">
                      {new Date(n.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}
