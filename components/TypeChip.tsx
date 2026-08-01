import { BookOpen, Hammer } from "lucide-react";
import type { ItemType, TaskState } from "@/lib/types";

/** The single source of truth for how a type is named and coloured.
 *
 *  There are exactly two kinds of work: Learn and Build. An item can carry
 *  both at once — the database still stores that as the single enum value
 *  "both", but the UI never says that word. It wears both tags instead, so
 *  "which of these is build work?" stays one visual target across every
 *  screen. */
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
} as const;

/** A single kind of work — what the picker offers and what a chip renders. */
export type BaseType = keyof typeof TYPES;

export const TYPE_OPTIONS = [
  { value: "learn", label: TYPES.learn.label, Icon: TYPES.learn.Icon },
  { value: "build", label: TYPES.build.label, Icon: TYPES.build.Icon },
] as const satisfies readonly { value: BaseType; label: string; Icon: unknown }[];

/** Unpack a stored type into the kinds it actually is. Total by design: an
 *  unknown value from the database falls back to Learn rather than crashing. */
export function typeParts(type: ItemType): BaseType[] {
  if (type === "both") return ["learn", "build"];
  return [type === "build" ? "build" : "learn"];
}

/** The reverse, for the picker: both kinds selected is stored as "both". */
export function composeType(parts: readonly BaseType[]): ItemType {
  if (parts.length >= 2) return "both";
  return parts[0] ?? "learn";
}

/** Prose form — "Learn", "Build", or "Learn & Build". For sentences and
 *  aria-labels, where a chip can't go. */
export function typeLabel(type: ItemType): string {
  return typeParts(type)
    .map((p) => TYPES[p].label)
    .join(" & ");
}

export default function TypeChip({
  type,
  state,
  dense = false,
}: {
  type: ItemType;
  /** Only used to mute the chip when parked — parked-ness itself is signalled
   *  by the row's moon icon and meta text, not by hiding what the item is. */
  state?: TaskState;
  /** Icons only, no pills. For narrow rails where full pills would squeeze the
   *  title. */
  dense?: boolean;
}) {
  const parts = typeParts(type);
  const muted = state === "parked" ? "opacity-60" : "";

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 ${muted}`}>
      {parts.map((p) => {
        const t = TYPES[p];
        const { Icon } = t;
        return dense ? (
          <Icon key={p} className={`h-3.5 w-3.5 shrink-0 ${t.ink}`} aria-label={t.label} />
        ) : (
          <span
            key={p}
            title={t.full}
            className={`inline-flex shrink-0 items-center gap-1 rounded-chip px-2 py-0.5 text-[11px] ${t.chip}`}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {t.label}
          </span>
        );
      })}
    </span>
  );
}
