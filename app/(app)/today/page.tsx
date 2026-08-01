import TodayInteractive from "@/components/TodayInteractive";
import { getToday } from "@/lib/data";
import { getCurrentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [data, uid] = await Promise.all([getToday(), getCurrentUserId()]);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-medium text-ink">
          Good evening, {data.founderName}
        </h1>
        <p className="mt-0.5 text-[12px] text-ink-3">
          {today} · {data.tasks.length} {data.tasks.length === 1 ? "thing" : "things"} on
          your plate
        </p>
      </div>

      <TodayInteractive tasks={data.tasks} currentUid={uid} />

      <p className="mt-1 text-center text-[12px] italic text-ink-3">
        Learning is the fuel. Shipping is the distance.
      </p>
    </div>
  );
}
