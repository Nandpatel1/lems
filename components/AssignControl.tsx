"use client";

import { useState, useTransition } from "react";
import { UserPlus, Check } from "lucide-react";
import Select from "./Select";
import Modal from "./Modal";

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
        <Modal title={heading} maxWidth="max-w-sm" onClose={() => setOpen(false)} onEnter={submit}>
          <label className="block text-[11px] text-ink-3">To</label>
          <div className="mt-1">
            <Select
              ariaLabel="Assign to"
              value={ownerId}
              onChange={setOwnerId}
              options={members.map((m) => ({ value: m.id, label: m.name }))}
            />
          </div>

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
        </Modal>
      )}
    </>
  );
}
