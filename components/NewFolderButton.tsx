"use client";

import { useState, useTransition } from "react";
import { FolderPlus } from "lucide-react";
import { createFolder } from "@/app/actions";
import Modal from "./Modal";

export default function NewFolderButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createFolder(name);
      if (res.ok) {
        setName("");
        setOpen(false);
      } else {
        setError(res.error ?? "Couldn't create folder");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-hair-strong bg-surface px-3.5 py-2 text-[13px] text-ink-2 transition-colors duration-quick hover:bg-surface-soft"
      >
        <FolderPlus className="h-4 w-4" /> New folder
      </button>

      {open && (
        <Modal title="New folder" maxWidth="max-w-sm" onClose={() => setOpen(false)} onEnter={submit}>
          <label className="block text-[11px] text-ink-3">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="e.g. Paid Ads"
            className="mt-1 w-full rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
          />
          {error && <p className="mt-2 text-[12px] text-warm-ink">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-control border border-hair px-4 py-2 text-[13px] text-ink-2 hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={pending || !name.trim()}
              className="rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create folder"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
