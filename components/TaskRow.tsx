import { RefreshCw, Folder, Moon } from "lucide-react";
import type { Task } from "@/lib/types";

function leadingIcon(task: Task) {
  if (task.state === "parked") return <Moon className="h-4 w-4 text-ink-3" />;
  if (task.isFolder) return <Folder className="h-4 w-4 text-accent-ink" />;
  if (task.overdue) return <RefreshCw className="h-4 w-4 text-warm-ink" />;
  return null;
}

export default function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 border-b border-hair/60 px-3.5 py-2.5 last:border-b-0">
      <span className="shrink-0">{leadingIcon(task)}</span>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] ${
            task.state === "parked" ? "text-ink-2" : "text-ink"
          }`}
        >
          {task.title}
        </p>
      </div>

      {task.overdue && (
        <span className="shrink-0 text-[11px] text-warm-ink">overdue</span>
      )}

      {task.isFolder && (
        <span className="flex shrink-0 items-center gap-2">
          <span className="h-[5px] w-14 overflow-hidden rounded-full bg-surface-soft">
            <span
              className="block h-full rounded-full bg-accent"
              style={{
                width: `${Math.round(
                  ((task.childrenDone ?? 0) / (task.childrenTotal || 1)) * 100
                )}%`,
              }}
            />
          </span>
          <span className="text-[11px] text-ink-3">
            {task.childrenDone} / {task.childrenTotal}
          </span>
        </span>
      )}

      {task.state === "parked" && task.parkedReason && (
        <span className="shrink-0 text-[11px] text-ink-3">parked · {task.parkedReason}</span>
      )}
    </div>
  );
}
