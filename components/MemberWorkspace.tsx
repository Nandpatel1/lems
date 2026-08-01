"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Circle,
  Folder,
  Moon,
  Send,
  Bell,
  FileText,
  UserMinus,
  Library,
} from "lucide-react";
import {
  getTaskDetail,
  addComment,
  pokeTeammate,
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

  const [selectedId, setSelectedId] = useState<string | null>(tasks[0]?.id ?? null);

  const [comments, setComments] = useState<Comment[] | null>(null);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();

  const [nudgeMsg, setNudgeMsg] = useState("");
  const [nudgeSent, setNudgeSent] = useState(false);

  const [confirmUnassign, setConfirmUnassign] = useState<MemberTaskRow | null>(null);
  const [origin, setOrigin] = useState<"row" | "pane">("pane");
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
  const pct = counted.length
    ? Math.round((completed.length / counted.length) * 100)
    : 0;

  const selected = counted.find((t) => t.id === selectedId) ?? null;

  function openUnassign(task: MemberTaskRow, from: "row" | "pane") {
    setOrigin(from);
    setConfirmUnassign(task);
  }

  /** Collapse the row, swap the pane, then settle: refresh and move focus.
   *  Everything visible starts at t=0 so the whole event reads as one beat. */
  function afterUnassign(task: MemberTaskRow) {
    const wasSelected = selectedId === task.id;
    const nextId =
      origin === "row"
        ? (() => {
            const ids = activeRows.map((t) => t.id);
            const i = ids.indexOf(task.id);
            return ids[i + 1] ?? ids[i - 1] ?? null;
          })()
        : null;

    setRemovingId(task.id);
    setLiveMsg(
      `Unassigned "${task.title}" from ${isSelf ? "your queue" : member.name}. It's still in the Library.`
    );
    if (wasSelected) {
      setSelectedId(null);
      setNotice(task.title);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
    }

    // setTimeout, not onTransitionEnd: reduced-motion collapses the duration to
    // ~0 and the event would never fire, stranding the row on screen.
    setTimeout(() => {
      setRemovedIds((prev) => new Set(prev).add(task.id));
      setRemovingId(null);
      router.refresh();
      const target = nextId
        ? document.querySelector<HTMLElement>(`[data-task-row="${nextId}"]`)
        : paneRef.current;
      target?.focus();
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
        {/* Information, not a second way to assign — work is handed out from
            the Library. Hidden under sm, where the header has no room. */}
        {counted.length > 0 && (
          <div
            className="hidden shrink-0 items-center gap-2 sm:flex"
            role="img"
            aria-label={`${completed.length} of ${counted.length} assigned items shipped`}
          >
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-soft">
              <div
                className="h-full rounded-full bg-ship transition-[width] duration-base ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-ink-3">{pct}%</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr] md:items-start">
        {/* Left: task list */}
        <div className="flex flex-col gap-4">
          <Section
            label={`Active · ${active.length}`}
            empty="Nothing active."
            tasks={activeRows}
            selectedId={selectedId}
            removingId={removingId}
            memberName={member.name}
            isSelf={isSelf}
            onSelect={setSelectedId}
            onUnassign={(t) => openUnassign(t, "row")}
          />
          <Section
            label={`Completed · ${completed.length}`}
            empty="Nothing shipped yet."
            tasks={completedRows}
            selectedId={selectedId}
            removingId={removingId}
            memberName={member.name}
            isSelf={isSelf}
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
                    onClick={() => openUnassign(selected, "pane")}
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

function Section({
  label,
  empty,
  tasks,
  selectedId,
  removingId,
  memberName,
  isSelf,
  onSelect,
  onUnassign,
}: {
  label: string;
  empty: string;
  tasks: MemberTaskRow[];
  selectedId: string | null;
  removingId: string | null;
  memberName: string;
  isSelf: boolean;
  onSelect: (id: string) => void;
  /** Omitted for the Completed section on purpose: you can clear active work
   *  straight from the list, but shipped work has to be opened first. That
   *  removes the expensive mis-click instead of merely guarding it. */
  onUnassign?: (task: MemberTaskRow) => void;
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
                  <div
                    className={`group relative flex w-full items-center pr-2 transition-colors duration-quick ${
                      selected ? "bg-accent-tint" : "hover:bg-surface-soft"
                    }`}
                  >
                    <button
                      data-task-row={t.id}
                      onClick={() => onSelect(t.id)}
                      aria-current={selected}
                      className="flex min-w-0 flex-1 items-center gap-2 py-2.5 text-left outline-none focus-visible:bg-surface-soft"
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
                      {/* Icon-only: this rail is 300px on desktop, so a full
                          pill would eat the title at any viewport width. */}
                      {!t.isFolder && (
                        <TypeChip type={t.type} state={t.state} dense />
                      )}
                      {t.note && <FileText className="h-3 w-3 shrink-0 text-ink-3" />}
                      {due && (
                        // Fades out as the button fades in, same 160ms, same
                        // spot — otherwise the button half-covers the date and
                        // it reads as a rendering bug.
                        <span
                          className={`shrink-0 text-[10px] transition-opacity duration-quick md:group-hover:opacity-0 md:group-focus-within:opacity-0 ${
                            due.overdue ? "text-warm-ink" : "text-ink-3"
                          }`}
                        >
                          {due.text}
                        </span>
                      )}
                    </button>

                    {onUnassign && (
                      // Overlaid above md so it costs no width at rest; static
                      // and full touch-size below md, where there's no hover.
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnassign(t);
                        }}
                        aria-label={
                          isSelf
                            ? `Remove "${t.title}" from your queue`
                            : `Unassign "${t.title}" from ${memberName}`
                        }
                        className={`ml-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-chip text-ink-3 transition duration-quick hover:bg-danger-tint hover:text-danger-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger md:absolute md:right-1.5 md:top-1/2 md:ml-0 md:h-7 md:w-7 md:-translate-y-1/2 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 ${
                          selected ? "md:bg-accent-tint" : "md:bg-surface-soft"
                        }`}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
