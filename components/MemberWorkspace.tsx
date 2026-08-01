"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Circle,
  Folder,
  Moon,
  Send,
  FileText,
  UserMinus,
  Library,
} from "lucide-react";
import {
  getTaskDetail,
  addComment,
  unassignTask,
  type MemberTaskRow,
} from "@/app/actions";
import ConfirmDialog from "./ConfirmDialog";
import TypeChip from "./TypeChip";

/** How long the removed row takes to collapse. Matches `duration-base`. */
const REMOVE_MS = 220;
/** How long the "just unassigned" reassurance stays in the detail pane. */
const NOTICE_MS = 4200;

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
  const router = useRouter();
  const isSelf = member.id === currentUid;

  // Open on something active: shipped work sits behind a collapsed disclosure,
  // and a pane showing a task you can't see in the rail reads as a mismatch.
  const [selectedId, setSelectedId] = useState<string | null>(
    () => (tasks.find((t) => t.state !== "complete") ?? tasks[0])?.id ?? null
  );

  /** Shipped work is history — collapsed unless it's all there is to show. */
  const [showCompleted, setShowCompleted] = useState(
    () => !tasks.some((t) => t.state !== "complete")
  );

  const [comments, setComments] = useState<Comment[] | null>(null);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();


  const [confirmUnassign, setConfirmUnassign] = useState<MemberTaskRow | null>(null);
  /** The row mid-collapse: still rendered so it can animate out, but already
   *  excluded from every count. */
  const [removingId, setRemovingId] = useState<string | null>(null);
  /** Gone for good — kept so a slow router.refresh() can't flash it back. */
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [liveMsg, setLiveMsg] = useState("");

  const paneRef = useRef<HTMLDivElement>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    []
  );

  // Rows still in the DOM (includes the one collapsing) vs. what the counts see.
  const rows = tasks.filter((t) => !removedIds.has(t.id));
  const activeRows = rows.filter((t) => t.state !== "complete");
  const completedRows = rows.filter((t) => t.state === "complete");
  const counted = rows.filter((t) => t.id !== removingId);
  const active = counted.filter((t) => t.state !== "complete");
  const completed = counted.filter((t) => t.state === "complete");

  const selected = counted.find((t) => t.id === selectedId) ?? null;

  /** Collapse the row, swap the pane, then settle: refresh and move focus.
   *  Everything visible starts at t=0 so the whole event reads as one beat.
   *  Unassigning is only ever reachable from the detail pane, so the task
   *  leaving is always the one on screen — focus goes back to the pane. */
  function afterUnassign(task: MemberTaskRow) {
    setRemovingId(task.id);
    setLiveMsg(
      `Unassigned "${task.title}" from ${isSelf ? "your queue" : member.name}. It's still in the Library.`
    );
    setSelectedId(null);
    setNotice(task.title);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);

    // setTimeout, not onTransitionEnd: reduced-motion collapses the duration to
    // ~0 and the event would never fire, stranding the row on screen.
    setTimeout(() => {
      setRemovedIds((prev) => new Set(prev).add(task.id));
      setRemovingId(null);
      router.refresh();
      paneRef.current?.focus();
    }, REMOVE_MS);
  }

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

      <div className="grid gap-4 md:grid-cols-[300px_1fr] md:items-start">
        {/* Left: task list */}
        <div className="flex flex-col gap-4">
          <Section
            label="Active"
            count={active.length}
            empty="Nothing active."
            tasks={activeRows}
            selectedId={selectedId}
            removingId={removingId}
            onSelect={setSelectedId}
          />
          <CompletedSection
            count={completed.length}
            open={showCompleted}
            onToggle={() => setShowCompleted((v) => !v)}
            tasks={completedRows}
            selectedId={selectedId}
            removingId={removingId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Right: detail */}
        <div
          ref={paneRef}
          tabIndex={-1}
          className="rounded-card border border-hair bg-surface p-4 outline-none"
        >
          <p role="status" aria-live="polite" className="sr-only">
            {liveMsg}
          </p>
          {!selected ? (
            <div className="grid min-h-[220px] place-items-center px-4 text-center">
              {notice ? (
                <div className="animate-[pane-in_220ms_cubic-bezier(.2,.8,.2,1)]">
                  <p className="text-[13px] text-ink-2">
                    Unassigned{" "}
                    <span className="font-medium text-ink">&quot;{notice}&quot;</span>.
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-[12px] text-ink-3">
                    It&apos;s still in the Library — assign it again any time.
                  </p>
                </div>
              ) : counted.length === 0 ? (
                <div>
                  <p className="text-[14px] font-medium text-ink">
                    {isSelf
                      ? "Your plate is clear"
                      : `${member.name} has nothing assigned yet`}
                  </p>
                  <p className="mx-auto mt-1 max-w-[15rem] text-[12px] text-ink-2">
                    Work is handed out from the Library — open a resource there and send
                    it {isSelf ? "to yourself" : `to ${member.name}`}.
                  </p>
                  <Link
                    href="/library"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-control border border-hair px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-quick hover:border-hair-strong hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    <Library className="h-3.5 w-3.5" /> Open the Library
                  </Link>
                </div>
              ) : (
                <p className="mx-auto max-w-[16rem] text-[13px] text-ink-3">
                  Pick something on the left to{" "}
                  {isSelf
                    ? "add notes."
                    : `read ${member.name}'s notes and leave a comment.`}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {!selected.isFolder && (
                    <TypeChip type={selected.type} state={selected.state} />
                  )}
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

                  {/* Object-level action on the thing you're looking at — pinned
                      here so it never drifts below the fold as comments pile up.
                      Neutral at rest: red-washing someone's shipped work would
                      read as an error state on their best output. */}
                  <button
                    onClick={() => setConfirmUnassign(selected)}
                    aria-label={
                      isSelf
                        ? `Remove "${selected.title}" from your queue`
                        : `Unassign "${selected.title}" from ${member.name}`
                    }
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-hair px-2.5 py-1.5 text-[11px] font-medium text-ink-2 transition-colors duration-quick hover:border-danger hover:bg-danger-tint hover:text-danger-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.98]"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    {isSelf ? "Remove" : "Unassign"}
                  </button>
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

            </div>
          )}
        </div>
      </div>

      {confirmUnassign &&
        (confirmUnassign.state === "complete" ? (
          <ConfirmDialog
            title="Unassign shipped work?"
            confirmLabel="Unassign anyway"
            pendingLabel="Unassigning…"
            message={
              <>
                <span className="font-medium text-ink">
                  &quot;{confirmUnassign.title}&quot;
                </span>{" "}
                is already shipped. Unassigning takes it off{" "}
                {isSelf ? "your" : `${member.name}'s`} record —{" "}
                <span className="font-medium text-ink">
                  {isSelf ? "your" : "their"} shipped count drops from{" "}
                  {completed.length} to {completed.length - 1}
                </span>
                , and {isSelf ? "your" : "their"} notes and the comment thread on it
                are deleted.
                <span className="mt-2 block text-ink-3">
                  The resource stays in the Library and can be assigned again any time.
                </span>
              </>
            }
            onConfirm={async () => {
              const res = await unassignTask(confirmUnassign.id);
              if (res.ok) afterUnassign(confirmUnassign);
              return res;
            }}
            onClose={() => setConfirmUnassign(null)}
          />
        ) : (
          <ConfirmDialog
            title={isSelf ? "Remove from your queue" : `Unassign from ${member.name}`}
            confirmLabel={isSelf ? "Remove" : "Unassign"}
            pendingLabel="Unassigning…"
            message={
              <>
                Take{" "}
                <span className="font-medium text-ink">
                  &quot;{confirmUnassign.title}&quot;
                </span>{" "}
                off {isSelf ? "your" : `${member.name}'s`} plate?
                <span className="mt-2 block">
                  It stays in the Library, so it can be assigned again any time
                  {isSelf ? "" : " — to them or anyone else"}.
                </span>
                <span className="mt-2 block text-ink-3">
                  {confirmUnassign.note
                    ? `${isSelf ? "Your" : `${member.name}'s`} notes and the comment thread on it are deleted.`
                    : "Any comments on it are deleted."}
                </span>
              </>
            }
            onConfirm={async () => {
              const res = await unassignTask(confirmUnassign.id);
              if (res.ok) afterUnassign(confirmUnassign);
              return res;
            }}
            onClose={() => setConfirmUnassign(null)}
          />
        ))}
    </div>
  );
}

