"use client";

import { useState } from "react";
import { Circle, Folder, Moon } from "lucide-react";
import type { Task } from "@/lib/types";
import TaskDetailModal from "./TaskDetailModal";

export default function TodayInteractive({ tasks }: { tasks: Task[] }) {
  const [detail, setDetail] = useState<{ id: string; title: string } | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="rounded-card border border-hair bg-surface px-4 py-12 text-center">
        <p className="text-[15px] font-medium text-ink">You&apos;re all clear</p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-ink-2">
          Nothing on your plate right now. Add a resource or pull something from the library.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[11px] text-ink-3">Your tasks · soonest deadline first</p>
      <div className="overflow-hidden rounded-card border border-hair bg-surface">
        {tasks.map((t) => (
          <Row key={t.id} task={t} onOpen={() => setDetail({ id: t.id, title: t.title })} />
        ))}
      </div>

      {detail && (
        <TaskDetailModal
          taskId={detail.id}
          title={detail.title}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function Row({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const completable = !task.isFolder && task.state !== "parked";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer items-center gap-3 border-b border-hair px-3.5 py-3 text-left transition-colors duration-quick last:border-b-0 hover:bg-surface-soft"
    >
      <span className="shrink-0">
        {task.isFolder ? (
          <Folder className="h-[18px] w-[18px] text-accent-ink" />
        ) : task.state === "parked" ? (
          <Moon className="h-[18px] w-[18px] text-ink-3" />
        ) : (
          <Circle
            className={`h-[18px] w-[18px] ${completable ? "text-ink-3" : "text-ink-3"}`}
            strokeWidth={1.5}
          />
        )}
      </span>

      {task.state === "parked" && (
        <span className="shrink-0 rounded-chip border border-hair bg-surface px-2 py-0.5 text-[11px] text-ink-2">
          Parked
        </span>
      )}

      <span
        className={`min-w-0 flex-1 truncate text-[13px] ${
          task.state === "parked" ? "text-ink-2" : "text-ink"
        }`}
      >
        {task.title}
      </span>

      {task.isFolder ? (
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
      ) : task.state === "parked" ? (
        <span className="shrink-0 text-[11px] text-ink-3">
          {task.parkedReason ? `parked · ${task.parkedReason}` : "parked"}
        </span>
      ) : task.overdue ? (
        <span className="shrink-0 rounded-chip bg-warm-tint px-2 py-0.5 text-[11px] text-warm-ink">
          overdue
        </span>
      ) : task.deadline ? (
        <span className="shrink-0 text-[11px] text-ink-3">due {task.deadline}</span>
      ) : (
        <span className="shrink-0 text-[11px] text-ink-3">no deadline</span>
      )}
    </div>
  );
}
