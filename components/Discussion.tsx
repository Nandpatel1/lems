"use client";

import { MessageSquare } from "lucide-react";
import type { TaskComment } from "@/app/actions";
import ThreadLog from "./ThreadLog";
import ThreadComposer from "./ThreadComposer";

type Person = { id: string; name: string; initial: string };

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
 *  Sits inside a modal, so the log is capped and scrolls rather than growing
 *  the pane. General-discussion topics use the same log on a full page — see
 *  TopicThread. */
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

      <ThreadLog
        entries={comments}
        currentUid={currentUid}
        autoScroll
        className="flex max-h-[22rem] flex-col gap-4 overflow-y-auto pr-0.5"
        empty={
          <div className="rounded-control border border-dashed border-hair px-3.5 py-3">
            <p className="text-[12px] text-ink-2">Nothing written down yet.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
              Use this for context, decisions and questions —{" "}
              {shared
                ? "everyone assigned to this work sees the same thread."
                : "it stays with the work, so whoever picks it up next has it."}
            </p>
          </div>
        }
      />

      <div className="mt-3">
        <ThreadComposer
          placeholder="Add context, a decision, or a question…"
          ariaLabel="Write an entry"
          hint={shared ? " · everyone assigned is notified" : undefined}
          pending={pending}
          onPost={onPost}
        />
      </div>
    </section>
  );
}
