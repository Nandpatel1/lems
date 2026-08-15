"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { useNotifications } from "./NotificationsProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { unseenTopics } = useNotifications();
  const unread = unseenTopics.size;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 flex border-t border-hair bg-surface-soft backdrop-blur">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        const badge = href === "/discuss" ? unread : 0;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
              active || badge > 0 ? "text-accent-ink" : "text-ink-3"
            }`}
          >
            {/* The count rides the icon rather than the label: this bar is
                four equal columns and a badge in the flow would shove the
                labels out of alignment with each other. */}
            <span className="relative">
              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={active || badge > 0 ? 2 : 1.75}
              />
              {badge > 0 && (
                <span
                  className="absolute -right-1.5 -top-1 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-accent px-1 text-[9px] font-medium tabular-nums text-white"
                  aria-label={`${badge} ${badge === 1 ? "topic" : "topics"} with new activity`}
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
