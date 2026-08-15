import Link from "next/link";
import { timeAgo } from "@/lib/relative-time";
import TopicStateToggle from "./TopicStateToggle";
import type { Topic } from "@/lib/types";

/** One row in the Discuss list.
 *
 *  Reads top-down as: what it's about, what was said, who's in it and how warm
 *  it is. The reply count and the last-activity stamp sit together at the
 *  bottom because they answer the same question — is there something here for
 *  me — and separating them would make the reader assemble it themselves.
 *
 *  The state toggle is a sibling of the link rather than nested inside it: a
 *  button inside an anchor is invalid, and reserving the space with padding
 *  keeps the title from ever running under it. */
export default function TopicCard({ topic }: { topic: Topic }) {
  const active = topic.state === "active";
  const replies = topic.replyCount;

  return (
    <div className="relative rounded-card border border-hair bg-surface transition-colors duration-quick hover:border-hair-strong">
      <Link
        href={`/discuss/${topic.id}`}
        className="block rounded-card px-4 py-3.5 pr-24 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        <h2
          className={`text-[14px] font-medium leading-snug ${
            active ? "text-ink" : "text-ink-2"
          }`}
        >
          {topic.title}
        </h2>

        {topic.description && (
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-2">
            {topic.description}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-3">
          {/* Overlapping so the group reads as one object — "these people",
              not a list of three separate facts. */}
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
          <span className="text-ink-2">{topic.author}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {replies === 0 ? "No replies yet" : `${replies} ${replies === 1 ? "reply" : "replies"}`}
          </span>
          <span aria-hidden="true">·</span>
          <span>{timeAgo(topic.lastActivityAt)}</span>
        </div>
      </Link>

      <div className="absolute right-2.5 top-2.5">
        <TopicStateToggle topicId={topic.id} state={topic.state} />
      </div>
    </div>
  );
}
