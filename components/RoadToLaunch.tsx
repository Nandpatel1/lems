import { Check } from "lucide-react";
import type { Milestone } from "@/lib/types";

export default function RoadToLaunch({
  readiness,
  milestones,
  nextLabel,
}: {
  readiness: number;
  milestones: Milestone[];
  nextLabel: string;
}) {
  return (
    <section className="rounded-card border border-hair bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-[12px] text-ink-2">The road to launch</span>
        <span className="text-[12px] text-ink">
          <span className="font-medium text-accent-ink">{readiness}%</span> · next: {nextLabel}
        </span>
      </div>

      <div className="relative h-2 rounded-full bg-surface-soft">
        <div
          className="absolute left-0 top-0 h-2 rounded-full bg-accent"
          style={{ width: `${readiness}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-accent bg-surface"
          style={{ left: `${readiness}%` }}
        />
      </div>

      <div className="mt-2.5 flex justify-between">
        {milestones.map((m) => (
          <span
            key={m.id}
            className={`inline-flex items-center gap-1 text-[11px] ${
              m.done
                ? "text-ship-ink"
                : m.current
                ? "font-medium text-accent-ink"
                : "text-ink-3"
            }`}
          >
            {m.done && <Check className="h-3 w-3" />}
            {m.label}
          </span>
        ))}
      </div>
    </section>
  );
}
