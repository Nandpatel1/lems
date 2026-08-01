import { BookOpen, Hammer, Layers } from "lucide-react";
import type { ItemType, TaskState } from "@/lib/types";

/** The single source of truth for how a type is named and coloured.
 *
 *  Only two colour buckets are available here: `warm` is reserved for
 *  deadlines/attention and `ship` is earned by shipping only, so borrowing
 *  either would fake urgency or fake credit. That leaves accent and neutral —
 *  which is why "both" shares Build's accent and is told apart by its icon
 *  rather than by a third colour. */
const TYPES = {
  learn: {
    label: "Learn",
    full: "Learn — research & knowledge",
    Icon: BookOpen,
    chip: "bg-surface-soft text-ink-2",
    ink: "text-ink-2",
  },
  build: {
    label: "Build",
    full: "Build — an action item to ship",
    Icon: Hammer,
    chip: "bg-accent-tint text-accent-ink",
    ink: "text-accent-ink",
  },
  both: {
    label: "Both",
    full: "Both — learn it, then ship it",
    Icon: Layers,
    chip: "bg-accent-tint text-accent-ink",
    ink: "text-accent-ink",
  },
} as const;

export const TYPE_OPTIONS = [
  { value: "learn", label: TYPES.learn.label, Icon: TYPES.learn.Icon },
  { value: "build", label: TYPES.build.label, Icon: TYPES.build.Icon },
  { value: "both", label: TYPES.both.label, Icon: TYPES.both.Icon },
] as const;

export default function TypeChip({
  type,
  state,
  dense = false,
}: {
  type: ItemType;
  /** Only used to mute the chip when parked — parked-ness itself is signalled
   *  by the row's moon icon and meta text, not by hiding what the item is. */
  state?: TaskState;
  /** Icon-only, no pill. For narrow rails (e.g. the 300px member list) where a
   *  full pill would squeeze the title. */
  dense?: boolean;
}) {
  // Fall back rather than crash if the database ever hands us a value the UI
  // doesn't know about yet.
  const t = TYPES[type] ?? TYPES.learn;
  const { Icon } = t;
  const muted = state === "parked" ? "opacity-60" : "";

  if (dense) {
    return (
      <Icon
        className={`h-3.5 w-3.5 shrink-0 ${t.ink} ${muted}`}
        aria-label={t.label}
      />
    );
  }

  return (
    <span
      title={t.full}
      className={`inline-flex shrink-0 items-center gap-1 rounded-chip px-2 py-0.5 text-[11px] ${t.chip} ${muted}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {t.label}
    </span>
  );
}
