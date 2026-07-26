import { ArrowUpRight } from "lucide-react";
import { getTeam } from "@/lib/data";
import { getCurrentUserId } from "@/lib/session";
import WaNudge from "@/components/WaNudge";
import TeamBoard from "@/components/TeamBoard";

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
            Three people, building together. Tap a card to review anyone&apos;s tasks.
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

      <TeamBoard members={members} currentUid={uid} />
    </div>
  );
}
