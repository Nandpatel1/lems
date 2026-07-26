"use client";

import { useState, useEffect } from "react";
import { Circle, Folder, Moon, List } from "lucide-react";
import type { Task } from "@/lib/types";
import TaskDetailModal from "./TaskDetailModal";

type View = "list" | "folders";

export default function TodayInteractive({ tasks }: { tasks: Task[] }) {
  const [detail, setDetail] = useState<{ id: string; title: string } | null>(null);
  const [view, setView] = useState<View>("list");

  useEffect(() => {
    const saved = localStorage.getItem("today_view");
    if (saved === "folders" || saved === "list") setView(saved);
  }, []);

  function changeView(v: View) {
    setView(v);
    localStorage.setItem("today_view", v);
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

  const groups = groupByFolder(tasks);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] text-ink-3">
          {view === "list" ? "Your tasks · soonest deadline first" : "Your tasks · grouped by folder"}
        </p>
        <div className="inline-flex items-center gap-0.5 rounded-control border border-hair bg-surface p-0.5">
          <ViewButton active={view === "list"} onClick={() => changeView("list")} icon={<List className="h-3.5 w-3.5" />} label="List" />
          <ViewButton active={view === "folders"} onClick={() => changeView("folders")} icon={<Folder className="h-3.5 w-3.5" />} label="By folder" />
        </div>
      </div>

      {view === "list" ? (
        <div className="overflow-hidden rounded-card border border-hair bg-surface">
          {tasks.map((t) => (
            <Row key={t.id} task={t} onOpen={() => setDetail({ id: t.id, title: t.title })} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([name, groupTasks]) => (
            <section key={name}>
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <Folder className="h-[15px] w-[15px] text-accent-ink" />
                <span className="text-[12px] font-medium text-ink">{name}</span>
                <span className="text-[11px] text-ink-3">{groupTasks.length}</span>
              </div>
              <div className="overflow-hidden rounded-card border border-hair bg-surface">
                {groupTasks.map((t) => (
                  <Row key={t.id} task={t} onOpen={() => setDetail({ id: t.id, title: t.title })} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

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

function groupByFolder(tasks: Task[]): [string, Task[]][] {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = t.folderName ?? "No folder";
    const arr = map.get(key);
    if (arr) arr.push(t);
    else map.set(key, [t]);
  }
  return Array.from(map.entries()).sort((a, b) => {
    if (a[0] === "No folder") return 1;
    if (b[0] === "No folder") return -1;
    return a[0].localeCompare(b[0]);
  });
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[12px] transition-colors duration-quick ${
        active ? "bg-accent-tint font-medium text-accent-ink" : "text-ink-3 hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Row({ task, onOpen }: { task: Task; onOpen: () => void }) {
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
          <Circle className="h-[18px] w-[18px] text-ink-3" strokeWidth={1.5} />
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
