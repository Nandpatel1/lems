"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Circle,
  Folder,
  Moon,
  Send,
  Bell,
  MessageCircle,
  FileText,
} from "lucide-react";
import { getTaskDetail, addComment, pokeTeammate, type MemberTaskRow } from "@/app/actions";
import { waMeUrl } from "@/lib/wa";

type Comment = { id: string; author: string; body: string; createdAt: string };

function dueLabel(deadline: string | null): { text: string; overdue: boolean } | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  const overdue = d.getTime() < Date.now();
  const text = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return { text: overdue ? `overdue · ${text}` : `due ${text}`, overdue };
}

function TaskIcon({ t, selected }: { t: MemberTaskRow; selected: boolean }) {
  if (t.state === "complete")
    return (
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-ship-tint">
        <Check className="h-3 w-3 text-ship-ink" />
      </span>
    );
  if (t.isFolder) return <Folder className="h-[18px] w-[18px] shrink-0 text-accent-ink" />;
  if (t.state === "parked") return <Moon className="h-[18px] w-[18px] shrink-0 text-ink-3" />;
  return (
    <Circle
      className={`h-[18px] w-[18px] shrink-0 ${selected ? "text-accent-ink" : "text-ink-3"}`}
      strokeWidth={1.5}
    />
  );
}

