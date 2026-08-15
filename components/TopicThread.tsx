"use client";

import { useOptimistic, useState, useTransition } from "react";
import { MessageSquare } from "lucide-react";
import { addTopicReply } from "@/app/actions";
import ThreadLog, { type ThreadEntry } from "./ThreadLog";
import ThreadComposer from "./ThreadComposer";
import type { TopicReply, TopicState } from "@/lib/types";

/** Marks an entry that exists only in this browser so far. Server ids are
 *  uuids, so this can never collide with a real one. */
const PENDING_PREFIX = "pending:";

/** The conversation on a topic, on its own page.
 *
 *  Unlike the task discussion this doesn't scroll inside a box — a topic page
 *  has nothing else on it, so the thread is the page and the browser keeps
 *  your reading position when it grows. That's why the two share a log
 *  component but not a container.
 *
 *  Replies land optimistically: the server action revalidates this route, so
 *  the real entry replaces the placeholder when the refresh arrives, and
 *  React drops the optimistic state on its own. */
export default function TopicThread({
  topicId,
  replies,
  state,
  currentUid,
  currentInitial,
}: {
  topicId: string;
  replies: TopicReply[];
  state: TopicState;
  currentUid: string | null;
  currentInitial: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shown, addOptimistic] = useOptimistic(
    replies as ThreadEntry[],
    (current, entry: ThreadEntry) => [...current, entry]
  );

  const pendingIds = new Set(
    shown.filter((e) => e.id.startsWith(PENDING_PREFIX)).map((e) => e.id)
  );

  function post(body: string) {
    setError(null);
    startTransition(async () => {
      addOptimistic({
        id: `${PENDING_PREFIX}${Date.now()}`,
        author: "You",
        authorId: currentUid,
        authorInitial: currentInitial,
        body,
        createdAt: new Date().toISOString(),
      });
      const res = await addTopicReply(topicId, body);
      if (!res.ok) setError(res.error ?? "Couldn't post that. Try again.");
    });
  }

  return (
    <section>
      <p className="mb-3 flex items-center gap-1.5 text-[11px] text-ink-3">
        <MessageSquare className="h-3.5 w-3.5" />
        Replies
        {replies.length > 0 && <span className="tabular-nums">· {replies.length}</span>}
      </p>

      <ThreadLog
        entries={shown}
        currentUid={currentUid}
        pendingIds={pendingIds}
        empty={
          <div className="rounded-control border border-dashed border-hair px-3.5 py-3">
            <p className="text-[12px] text-ink-2">No replies yet.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
              Say what you think — agreement counts too. A topic nobody answers
              reads like nobody read it.
            </p>
          </div>
        }
      />

      {/* An inactive topic still takes replies; saying so beats letting someone
          type a paragraph into what they assume is a closed thread. */}
      {state === "inactive" && (
        <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
          This one&apos;s marked inactive — still open if you&apos;ve got
          something to add.
        </p>
      )}

      {error && <p className="mt-3 text-[12px] text-warm-ink">{error}</p>}

      <div className="mt-3">
        <ThreadComposer
          placeholder="Add your thoughts…"
          ariaLabel="Write a reply"
          hint=" · the team is notified"
          pending={pending}
          onPost={post}
        />
      </div>
    </section>
  );
}
