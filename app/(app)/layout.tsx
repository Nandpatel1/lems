import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import { Rocket, Plus } from "lucide-react";
import { getCurrentUserId } from "@/lib/session";
import { getCurrentProfile, getNotifications } from "@/lib/data";
import NotificationsBell from "@/components/NotificationsBell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const uid = await getCurrentUserId();
  if (!uid) redirect("/login");
  const [profile, notifications] = await Promise.all([
    getCurrentProfile(),
    getNotifications(),
  ]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar currentName={profile.name} notifications={notifications} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="md:hidden flex items-center justify-between border-b border-hair bg-surface-soft px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-control bg-accent">
              <Rocket className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="text-[14px] font-medium text-ink">Launchpad</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell items={notifications} placement="header" />
            <ThemeToggle />
            <Link
              href="/library"
              className="grid h-8 w-8 place-items-center rounded-control bg-accent text-white"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-5 pb-24 md:px-8 md:py-7 md:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
