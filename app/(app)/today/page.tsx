import RoadToLaunch from "@/components/RoadToLaunch";
import RatioChip from "@/components/RatioChip";
import TodayInteractive from "@/components/TodayInteractive";
import { getToday } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const data = await getToday();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium text-ink">
            Good evening, {data.founderName}
          </h1>
          <p className="mt-0.5 text-[12px] text-ink-3">
            {today} · {data.otherTasks.length + (data.focusTask ? 1 : 0)} things for you
          </p>
        </div>
        <RatioChip learned={data.learned} applied={data.applied} />
      </div>

      <RoadToLaunch
        readiness={data.readiness}
        milestones={data.milestones}
        nextLabel={data.nextLabel}
      />

      <TodayInteractive focusTask={data.focusTask} otherTasks={data.otherTasks} />

      <p className="mt-1 text-center text-[12px] italic text-ink-3">
        Learning is the fuel. Shipping is the distance.
      </p>
    </div>
  );
}
