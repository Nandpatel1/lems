export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-surface-soft" />
          <div className="h-3 w-56 rounded bg-surface-soft" />
        </div>
        <div className="h-9 w-32 rounded-control bg-surface-soft" />
      </div>

      {/* Content rows */}
      <div className="overflow-hidden rounded-card border border-hair bg-surface">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-hair px-4 py-4 last:border-b-0"
          >
            <div className="h-4 w-4 shrink-0 rounded-full bg-surface-soft" />
            <div className="h-4 flex-1 rounded bg-surface-soft" style={{ maxWidth: `${60 - i * 8}%` }} />
            <div className="h-5 w-16 shrink-0 rounded-chip bg-surface-soft" />
          </div>
        ))}
      </div>
    </div>
  );
}
