"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { TaskComment } from "@/app/actions";

/** Beyond this the composer scrolls instead of growing — a long write-up
 *  shouldn't push the thread it's replying to off the screen. */
const COMPOSER_MAX_PX = 180;

type Person = { id: string; name: string; initial: string };

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Entries carry a clock time; the date lives once, on the separator above
 *  them. A log spanning weeks stays readable without repeating itself. */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nameList(people: Person[]): string {
  const names = people.map((p) => p.name);
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** The shared record for a piece of work: context, decisions, questions and
 *  what got figured out. It hangs off the resource, not off one person's
 *  assignment, so everybody holding the work reads and writes the same thread.
 *
 *  Deliberately not a chat: entries are flat prose in a dated log rather than
 *  bubbles, and the composer is a textarea that takes paragraphs. The shape
 *  should invite a written update, not a one-line reply. */
export default function Discussion({
  comments,
  assignees,
  currentUid,
  pending,
  onPost,
}: {
  comments: TaskComment[] | null;
  assignees: Person[];
  currentUid: string | null;
  pending: boolean;
  onPost: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  /** Oldest first, so the newest entry is where you land — same as any log. */
  useEffect(() => {
    if (!comments || comments.length === 0) return;
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [comments]);

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

  const others = assignees.filter((p) => p.id !== currentUid);
  const shared = assignees.length > 1;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <p className="flex items-center gap-1.5 text-[11px] text-ink-3">
          <MessageSquare className="h-3.5 w-3.5" />
          Discussion
          {comments && comments.length > 0 && (
            <span className="tabular-nums">· {comments.length}</span>
          )}
        </p>
        {/* Naming the people is what makes "this is not private" legible.
            Without it, a shared thread is indistinguishable from a DM. */}
        {shared && (
          <p className="rounded-chip bg-surface-soft px-2 py-0.5 text-[10px] text-ink-3">
            Shared with <span className="text-ink-2">{nameList(others)}</span>
          </p>
        )}
      </div>

      <div
        ref={logRef}
        className="flex max-h-[22rem] flex-col gap-4 overflow-y-auto pr-0.5"
      >
        {comments === null ? (
          <p className="text-[12px] text-ink-3">Loading…</p>
        ) : comments.length === 0 ? (
          <div className="rounded-control border border-dashed border-hair px-3.5 py-3">
            <p className="text-[12px] text-ink-2">Nothing written down yet.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
              Use this for context, decisions and questions —{" "}
              {shared
                ? "everyone assigned to this work sees the same thread."
                : "it stays with the work, so whoever picks it up next has it."}
            </p>
          </div>
        ) : (
          comments.map((c, i) => {
            const mine = Boolean(currentUid && c.authorId === currentUid);
            const newDay = i === 0 || dayKey(c.createdAt) !== dayKey(comments[i - 1].createdAt);
            return (
              <div key={c.id} className={newDay && i > 0 ? "mt-1" : undefined}>
                {newDay && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-ink-3">
                      {dayLabel(c.createdAt)}
                    </span>
                    <span aria-hidden="true" className="h-px flex-1 bg-hair" />
                  </div>
                )}
                {/* Avatar in a gutter, prose at full width — a written entry,
                    not a speech bubble. */}
                <article className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-medium ${
                      mine
                        ? "bg-accent-tint text-accent-ink"
                        : "bg-surface-soft text-ink-2"
                    }`}
                  >
                    {c.authorInitial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2 text-[11px]">
                      <span className="font-medium text-ink-2">
                        {mine ? "You" : c.author}
                      </span>
                      <span className="text-ink-3 tabular-nums">
                        {timeOfDay(c.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink">
                      {c.body}
                    </p>
                  </div>
                </article>
              </div>
            );
          })
        )}
      </div>

      {/* A textarea, not a message box: these entries are paragraphs. Enter
          therefore has to mean newline, and posting gets its own labelled
          button rather than a send arrow. */}
      <div className="mt-3 rounded-control border border-hair bg-surface transition-colors duration-quick focus-within:border-accent">
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
          placeholder="Add context, a decision, or a question…"
          aria-label="Write an entry"
          className="block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-3"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <p className="pl-1 text-[10px] text-ink-3">
            <kbd className="font-sans">⌘</kbd>
            <kbd className="font-sans">↵</kbd> to post
            {shared && " · everyone assigned is notified"}
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
    </section>
  );
}
