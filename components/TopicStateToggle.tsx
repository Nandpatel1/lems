"use client";

import { useEffect, useState, useTransition } from "react";
import { setTopicState } from "@/app/actions";
import type { TopicState } from "@/lib/types";

/** Active or Inactive, flipped in place by anyone who's looking at it.
 *
 *  Quiet on purpose. Nearly every topic in a healthy list is Active, so a
 *  filled pill on every card would be noise dressed up as information — the
 *  dot carries the state and the chrome stays out of the way. The hit target
 *  is still a full button, and it announces both the state it's in and what
 *  clicking will do, because a control labelled only "Active" is ambiguous
 *  about which of the two it means.
 *
 *  Optimistic: the dot flips immediately and reverts if the write fails.
 *  Toggling a label is not something anyone should wait on. */
export default function TopicStateToggle({
  topicId,
  state,
  size = "sm",
}: {
  topicId: string;
  state: TopicState;
  size?: "sm" | "md";
}) {
  const [shown, setShown] = useState(state);
  const [pending, startTransition] = useTransition();

  // The server is the source of truth on navigation and revalidation; the
  // optimistic value only stands in until it catches up.
  useEffect(() => setShown(state), [state]);

  const active = shown === "active";

  function toggle() {
    const next: TopicState = active ? "inactive" : "active";
    setShown(next);
    startTransition(async () => {
      const res = await setTopicState(topicId, next);
      if (!res.ok) setShown(active ? "active" : "inactive");
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={
        active
          ? "Active topic — mark it inactive"
          : "Inactive topic — mark it active"
      }
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-chip border border-transparent transition-colors duration-quick outline-none hover:border-hair-strong hover:bg-surface-soft focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60 ${
        size === "md" ? "px-2.5 py-1.5 text-[12px]" : "px-2 py-1 text-[11px]"
      } ${active ? "text-ink-2" : "text-ink-3"}`}
    >
      <span
        aria-hidden="true"
        className={`h-[7px] w-[7px] shrink-0 rounded-full transition-colors duration-quick ${
          active ? "bg-ship" : "border border-hair-strong"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </button>
  );
}
