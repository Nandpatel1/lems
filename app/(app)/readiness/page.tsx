import { Check, Plus, Circle } from "lucide-react";
import RoadToLaunch from "@/components/RoadToLaunch";
import { getReadiness } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  const { readiness, milestones, confidences, learned, applied } = await getReadiness();
  const avgConfidence =
    confidences.length === 0
      ? 0
      : Math.round((confidences.reduce((s, c) => s + c.score, 0) / confidences.length) * 10) /
        10;
  const next = milestones.find((m) => m.current) ?? milestones.find((m) => !m.done);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-medium text-ink">Readiness</h1>
        <p className="mt-0.5 text-[12px] text-ink-3">
          How close are we to taking clients — grounded in what we&apos;ve actually shipped.
        </p>
      </div>

      <RoadToLaunch
        readiness={readiness}
        milestones={milestones}
        nextLabel={next ? next.label : "launch"}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-card border border-hair bg-surface p-4">
          <h2 className="mb-3 text-[14px] font-medium text-ink">Launch milestones</h2>
          <div className="flex flex-col">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2.5 border-b border-hair/60 py-2.5 last:border-b-0"
              >
                {m.done ? (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-ship-tint">
                    <Check className="h-3 w-3 text-ship-ink" />
                  </span>
                ) : (
                  <Circle className="h-5 w-5 text-ink-3" strokeWidth={1.5} />
                )}
                <span
                  className={`text-[13px] capitalize ${
                    m.done ? "text-ink-2 line-through" : "text-ink"
                  }`}
                >
                  {m.label}
                </span>
                {m.current && (
                  <span className="ml-auto rounded-chip bg-accent-tint px-2 py-0.5 text-[11px] text-accent-ink">
                    in progress
                  </span>
                )}
              </div>
            ))}
          </div>
          <button className="mt-3 inline-flex items-center gap-1.5 rounded-control border border-hair-strong px-3 py-1.5 text-[12px] text-ink-2 transition-colors duration-quick hover:bg-surface-soft">
            <Plus className="h-3.5 w-3.5" /> Add milestone
          </button>
        </section>

        <section className="rounded-card border border-hair bg-surface p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[14px] font-medium text-ink">How ready we feel</h2>
            <span className="text-[12px] text-ink-3">avg {avgConfidence} / 5</span>
          </div>
          <div className="flex flex-col gap-3">
            {confidences.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-tint text-[11px] font-medium text-accent-ink">
                  {c.initial}
                </span>
                <span className="w-12 shrink-0 text-[12px] text-ink-2">{c.name}</span>
                <span className="flex flex-1 gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`h-1.5 flex-1 rounded-full ${
                        n <= c.score ? "bg-accent" : "bg-surface-soft"
                      }`}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-control bg-surface-soft px-3 py-2.5 text-[12px] leading-relaxed text-ink-2">
            You&apos;ve applied <span className="font-medium text-ship-ink">{applied}</span> of{" "}
            <span className="font-medium text-accent-ink">{learned}</span> things you learned this
            week. Confidence sits next to proof — that&apos;s how you know it&apos;s real.
          </p>
        </section>
      </div>
    </div>
  );
}
