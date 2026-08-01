import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTeam } from "@/lib/data";
import { getCurrentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { members } = await getTeam();
  const uid = await getCurrentUserId();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-medium text-ink">Team</h1>
        <p className="mt-0.5 text-[12px] text-ink-3">
          Three people, building together. Open a card to review anyone&apos;s work.
        </p>
      </div>

      {/* One row per person: who they are, plus the only number that asks
          anything of the reader — what's still on their plate. The card mirrors
          the header of the page it opens, so the two read as one place. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <Link
            key={m.id}
            href={`/team/${m.id}`}
            className="group flex items-center gap-3 rounded-card border border-hair bg-surface px-4 py-3.5 transition-colors duration-quick hover:border-hair-strong hover:bg-surface-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-[15px] font-medium text-accent-ink">
              {m.initial}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-medium text-ink">{m.name}</span>
                {m.id === uid && (
                  <span className="shrink-0 rounded-chip bg-surface-soft px-2 py-0.5 text-[10px] text-ink-3">
                    you
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-ink-3">
                {m.pending > 0 ? (
                  <>
                    <span className="font-medium text-accent-ink">{m.pending}</span> pending
                  </>
                ) : (
                  "Nothing pending"
                )}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-colors duration-quick group-hover:text-accent-ink" />
          </Link>
        ))}
      </div>
    </div>
  );
}
