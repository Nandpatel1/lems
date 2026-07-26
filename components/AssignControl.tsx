"use client";

import { useState, useTransition } from "react";
import { UserPlus, X, Check } from "lucide-react";

type Member = { id: string; name: string };
type Result = { ok: boolean; error?: string };

export default function AssignControl({
  members,
  heading,
  triggerLabel = "Assign",
  onAssign,
}: {
  members: Member[];
  heading: string;
  triggerLabel?: string;
  onAssign: (ownerId: string, deadline: string | null) => Promise<Result>;
}) {
  const [open, setOpen] = useState(false);
  const [ownerId, setOwnerId] = useState(members[0]?.id ?? "");
  const [deadline, setDeadline] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await onAssign(ownerId, deadline || null);
      if (r.ok) {
        setDone(true);
        setOpen(false);
        setTimeout(() => setDone(false), 2500);
      } else {
        setError(r.error ?? "Something went wrong");
      }
    });
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1 rounded-chip border px-2 py-1 text-[11px] transition-colors duration-quick ${
          done
            ? "border-ship-tint bg-ship-tint text-ship-ink"
            : "border-hair-strong bg-surface text-ink-2 hover:bg-surface-soft"
        }`}
      >
        {done ? (
          <>
            <Check className="h-3 w-3" /> Assigned
          </>
        ) : (
          <>
            <UserPlus className="h-3 w-3" /> {triggerLabel}
          </>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-hero border border-hair bg-canvas p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-medium text-ink">{heading}</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-ink-3 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block text-[11px] text-ink-3">To</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="mt-1 w-full rounded-control border border-hair bg-surface px-2 py-2 text-[13px] text-ink outline-none focus:border-accent"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <label className="mt-3 block text-[11px] text-ink-3">Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
            />

            {error && <p className="mt-3 text-[12px] text-warm-ink">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-control border border-hair px-4 py-2 text-[13px] text-ink-2 hover:bg-surface-soft"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={pending || !ownerId}
                className="rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-60"
              >
                {pending ? "Assigning…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
