"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  deleteTopic,
  getTopicDeletionImpact,
  type TopicDeletionImpact,
} from "@/app/actions";
import ConfirmDialog from "./ConfirmDialog";

/** Delete a topic, with the cost stated first.
 *
 *  Same shape as the library's delete: a quiet trash control that only turns
 *  red on approach, and a confirm step that counts what goes with it. A topic
 *  is shared, so the thing worth surfacing isn't "are you sure" — it's the
 *  replies other people wrote that are about to disappear. The confirm stays
 *  disabled until that count is in, so nobody can click through the question
 *  before it has been asked.
 *
 *  `redirectTo` is for the topic page, where deleting the thing you're looking
 *  at has to take you somewhere; in the grid, revalidation is enough. */
export default function TopicDeleteButton({
  topicId,
  title,
  redirectTo,
}: {
  topicId: string;
  title: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [impact, setImpact] = useState<TopicDeletionImpact | null>(null);

  useEffect(() => {
    if (!confirming) return;
    let live = true;
    getTopicDeletionImpact(topicId).then((i) => {
      if (live) setImpact(i);
    });
    return () => {
      live = false;
    };
  }, [confirming, topicId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete topic "${title}"`}
        className="grid shrink-0 place-items-center rounded-chip border border-hair bg-surface px-1.5 text-ink-3 outline-none transition-colors duration-quick hover:border-danger hover:bg-danger-tint hover:text-danger-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {confirming && (
        <ConfirmDialog
          title="Delete topic"
          confirmLabel="Delete topic"
          disabled={impact === null}
          message={
            <>
              Delete <span className="font-medium text-ink">&quot;{title}&quot;</span>{" "}
              and its whole thread?
              {impact === null ? (
                <span className="mt-2 block text-ink-3">
                  Checking what this affects…
                </span>
              ) : (
                <span className="mt-2 block">
                  <ImpactLine impact={impact} />
                </span>
              )}
              <span className="mt-2 block text-ink-3">This can&apos;t be undone.</span>
            </>
          }
          onConfirm={async () => {
            const res = await deleteTopic(topicId);
            if (res.ok && redirectTo) router.push(redirectTo);
            return res;
          }}
          onClose={() => {
            setConfirming(false);
            setImpact(null);
          }}
        />
      )}
    </>
  );
}

function ImpactLine({ impact }: { impact: TopicDeletionImpact }) {
  if (impact.replies === 0) {
    return <>Nobody has replied to it yet.</>;
  }
  return (
    <>
      Also removes{" "}
      <span className="font-medium text-ink">
        {impact.replies} {impact.replies === 1 ? "reply" : "replies"}
      </span>{" "}
      from {impact.people} {impact.people === 1 ? "person" : "people"}.
    </>
  );
}
