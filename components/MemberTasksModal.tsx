"use client";

import { useEffect, useState } from "react";
import { X, Check, Circle, Folder, Moon } from "lucide-react";
import { getMemberTasks, type MemberTaskRow } from "@/app/actions";

function dueLabel(deadline: string | null): string | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  const overdue = d.getTime() < Date.now();
  const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return overdue ? `overdue · ${label}` : `due ${label}`;
}

function TypeIcon({ t }: { t: MemberTaskRow }) {
  if (t.isFolder) return <Folder className="h-[18px] w-[18px] text-accent-ink" />;
  if (t.state === "parked") return <Moon className="h-[18px] w-[18px] text-ink-3" />;
  if (t.state === "complete")
    return (
      <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-ship-tint">
        <Check className="h-3 w-3 text-ship-ink" />
      </span>
    );
  return <Circle className="h-[18px] w-[18px] text-ink-3" strokeWidth={1.5} />;
}

export default function MemberTasksModal({
  member,
  onClose,
}: {
  member: { id: string; name: string; initial: string };
  onClose: () => void;
}) {
  const [tasks, setTasks] = useState<MemberTaskRow[] | null>(null);

  useEffect(() => {
    let active = true;
    getMemberTasks(member.id).then((t) => {
      if (active) setTasks(t);
    });
    return () => {
      active = false;
    };
  }, [member.id]);

  const activeTasks = (tasks ?? []).filter((t) => t.state !== "complete");
  const doneTasks = (tasks ?? []).filter((t) => t.state === "complete");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-hero border border-hair bg-canvas p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-tint text-[13px] font-medium text-accent-ink">
              {member.initial}
            </span>
            <div>
              <h2 className="text-[15px] font-medium text-ink">{member.name}&apos;s tasks</h2>
              <p className="text-[11px] text-ink-3">
                Review what they&apos;re working on and what they&apos;ve shipped.
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-ink-3 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {tasks === null ? (
            <p className="text-[12px] text-ink-3">Loading…</p>
          ) : tasks.length === 0 ? (
            <p className="text-[12px] text-ink-3">No tasks yet.</p>
          ) : (
            <div className="flex flex-col gap-5">
              <section>
                <p className="mb-2 text-[11px] text-ink-3">
                  Active · {activeTasks.length}
                </p>
                {activeTasks.length === 0 ? (
                  <p className="text-[12px] text-ink-3">Nothing active.</p>
                ) : (
                  <div className="overflow-hidden rounded-card border border-hair bg-surface">
                    {activeTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 border-b border-hair/60 px-3.5 py-2.5 last:border-b-0"
                      >
                        <TypeIcon t={t} />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                          {t.title}
                        </span>
                        {t.state === "parked" ? (
                          <span className="shrink-0 text-[11px] text-ink-3">parked</span>
                        ) : dueLabel(t.deadline) ? (
                          <span
                            className={`shrink-0 text-[11px] ${
                              dueLabel(t.deadline)?.startsWith("overdue")
                                ? "text-warm-ink"
                                : "text-ink-3"
                            }`}
                          >
                            {dueLabel(t.deadline)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <p className="mb-2 text-[11px] text-ink-3">
                  Completed · {doneTasks.length}
                </p>
                {doneTasks.length === 0 ? (
                  <p className="text-[12px] text-ink-3">Nothing shipped yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {doneTasks.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-card border border-hair bg-surface px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-ship-tint">
                            <Check className="h-3 w-3 text-ship-ink" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                            {t.title}
                          </span>
                          <span className="shrink-0 rounded-chip bg-accent-tint px-2 py-0.5 text-[10px] text-accent-ink">
                            {t.type === "build" ? "Build" : "Learn"}
                          </span>
                        </div>
                        {t.note && (
                          <p className="mt-2 whitespace-pre-wrap rounded-control bg-surface-soft px-3 py-2 text-[12px] leading-relaxed text-ink-2">
                            {t.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
