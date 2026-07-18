"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, Plus, LogOut } from "lucide-react";
import { navItems } from "./nav-items";
import ThemeToggle from "./ThemeToggle";
import NotificationsBell from "./NotificationsBell";
import { signOut } from "@/app/login/actions";
import type { AppNotification } from "@/lib/data";

export default function Sidebar({
  currentName,
  notifications = [],
}: {
  currentName?: string;
  notifications?: AppNotification[];
}) {
  const pathname = usePathname();

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
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-control px-2.5 py-2 text-[13px] transition-colors duration-quick ${
                active
                  ? "bg-accent-tint text-accent-ink font-medium"
                  : "text-ink-2 hover:bg-surface"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/library"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-control bg-accent px-3 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98]"
      >
        <Plus className="h-[15px] w-[15px]" /> Add
      </Link>

      <div className="mt-auto flex items-center justify-between gap-2 px-1 pt-3">
        <span className="min-w-0 truncate text-[11px] text-ink-3">
          {currentName ? `You: ${currentName}` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <NotificationsBell items={notifications} />
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
