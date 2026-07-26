import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { getTeam } from "@/lib/data";
import { getCurrentUserId } from "@/lib/session";
import WaNudge from "@/components/WaNudge";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { members, weeklyShipped } = await getTeam();
  const uid = await getCurrentUserId();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Team</h1>
          <p className="mt-0.5 text-[12px] text-ink-3">
            Three people, building together. Open a card to review anyone&apos;s work.
          </p>
        </div>
        <WaNudge
          text={`Team check-in: we've shipped ${weeklyShipped} things this week on the road to launch. Let's keep the momentum — what are you shipping today?`}
          label="Nudge the team"
        />
      </div>

      <div className="flex items-center gap-3 rounded-card border border-hair bg-surface px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-ship-tint">
          <ArrowUpRight className="h-5 w-5 text-ship-ink" />
        </span>
        <div>
          <p className="text-[14px] font-medium text-ink">
            This week, together — {weeklyShipped} things shipped
          </p>
          <p className="text-[12px] text-ink-2">That&apos;s real distance covered. Keep going.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <Link
            key={m.id}
            href={`/team/${m.id}`}
            className="group rounded-card border border-hair bg-surface p-4 transition-colors duration-quick hover:border-hair-strong hover:bg-surface-soft"
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-tint text-[13px] font-medium text-accent-ink">
                {m.initial}
              </span>
              <span className="text-[14px] font-medium text-ink">{m.name}</span>
              {m.id === uid && (
                <span className="rounded-chip bg-surface-soft px-2 py-0.5 text-[10px] text-ink-3">
                  you
                </span>
              )}
              <ChevronRight className="ml-auto h-4 w-4 text-ink-3 transition-colors duration-quick group-hover:text-accent-ink" />
            </div>

            <div className="mb-3 flex gap-4">
              <div>
                <p className="text-[20px] font-medium text-ship-ink">{m.shipped}</p>
                <p className="text-[11px] text-ink-3">shipped</p>
              </div>
              <div>
                <p className="text-[20px] font-medium text-accent-ink">{m.inProgress}</p>
                <p className="text-[11px] text-ink-3">in progress</p>
              </div>
            </div>

            <div className="rounded-control bg-surface-soft px-3 py-2">
              <p className="text-[11px] text-ink-3">now</p>
              <p className="truncate text-[12px] text-ink">{m.focus}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
