"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Send } from "lucide-react";
import { getTaskDetail, saveNote, addComment, type TaskDetail } from "@/app/actions";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-hero border border-hair bg-canvas p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-[16px] font-medium text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-3 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="text-[11px] text-ink-3">Your notes &amp; learnings</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={persistNote}
          rows={4}
          placeholder="What did you learn? What will you do with it?"
          className="mt-1 w-full resize-none rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
        />
        <div className="mt-1 h-4 text-[11px] text-ship-ink">
          {noteSaved ? "Saved" : ""}
        </div>

        <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-hair pt-3">
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
      </div>
    </div>
  );
}
