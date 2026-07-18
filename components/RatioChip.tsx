import { ArrowRight } from "lucide-react";

export default function RatioChip({
  learned,
  applied,
}: {
  learned: number;
  applied: number;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-3 py-1.5">
      <span className="text-[12px] font-medium text-accent-ink">{learned} learned</span>
      <ArrowRight className="h-3 w-3 text-ink-3" />
      <span className="text-[12px] font-medium text-ship-ink">{applied} applied</span>
    </span>
  );
}
