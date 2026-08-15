"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { setTopicState } from "@/app/actions";
import type { TopicState } from "@/lib/types";

const OPTIONS: { value: TopicState; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/** The dot is what carries the state; the label spells it out. Filled and
 *  green for a live conversation, hollow for one that's been set aside. */
function StateDot({ state }: { state: TopicState }) {
  return (
    <span
      aria-hidden="true"
      className={`h-[7px] w-[7px] shrink-0 rounded-full ${
        state === "active" ? "bg-ship" : "border border-hair-strong"
      }`}
    />
  );
}

/** Active / Inactive as a dropdown rather than a toggle.
 *
 *  A button that just says "Active" is ambiguous twice over: it doesn't look
 *  changeable, and if you do guess it's a control you still can't tell whether
 *  the word is the current state or the action. A closed select with a chevron
 *  answers both — the label is the state, and the chevron promises there are
 *  other states to pick.
 *
 *  Borrows the interaction contract of `Select` (Escape, arrows, Enter, click
 *  outside, role=listbox) but is sized as a chip, because on a card this sits
 *  beside the metadata rather than in a form.
 *
 *  Optimistic: the label flips immediately and reverts if the write fails.
 *  Nobody should wait on relabelling a conversation. */
export default function TopicStateSelect({
  topicId,
  state,
  size = "sm",
}: {
  topicId: string;
  state: TopicState;
  size?: "sm" | "md";
}) {
  const [shown, setShown] = useState(state);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // The server is the source of truth on navigation and revalidation; the
  // optimistic value only stands in until it catches up.
  useEffect(() => setShown(state), [state]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: TopicState) {
    setOpen(false);
    if (next === shown) return;
    const previous = shown;
    setShown(next);
    startTransition(async () => {
      const res = await setTopicState(topicId, next);
      if (!res.ok) setShown(previous);
    });
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Topic status"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={pending}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-chip border border-hair bg-surface transition-colors duration-quick outline-none hover:border-hair-strong hover:bg-surface-soft focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60 ${
          size === "md" ? "px-2.5 py-1.5 text-[12px]" : "px-2 py-1 text-[11px]"
        } ${shown === "active" ? "text-ink-2" : "text-ink-3"}`}
      >
        <StateDot state={shown} />
        {shown === "active" ? "Active" : "Inactive"}
        <ChevronDown
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 text-ink-3 transition-transform duration-quick ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        // Right-aligned: on a card this sits at the right edge, and a
        // left-anchored menu would hang off it.
        <div
          role="listbox"
          aria-label="Topic status"
          className="absolute right-0 top-full z-50 mt-1.5 w-32 overflow-hidden rounded-control border border-hair bg-surface p-1 shadow-md"
        >
          {OPTIONS.map((o) => {
            const isSel = o.value === shown;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={isSel}
                onClick={() => choose(o.value)}
                className={`flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12px] transition-colors duration-quick hover:bg-surface-soft ${
                  isSel ? "font-medium text-accent-ink" : "text-ink"
                }`}
              >
                <StateDot state={o.value} />
                <span className="flex-1 truncate">{o.label}</span>
                {isSel && <Check className="h-3.5 w-3.5 shrink-0 text-accent-ink" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