/** The picking rail: what the task is called, whether it has notes, and when
 *  it's due. Nothing actionable lives here — unassigning is an object-level
 *  action, so it waits in the detail pane where the task is actually open. */
function Section({
  label,
  count,
  empty,
  tasks,
  selectedId,
  removingId,
  onSelect,
}: {
  label: string;
  count: number;
  empty: string;
  tasks: MemberTaskRow[];
  selectedId: string | null;
  removingId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <p className="mb-2 text-[11px] text-ink-3">
        {label} · {count}
      </p>
      {tasks.length === 0 ? (
        <p className="rounded-card border border-dashed border-hair px-3 py-3 text-[12px] text-ink-3">
          {empty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-card border border-hair bg-surface">
          <TaskRows
            tasks={tasks}
            selectedId={selectedId}
            removingId={removingId}
            onSelect={onSelect}
          />
        </div>
      )}
    </section>
  );
}

/** Shipped work, folded away by default. It's the record of what's done, not
 *  the thing you came here to act on — so it costs one line until asked for.
 *  The header carries the count so collapsing never hides the number. */
function CompletedSection({
  count,
  open,
  onToggle,
  tasks,
  selectedId,
  removingId,
  onSelect,
}: {
  count: number;
  open: boolean;
  onToggle: () => void;
  tasks: MemberTaskRow[];
  selectedId: string | null;
  removingId: string | null;
  onSelect: (id: string) => void;
}) {
  if (count === 0) {
    return (
      <section>
        <p className="mb-2 text-[11px] text-ink-3">Completed · 0</p>
        <p className="rounded-card border border-dashed border-hair px-3 py-3 text-[12px] text-ink-3">
          Nothing shipped yet.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-card border border-hair bg-surface">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="completed-tasks"
          className="flex w-full items-center gap-2 py-2.5 pl-3 pr-3 text-left outline-none transition-colors duration-quick hover:bg-surface-soft focus-visible:bg-surface-soft"
        >
          {/* Sits in the same column as the row icons below, so opening the
              section doesn't shift the eye's scan line. */}
          <ChevronRight
            aria-hidden="true"
            className={`h-3.5 w-3.5 shrink-0 text-ink-3 transition-transform duration-base ${
              open ? "rotate-90" : ""
            }`}
          />
          <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">Completed</span>
          <span className="shrink-0 rounded-chip bg-surface-soft px-1.5 py-0.5 text-[10px] tabular-nums text-ink-3">
            {count}
          </span>
        </button>
      </h2>

      {/* 1fr -> 0fr: collapses without measuring, and reduced-motion just
          snaps it. `inert` keeps the folded rows out of the tab order. */}
      <div
        id="completed-tasks"
        className={`grid transition-[grid-template-rows,opacity] duration-base ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        inert={!open}
      >
        <div className="overflow-hidden">
          <div className="border-t border-hair">
            <TaskRows
              tasks={tasks}
              selectedId={selectedId}
              removingId={removingId}
              onSelect={onSelect}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TaskRows({
  tasks,
  selectedId,
  removingId,
  onSelect,
}: {
  tasks: MemberTaskRow[];
  selectedId: string | null;
  removingId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {tasks.map((t) => {
        const selected = t.id === selectedId;
        const due = t.state !== "complete" ? dueLabel(t.deadline) : null;
        const removing = t.id === removingId;
        return (
          // Collapsing wrapper: 1fr -> 0fr needs no measurement and no
          // dependency, and the rows below slide up with it.
          <div
            key={t.id}
            className={`grid border-b border-hair transition-all duration-base ease-in-out last:border-b-0 ${
              removing ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            }`}
          >
            <div className="overflow-hidden">
              <button
                data-task-row={t.id}
                onClick={() => onSelect(t.id)}
                aria-current={selected}
                className={`flex w-full items-center gap-2 py-2.5 pr-3 text-left outline-none transition-colors duration-quick ${
                  selected
                    ? "bg-accent-tint"
                    : "hover:bg-surface-soft focus-visible:bg-surface-soft"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-9 w-[3px] shrink-0 rounded-r ${
                    selected ? "bg-accent" : "bg-transparent"
                  }`}
                />
                <TaskIcon t={t} selected={selected} />
                <span
                  className={`min-w-0 flex-1 truncate text-[12px] ${
                    selected
                      ? "font-medium text-accent-ink"
                      : t.state === "complete"
                      ? "text-ink-2"
                      : "text-ink"
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
            </div>
          </div>
        );
      })}
    </>
  );
}
