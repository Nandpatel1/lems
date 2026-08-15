import { MessagesSquare, ChevronRight } from "lucide-react";
import { getTopics } from "@/lib/data";
import NewTopicButton from "@/components/NewTopicButton";
import TopicCard from "@/components/TopicCard";

export const dynamic = "force-dynamic";

export default async function DiscussPage() {
  const topics = await getTopics();
  const active = topics.filter((t) => t.state === "active");
  const inactive = topics.filter((t) => t.state === "inactive");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Discuss</h1>
          <p className="mt-0.5 text-[12px] text-ink-3">
            Ideas, doubts and notes that don&apos;t need to become tasks. Anyone
            can start one; everyone can weigh in.
          </p>
        </div>
        <NewTopicButton />
      </div>

      {topics.length === 0 ? (
        <div className="rounded-card border border-hair bg-surface px-4 py-12 text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-surface-soft">
            <MessagesSquare className="h-5 w-5 text-ink-3" />
          </span>
          <p className="mt-3 text-[15px] font-medium text-ink">Nothing to talk about yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-ink-2">
            Got an idea, a doubt, or something the others should know? Start a
            topic instead of filing a task nobody asked for.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {active.length === 0 ? (
            <p className="rounded-card border border-dashed border-hair px-4 py-6 text-center text-[12px] text-ink-3">
              Nothing active right now. Everything below has been set aside.
            </p>
          ) : (
            // Same column rhythm as the Team board, so the two grids in this
            // app read as one system rather than two ideas about width.
            <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((t) => (
                <TopicCard key={t.id} topic={t} />
              ))}
            </div>
          )}

          {/* Set aside, not filed away: collapsed so it doesn't compete with
              live conversation, but one click from the same page — reopening
              an old thread shouldn't mean going looking for it. Native
              details/summary, so it costs no JavaScript and works before
              hydration. */}
          {inactive.length > 0 && (
            <details className="group mt-2">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-control px-1 py-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-3 outline-none transition-colors duration-quick hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-accent">
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-quick group-open:rotate-90" />
                Inactive
                <span className="tabular-nums normal-case tracking-normal">
                  · {inactive.length}
                </span>
              </summary>
              <div className="mt-2 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {inactive.map((t) => (
                  <TopicCard key={t.id} topic={t} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
