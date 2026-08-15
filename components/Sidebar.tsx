"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, LogOut } from "lucide-react";
import { navItems } from "./nav-items";
import ThemeToggle from "./ThemeToggle";
import NotificationsBell from "./NotificationsBell";
import { useNotifications } from "./NotificationsProvider";
import { signOut } from "@/app/login/actions";

export default function Sidebar({ currentName }: { currentName?: string }) {
  const pathname = usePathname();
  const { unseenTopics } = useNotifications();
  const unread = unseenTopics.size;

  return (
    <aside className="hidden md:flex w-[190px] shrink-0 flex-col border-r border-hair bg-surface-soft p-3">
      <div className="flex items-center gap-2 px-2 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-control bg-accent">
          <Rocket className="h-4 w-4 text-white" strokeWidth={2} />
        </span>
        <span className="text-[15px] font-medium text-ink">Launchpad</span>
      </div>

      <nav className="mt-2 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          // Only Discuss carries a count today, but the badge is keyed off the
          // href rather than hardcoded into one branch, so a second surface
          // with unread state doesn't need this loop rewritten.
          const badge = href === "/discuss" ? unread : 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-control px-2.5 py-2 text-[13px] transition-colors duration-quick ${
                active
                  ? "bg-accent-tint text-accent-ink font-medium"
                  : badge > 0
                    ? // Not selected, but asking for you. Colouring the label
                      // (without the filled background) keeps "there's
                      // something here" clearly distinct from "you are here".
                      "font-medium text-accent-ink hover:bg-surface"
                    : "text-ink-2 hover:bg-surface"
              }`}
            >
              <Icon
                className="h-[18px] w-[18px]"
                strokeWidth={active || badge > 0 ? 2 : 1.75}
              />
              {label}
              {badge > 0 && (
                <span
                  className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium tabular-nums text-white"
                  aria-label={`${badge} ${badge === 1 ? "topic" : "topics"} with new activity`}
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-between gap-2 px-1 pt-3">
        <span className="min-w-0 truncate text-[11px] text-ink-3">
          {currentName ? `You: ${currentName}` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <NotificationsBell />
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              className="grid h-6 w-6 place-items-center rounded-full text-ink-3 transition-colors duration-quick hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
          <ThemeToggle />
        </span>
      </div>
    </aside>
  );
}
