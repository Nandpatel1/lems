"use client";

import { useEffect, useRef, useState } from "react";

/** Beyond this the composer scrolls instead of growing — a long write-up
 *  shouldn't push the thread it's replying to off the screen. */
const COMPOSER_MAX_PX = 180;

/** The box you write an entry in.
 *
 *  A textarea, not a message field: these entries are paragraphs. Enter
 *  therefore has to mean newline, and posting gets its own labelled button
 *  rather than a send arrow — the affordance should say "write something",
 *  not "fire off a line".
 *
 *  The placeholder and hint are the caller's, because what's worth writing —
 *  and who finds out you wrote it — is exactly what differs between threads. */
export default function ThreadComposer({
  placeholder,
  hint,
  ariaLabel,
  pending,
  onPost,
}: {
  placeholder: string;
  hint?: React.ReactNode;
  ariaLabel: string;
  pending: boolean;
  onPost: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const boxRef = useRef<HTMLTextAreaElement>(null);

  /** Grow with the text, up to a cap, then scroll. */
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_PX)}px`;
  }, [draft]);

  function post() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    onPost(body);
  }

  return (
    <div className="rounded-control border border-hair bg-surface transition-colors duration-quick focus-within:border-accent">
      <textarea
        ref={boxRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            post();
          }
        }}
        rows={1}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-3"
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <p className="pl-1 text-[10px] text-ink-3">
          <kbd className="font-sans">⌘</kbd>
          <kbd className="font-sans">↵</kbd> to post
          {hint}
        </p>
        <button
          onClick={post}
          disabled={pending || !draft.trim()}
          className="rounded-control bg-accent px-3 py-1.5 text-[12px] font-medium text-white outline-none transition-transform duration-quick focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.98] disabled:opacity-40"
        >
          Post
        </button>
      </div>
    </div>
  );
}
