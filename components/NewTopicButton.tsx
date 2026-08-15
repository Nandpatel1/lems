"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createTopic } from "@/app/actions";
import Modal from "./Modal";

/** Start a topic: a title and, optionally, what you're actually thinking.
 *
 *  Two fields and nothing else — no owner, no deadline, no type. The whole
 *  point of this surface is that not everything has to become work, so a form
 *  that asked those questions would defeat it.
 *
 *  Lands you in the thread rather than back on the list: you just wrote an
 *  opening post, and the next thing you want is to see it as everyone else
 *  will. */
export default function NewTopicButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setError(null);
  }

  function submit() {
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createTopic(title, description);
      if (res.ok) {
        setTitle("");
        setDescription("");
        setOpen(false);
        if (res.id) router.push(`/discuss/${res.id}`);
      } else {
        setError(res.error ?? "Couldn't start the topic");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-control bg-accent px-3.5 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" /> New topic
      </button>

      {open && (
        <Modal title="Start a topic" onClose={close} onEnter={submit}>
          <label className="block text-[11px] text-ink-3">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="e.g. Should we niche down to one industry?"
            className="mt-1 w-full rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
          />

          <label className="mt-3 block text-[11px] text-ink-3">
            What&apos;s on your mind (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Lay it out — the idea, the doubt, what you've already tried, what you want from the others…"
            className="mt-1 w-full resize-none rounded-control border border-hair bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink outline-none focus:border-accent"
          />

          <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
            Visible to the whole team, and they&apos;ll be notified. Nobody gets
            a task out of this — it&apos;s a conversation.
          </p>

          {error && <p className="mt-3 text-[12px] text-warm-ink">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={close}
              className="rounded-control border border-hair px-4 py-2 text-[13px] text-ink-2 hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={pending || !title.trim()}
              className="rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Posting…" : "Post topic"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