export default function MemberWorkspace({
  member,
  currentUid,
  tasks,
}: {
  member: { id: string; name: string; initial: string };
  currentUid: string | null;
  tasks: MemberTaskRow[];
}) {
  const isSelf = member.id === currentUid;
  const active = tasks.filter((t) => t.state !== "complete");
  const completed = tasks.filter((t) => t.state === "complete");

  const [selectedId, setSelectedId] = useState<string | null>(tasks[0]?.id ?? null);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  const [comments, setComments] = useState<Comment[] | null>(null);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();

  const [nudgeMsg, setNudgeMsg] = useState("");
  const [nudgeSent, setNudgeSent] = useState(false);

  useEffect(() => {
    if (!selectedId) {
      setComments([]);
      return;
    }
    let live = true;
    setComments(null);
    getTaskDetail(selectedId).then((d) => {
      if (live) setComments(d.comments);
    });
    return () => {
      live = false;
    };
  }, [selectedId]);

  function submitComment() {
    if (!selectedId || !comment.trim()) return;
    const body = comment.trim();
    setComment("");
    startTransition(async () => {
      await addComment(selectedId, body);
      const d = await getTaskDetail(selectedId);
      setComments(d.comments);
    });
  }

  function sendNudge() {
    if (!nudgeMsg.trim()) return;
    const body = nudgeMsg.trim();
    startTransition(async () => {
      await pokeTeammate(member.id, selectedId, body);
      setNudgeMsg("");
      setNudgeSent(true);
      setTimeout(() => setNudgeSent(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/team"
          aria-label="Back to team"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-control border border-hair text-ink-2 transition-colors duration-quick hover:bg-surface-soft"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-[15px] font-medium text-accent-ink">
          {member.initial}
        </span>
        <div className="flex-1">
          <h1 className="text-[18px] font-medium text-ink">
            {isSelf ? "Your work" : `${member.name}'s work`}
          </h1>
          <p className="text-[12px] text-ink-3">
            {completed.length} shipped · {active.length} active
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Left: task list */}
        <div className="flex flex-col gap-4">
          <Section
            label={`Active · ${active.length}`}
            empty="Nothing active."
            tasks={active}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <Section
            label={`Completed · ${completed.length}`}
            empty="Nothing shipped yet."
            tasks={completed}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Right: detail */}
        <div className="rounded-card border border-hair bg-surface p-4">
          {!selected ? (
            <div className="grid min-h-[220px] place-items-center text-center">
              <p className="text-[13px] text-ink-3">Select a task to review it.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-chip bg-accent-tint px-2 py-0.5 text-[11px] text-accent-ink">
                    {selected.type === "build" ? "Build" : "Learn"}
                  </span>
                  {selected.state === "complete" ? (
                    <span className="rounded-chip bg-ship-tint px-2 py-0.5 text-[11px] text-ship-ink">
                      Done
                    </span>
                  ) : selected.state === "parked" ? (
                    <span className="rounded-chip border border-hair bg-surface px-2 py-0.5 text-[11px] text-ink-2">
                      Parked
                    </span>
                  ) : dueLabel(selected.deadline) ? (
                    <span
                      className={`rounded-chip px-2 py-0.5 text-[11px] ${
                        dueLabel(selected.deadline)!.overdue
                          ? "bg-warm-tint text-warm-ink"
                          : "bg-surface-soft text-ink-2"
                      }`}
                    >
                      {dueLabel(selected.deadline)!.text}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-[16px] font-medium text-ink">{selected.title}</h2>
              </div>

              {/* Their notes */}
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] text-ink-3">
                  <FileText className="h-3.5 w-3.5" />
                  {isSelf ? "Your notes" : `${member.name}'s notes`}
                </p>
                {selected.note ? (
                  <p className="whitespace-pre-wrap rounded-control bg-surface-soft px-3 py-2.5 text-[13px] leading-relaxed text-ink">
                    {selected.note}
                  </p>
                ) : (
                  <p className="rounded-control border border-dashed border-hair px-3 py-2.5 text-[12px] text-ink-3">
                    No notes added yet.
                  </p>
                )}
              </div>

              {/* Comments */}
              <div>
                <p className="mb-1.5 text-[11px] text-ink-3">Comments</p>
                <div className="flex flex-col gap-2">
                  {comments === null ? (
                    <p className="text-[12px] text-ink-3">Loading…</p>
                  ) : comments.length === 0 ? (
                    <p className="text-[12px] text-ink-3">No comments yet — start the thread.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="rounded-control bg-surface-soft px-3 py-2">
                        <p className="text-[12px] text-ink">{c.body}</p>
                        <p className="mt-0.5 text-[10px] text-ink-3">
                          {c.author} ·{" "}
                          {new Date(c.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitComment();
                    }}
                    placeholder="Add a comment…"
                    className="flex-1 rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                  />
                  <button
                    onClick={submitComment}
                    disabled={pending || !comment.trim()}
                    aria-label="Send comment"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-accent text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Nudge composer */}
              {!isSelf && (
                <div className="border-t border-hair pt-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] text-ink-3">
                    <Bell className="h-3.5 w-3.5" /> Send {member.name} a nudge
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      value={nudgeMsg}
                      onChange={(e) => setNudgeMsg(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendNudge();
                      }}
                      placeholder={`e.g. Any update on "${selected.title}"?`}
                      className="flex-1 rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                    />
                    <button
                      onClick={sendNudge}
                      disabled={pending || !nudgeMsg.trim()}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-[12px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-50"
                    >
                      <Bell className="h-3.5 w-3.5" /> Send
                    </button>
                    <a
                      href={waMeUrl(
                        `Nudge for ${member.name}: ${
                          nudgeMsg.trim() || `how's "${selected.title}" going?`
                        }`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Nudge on WhatsApp"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-control border border-hair-strong bg-surface text-ship-ink transition-colors duration-quick hover:bg-surface-soft"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                  {nudgeSent && (
                    <p className="mt-1.5 text-[11px] text-ship-ink">Nudge sent.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  empty,
  tasks,
  selectedId,
  onSelect,
}: {
  label: string;
  empty: string;
  tasks: MemberTaskRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <p className="mb-2 text-[11px] text-ink-3">{label}</p>
      {tasks.length === 0 ? (
        <p className="rounded-card border border-dashed border-hair px-3 py-3 text-[12px] text-ink-3">
          {empty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-card border border-hair bg-surface">
          {tasks.map((t) => {
            const selected = t.id === selectedId;
            const due = t.state !== "complete" ? dueLabel(t.deadline) : null;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`flex w-full items-center gap-2.5 border-b border-hair/60 px-3 py-2.5 text-left transition-colors duration-quick last:border-b-0 ${
                  selected ? "bg-accent-tint/40" : "hover:bg-surface-soft/60"
                }`}
              >
                <TaskIcon t={t} selected={selected} />
                <span
                  className={`min-w-0 flex-1 truncate text-[12px] ${
                    t.state === "complete" ? "text-ink-2" : "text-ink"
                  }`}
                >
                  {t.title}
                </span>
                {t.note && <FileText className="h-3 w-3 shrink-0 text-ink-3" />}
                {due && (
                  <span
                    className={`shrink-0 text-[10px] ${
                      due.overdue ? "text-warm-ink" : "text-ink-3"
                    }`}
                  >
                    {due.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
