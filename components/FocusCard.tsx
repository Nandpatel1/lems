import { Play } from "lucide-react";
import type { Task } from "@/lib/types";

export default function FocusCard({ task }: { task: Task }) {
  return (
    <section className="rounded-card border border-accent-tint bg-accent-tint/40 p-4">
      <p className="mb-1.5 text-[11px] text-ink-3">Your one thing today</p>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-chip bg-accent-tint px-2 py-0.5 text-[11px] text-accent-ink">
          Build · ship it
        </span>
        {task.deadline && (
          <span className="rounded-chip bg-warm-tint px-2 py-0.5 text-[11px] text-warm-ink">
            due {task.deadline}
          </span>
        )}
      </div>
      <h2 className="text-[17px] font-medium text-ink">{task.title}</h2>
      {task.note && (
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{task.note}</p>
      )}
      <div className="mt-3.5 flex items-center gap-3">
        <button className="inline-flex items-center gap-1.5 rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98]">
          <Play className="h-3.5 w-3.5" /> Start
        </button>
        {task.effortMin && (
          <span className="text-[12px] text-ink-3">≈ {task.effortMin} min of real work</span>
        )}
      </div>
    </section>
  );
}
