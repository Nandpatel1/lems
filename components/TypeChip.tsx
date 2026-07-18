import type { ItemType, TaskState } from "@/lib/types";

export default function TypeChip({
  type,
  state,
}: {
  type: ItemType;
  state?: TaskState;
}) {
  if (state === "parked") {
    return (
      <span className="rounded-chip border border-hair bg-surface px-2 py-0.5 text-[11px] text-ink-2">
        Parked
      </span>
    );
  }
  if (type === "build") {
    return (
      <span className="rounded-chip bg-accent-tint px-2 py-0.5 text-[11px] text-accent-ink">
        Build
      </span>
    );
  }
  return (
    <span className="rounded-chip bg-accent-tint px-2 py-0.5 text-[11px] text-accent-ink">
      Learn
    </span>
  );
}
