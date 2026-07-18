"use client";

import { useState, useTransition } from "react";
import {
  Play,
  Check,
  Circle,
  RefreshCw,
  Folder,
  Moon,
  Target,
  Bookmark,
  X,
  ArrowRight,
} from "lucide-react";
import type { Task } from "@/lib/types";
import { completeLearn, markShipped } from "@/app/actions";

export default function TodayInteractive({
  focusTask,
  otherTasks,
}: {
  focusTask: Task | null;
  otherTasks: Task[];
}) {
  const [pending, startTransition] = useTransition();
  const [moment, setMoment] = useState<Task | null>(null);
  const [actionTitle, setActionTitle] = useState("");
  const [shipped, setShipped] = useState(false);

  function openMoment(task: Task) {
    setActionTitle(`Apply what you learned: ${task.title}`);
    setMoment(task);
  }

  function onComplete(task: Task) {
    if (task.type === "build") {
      startTransition(async () => {
        await markShipped(task.id);
      });
    } else {
      openMoment(task);
    }
  }

  function resolveMoment(withAction: boolean) {
    if (!moment) return;
    const id = moment.id;
    const title = withAction ? actionTitle : undefined;
    startTransition(async () => {
      await completeLearn(id, title);
      setMoment(null);
    });
  }

  function shipFocus() {
    if (!focusTask) return;
    startTransition(async () => {
      const res = await markShipped(focusTask.id);
      if (res.ok) setShipped(true);
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1.15fr_1fr]">
      {/* Focus card */}
      {focusTask && (
        <section className="rounded-card border border-accent-tint bg-accent-tint/40 p-4">
          <p className="mb-1.5 text-[11px] text-ink-3">Your one thing today</p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-chip bg-accent-tint px-2 py-0.5 text-[11px] text-accent-ink">
              Build · ship it
            </span>
            {focusTask.deadline && (
              <span className="rounded-chip bg-warm-tint px-2 py-0.5 text-[11px] text-warm-ink">
                due {focusTask.deadline}
              </span>
            )}
          </div>
          <h2 className="text-[17px] font-medium text-ink">{focusTask.title}</h2>
          {focusTask.note && (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{focusTask.note}</p>
          )}

          {shipped ? (
            <div className="mt-3.5 flex items-center gap-2 rounded-control bg-ship-tint px-3 py-2">
              <Check className="h-4 w-4 text-ship-ink" />
              <span className="text-[13px] text-ship-ink">
                That&apos;s real progress — the road just moved.
              </span>
            </div>
          ) : (
            <div className="mt-3.5 flex items-center gap-3">
              <button
                onClick={shipFocus}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-60"
              >
                <Target className="h-3.5 w-3.5" /> Mark shipped
              </button>
              {focusTask.effortMin && (
                <span className="text-[12px] text-ink-3">≈ {focusTask.effortMin} min</span>
              )}
            </div>
          )}
        </section>
      )}

      {/* Queue */}
      <div>
        <p className="mb-2 text-[11px] text-ink-3">Also on your plate</p>
        <div className="overflow-hidden rounded-card border border-hair bg-surface">
          {otherTasks.map((t) => (
            <Row key={t.id} task={t} pending={pending} onComplete={() => onComplete(t)} />
          ))}
        </div>
      </div>

      {/* Turn-into-action moment */}
      {moment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <div className="w-full max-w-md rounded-hero border border-hair bg-canvas p-5">
            <div className="mb-3 flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ship-tint">
                <Check className="h-4 w-4 text-ship-ink" />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-ink">Nice, that&apos;s done</p>
                <p className="text-[12px] text-ink-3">{moment.title}</p>
              </div>
              <button
                onClick={() => setMoment(null)}
                aria-label="Close"
                className="text-ink-3 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[16px] font-medium text-ink">So what will you do with it?</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
              Watching it is fuel. Doing something real with it is the distance — the only thing
              that moves your launch readiness.
            </p>

            <label className="mt-4 block text-[11px] text-ink-3">The action</label>
            <input
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
              className="mt-1 w-full rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
            />

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => resolveMoment(true)}
                disabled={pending || !actionTitle.trim()}
                className="flex items-center gap-2 rounded-control bg-accent px-4 py-2.5 text-left text-[14px] font-medium text-white transition-transform duration-quick active:scale-[0.99] disabled:opacity-60"
              >
                <Target className="h-4 w-4" />
                <span className="flex-1">Turn it into an action</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => resolveMoment(false)}
                disabled={pending}
                className="flex items-center gap-2 rounded-control border border-hair bg-surface px-4 py-2.5 text-left text-[14px] text-ink-2 transition-colors duration-quick hover:bg-surface-soft disabled:opacity-60"
              >
                <Bookmark className="h-4 w-4" />
                <span className="flex-1">Just knowledge for now</span>
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
}: {
  task: Task;
  pending: boolean;
  onComplete: () => void;
}) {
  const canComplete = !task.isFolder && task.state !== "parked";

  const leading = task.isFolder ? (
    <Folder className="h-4 w-4 text-accent-ink" />
  ) : task.state === "parked" ? (
    <Moon className="h-4 w-4 text-ink-3" />
  ) : task.overdue ? (
    <RefreshCw className="h-4 w-4 text-warm-ink" />
  ) : null;

  return (
    <div className="flex items-center gap-3 border-b border-hair/60 px-3.5 py-2.5 last:border-b-0">
      {canComplete ? (
        <button
          onClick={onComplete}
          disabled={pending}
          aria-label="Mark complete"
          className="shrink-0 text-ink-3 transition-colors duration-quick hover:text-ship-ink disabled:opacity-50"
        >
          <Circle className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
      ) : (
        <span className="shrink-0">{leading}</span>
      )}

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] ${
            task.state === "parked" ? "text-ink-2" : "text-ink"
          }`}
        >
          {task.title}
        </p>
      </div>

      {task.overdue && <span className="shrink-0 text-[11px] text-warm-ink">overdue</span>}

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
