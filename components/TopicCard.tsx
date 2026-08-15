import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { timeAgo } from "@/lib/relative-time";
import TopicStateSelect from "./TopicStateSelect";
import type { Topic } from "@/lib/types";

/** One tile in the Discuss grid.
 *
 *  Reads top-down: what it's about, who raised it and when, then as much of the
 *  thinking as fits. The footer is the bit you act on — who's in it, how busy
 *  it is, and the control that changes its state.
 *
 *  Splitting the footer out from the link does two jobs at once: a button can't
 *  legally nest inside an anchor, and the hairline makes the state control read
 *  as its own affordance rather than part of the thing you click to open.
 *
 *  Sized to its content, not stretched to the row (the grid sets `items-start`
 *  for this). Forcing every card to the height of the tallest one in its row
 *  gives a title-only topic a void where its description would be, which reads
 *  as a rendering fault rather than as brevity. */
export default function TopicCard({ topic }: { topic: Topic }) {
  const active = topic.state === "active";

  return (
    <article className="flex flex-col rounded-card border border-hair bg-surface transition-colors duration-quick hover:border-hair-strong">
      <Link
        href={`/discuss/${topic.id}`}
        className="flex flex-col rounded-t-card px-4 pb-3 pt-3.5 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        <h2
          className={`line-clamp-2 text-[14px] font-medium leading-snug ${
            active ? "text-ink" : "text-ink-2"
          }`}
        >
          {topic.title}
        </h2>

        <p className="mt-1 text-[11px] text-ink-3">
          <span className="text-ink-2">{topic.author}</span>
          <span aria-hidden="true"> · </span>
          {timeAgo(topic.lastActivityAt)}
        </p>

        {topic.description && (
          <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-ink-2">
            {topic.description}
          </p>
        )}
      </Link>

      <div className="flex items-center justify-between gap-2 border-t border-hair px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          {/* Overlapping so the group reads as one object — "these people",
              not a list of separate facts. */}
          <span className="flex -space-x-1.5" aria-hidden="true">
            {topic.participants.slice(0, 4).map((p) => (
              <span
                key={p.id}
                className="grid h-5 w-5 place-items-center rounded-full bg-accent-tint text-[9px] font-medium text-accent-ink ring-2 ring-surface"
              >
                {p.initial}
              </span>
            ))}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-ink-3">
            <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="tabular-nums">{topic.replyCount}</span>
            <span className="sr-only">
              {topic.replyCount === 1 ? "reply" : "replies"}
            </span>
          </span>
        </span>

        <TopicStateSelect topicId={topic.id} state={topic.state} />
      </div>
    </article>
  );
}
