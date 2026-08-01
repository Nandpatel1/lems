"use client";

import { useEffect, useState, useTransition } from "react";
import { Send, Check, UserMinus } from "lucide-react";
import {
  getTaskDetail,
  saveNote,
  addComment,
  completeTask,
  unassignTask,
  type TaskDetail,
} from "@/app/actions";
import type { ItemType } from "@/lib/types";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import TypeChip from "./TypeChip";

/** The closing question should match the kind of work: asking "what did you
 *  learn" about a shipped landing page gets you a shrug and an empty box. */
function notesLabel(type: ItemType | undefined): string {
  if (type === "build") return "Your notes & what you shipped";
  if (type === "both") return "Your notes — learnings & what you shipped";
  return "Your notes & learnings";
}

function notesPrompt(type: ItemType | undefined): string {
  if (type === "build")
    return "What did you ship? A quick line helps the team review it.";
  if (type === "both")
    return "What did you learn, and what did you ship with it?";
  return "What did you learn? A quick line helps the team review it.";
}

export default function TaskDetailModal({
  taskId,
  title,
  onClose,
}: {
  taskId: string;
  title: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [comment, setComment] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    getTaskDetail(taskId).then((d) => {
      if (!active) return;
      setDetail(d);
      setNote(d.note ?? "");
    });
    return () => {
      active = false;
    };
  }, [taskId]);

  function persistNote() {
    startTransition(async () => {
      await saveNote(taskId, note);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 1500);
    });
  }

  function submitComment() {
    if (!comment.trim()) return;
    const body = comment.trim();
    setComment("");
    startTransition(async () => {
      await addComment(taskId, body);
      const d = await getTaskDetail(taskId);
      setDetail(d);
    });
  }

  function markDone() {
    startTransition(async () => {
      await saveNote(taskId, note);
      await completeTask(taskId);
      onClose();
    });
  }

  const done = detail?.state === "complete";

  return (
    <>
      <Modal
      maxWidth="max-w-lg"
      onClose={onClose}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {title}
          {detail && <TypeChip type={detail.type} />}
          {done && (
            <span className="rounded-chip bg-ship-tint px-2 py-0.5 text-[11px] text-ship-ink">
              Done
            </span>
          )}
        </span>
      }
    >
      <label className="text-[11px] text-ink-3">
        {done ? "Notes — what got done" : notesLabel(detail?.type)}
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={persistNote}
        rows={4}
        placeholder={notesPrompt(detail?.type)}
        className="mt-1 w-full resize-none rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
      />
      <div className="mt-1 h-4 text-[11px] text-ship-ink">{noteSaved ? "Saved" : ""}</div>

      {detail?.canComplete && (
        <button
          onClick={markDone}
          disabled={pending}
          className="mt-1 inline-flex items-center gap-1.5 self-start rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" /> Mark done
        </button>
      )}

      <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-hair pt-3">
        <p className="mb-2 text-[11px] text-ink-3">Comments</p>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {detail === null ? (
            <p className="text-[12px] text-ink-3">Loading…</p>
          ) : detail.comments.length === 0 ? (
            <p className="text-[12px] text-ink-3">No comments yet.</p>
          ) : (
            detail.comments.map((c) => (
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

        <div className="mt-3 flex items-center gap-2">
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
            className="grid h-9 w-9 place-items-center rounded-control bg-accent text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 border-t border-hair pt-3">
        <button
          onClick={() => setConfirmingDelete(true)}
          className="inline-flex items-center gap-1.5 text-[12px] text-danger-ink transition-colors duration-quick hover:underline"
        >
          <UserMinus className="h-3.5 w-3.5" /> Remove from my queue
        </button>
      </div>
      </Modal>

      {confirmingDelete && (
        <ConfirmDialog
          title="Remove from your queue"
          message={
            <>
              Take <span className="font-medium text-ink">&quot;{title}&quot;</span> off your
              plate?
              <span className="mt-2 block">
                It stays in the Library, so it can be assigned again any time.
              </span>
              <span className="mt-2 block text-ink-3">
                Your notes and the comments on it are removed.
              </span>
            </>
          }
          confirmLabel="Remove"
          onConfirm={async () => {
            const res = await unassignTask(taskId);
            if (res.ok) onClose();
            return res;
          }}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
