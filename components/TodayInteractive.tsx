"use client";

import { useState, useTransition } from "react";
import { Check, Circle, Folder, Moon, X } from "lucide-react";
import type { Task } from "@/lib/types";
import { completeTask } from "@/app/actions";
import TaskDetailModal from "./TaskDetailModal";

export default function TodayInteractive({ tasks }: { tasks: Task[] }) {
  const [pending, startTransition] = useTransition();
  const [detail, setDetail] = useState<{ id: string; title: string } | null>(null);
  const [completing, setCompleting] = useState<Task | null>(null);
  const [brief, setBrief] = useState("");

  function openComplete(task: Task) {
    setBrief("");
    setCompleting(task);
  }

  function confirmComplete() {
    if (!completing) return;
    const id = completing.id;
    const text = brief;
    startTransition(async () => {
      const res = await completeTask(id, text);
      if (res.ok) setCompleting(null);
    });
  }

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
          <Row
            key={t.id}
            task={t}
            pending={pending}
            onComplete={() => openComplete(t)}
            onOpen={() => setDetail({ id: t.id, title: t.title })}
          />
        ))}
      </div>

      {detail && (
        <TaskDetailModal
          taskId={detail.id}
          title={detail.title}
          onClose={() => setDetail(null)}
        />
      )}

      {completing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
          onClick={() => !pending && setCompleting(null)}
        >
          <div
            className="w-full max-w-md rounded-hero border border-hair bg-canvas p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ship-tint">
                <Check className="h-4 w-4 text-ship-ink" />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-ink">Mark done</p>
                <p className="text-[12px] text-ink-3">{completing.title}</p>
              </div>
              <button
                onClick={() => setCompleting(null)}
                aria-label="Close"
                className="text-ink-3 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block text-[12px] font-medium text-ink">
              What did you get done?
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              autoFocus
              placeholder="e.g. Sent 10 cold emails and logged the replies."
              className="mt-1.5 w-full resize-none rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
            />
            <p className="mt-1 text-[11px] text-ink-3">
              Optional — a quick line helps the team see what actually moved.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCompleting(null)}
                className="rounded-control border border-hair px-4 py-2 text-[13px] text-ink-2 hover:bg-surface-soft"
              >
                Cancel
              </button>
              <button
                onClick={confirmComplete}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" /> Mark done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  task,
  pending,
  onComplete,
  onOpen,
}: {
  task: Task;
  pending: boolean;
  onComplete: () => void;
  onOpen: () => void;
}) {
  const completable = !task.isFolder && task.state !== "parked";

  return (
    <div className="flex items-center gap-3 border-b border-hair/60 px-3.5 py-3 last:border-b-0">
      {completable ? (
        <button
          onClick={onComplete}
          disabled={pending}
          aria-label="Mark done"
          className="shrink-0 text-ink-3 transition-colors duration-quick hover:text-ship-ink disabled:opacity-50"
        >
          <Circle className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
      ) : (
        <span className="shrink-0">
          {task.isFolder ? (
            <Folder className="h-[18px] w-[18px] text-accent-ink" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-ink-3" />
          )}
        </span>
      )}

      <span
        className={`shrink-0 rounded-chip px-2 py-0.5 text-[11px] ${
          task.state === "parked"
            ? "border border-hair bg-surface text-ink-2"
            : "bg-accent-tint text-accent-ink"
        }`}
      >
        {task.state === "parked" ? "Parked" : task.type === "build" ? "Build" : "Learn"}
      </span>

      <button
        onClick={onOpen}
        className={`min-w-0 flex-1 truncate text-left text-[13px] transition-colors duration-quick hover:text-accent-ink ${
          task.state === "parked" ? "text-ink-2" : "text-ink"
        }`}
      >
        {task.title}
      </button>

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
