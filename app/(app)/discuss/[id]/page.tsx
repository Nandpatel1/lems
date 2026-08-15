import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getTopicDetail, getCurrentProfile } from "@/lib/data";
import { getCurrentUserId } from "@/lib/session";
import { shortDate } from "@/lib/relative-time";
import TopicStateSelect from "@/components/TopicStateSelect";
import TopicDeleteButton from "@/components/TopicDeleteButton";
import TopicThread from "@/components/TopicThread";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [topic, uid, profile] = await Promise.all([
    getTopicDetail(id),
    getCurrentUserId(),
    getCurrentProfile(),
  ]);
  if (!topic) redirect("/discuss");

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <Link
        href="/discuss"
        className="-ml-1 inline-flex w-fit items-center gap-1 rounded-control px-1 py-0.5 text-[12px] text-ink-3 outline-none transition-colors duration-quick hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Discuss
      </Link>

      <header>
        {/* Title and state on one line: whether this is live is part of
            reading the title, not a separate fact to go find. */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[20px] font-medium leading-snug text-ink">
            {topic.title}
          </h1>
          <div className="flex shrink-0 items-stretch gap-1.5 pt-0.5">
            <TopicStateSelect topicId={topic.id} state={topic.state} size="md" />
            <TopicDeleteButton
              topicId={topic.id}
              title={topic.title}
              // Deleting what you're reading has to take you somewhere.
              redirectTo="/discuss"
            />
          </div>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-3">
          <span
            aria-hidden="true"
            className="grid h-5 w-5 place-items-center rounded-full bg-accent-tint text-[9px] font-medium text-accent-ink"
          >
            {topic.authorInitial}
          </span>
          <span>
            <span className="text-ink-2">{topic.author}</span> started this
          </span>
          <span aria-hidden="true">·</span>
          <span>{shortDate(topic.createdAt)}</span>
        </p>
      </header>

      {/* The opening post gets a surface of its own. It isn't a reply and
          shouldn't sit in the log pretending to be one — the thread answers
          it. */}
      {topic.description && (
        <div className="rounded-card border border-hair bg-surface px-4 py-3.5">
          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink">
            {topic.description}
          </p>
        </div>
      )}

      <TopicThread
        topicId={topic.id}
        replies={topic.replies}
        state={topic.state}
        currentUid={uid}
        currentInitial={profile.initial}
      />
    </div>
  );
}
