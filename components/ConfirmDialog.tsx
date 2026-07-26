"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    startTransition(async () => {
      const res = await onConfirm();
      if (res.ok) onClose();
      else setError(res.error ?? "Something went wrong");
    });
  }

  return (
    <Modal title={title} maxWidth="max-w-sm" onClose={onClose} onEnter={go}>
      <p className="text-[13px] leading-relaxed text-ink-2">{message}</p>
      {error && <p className="mt-2 text-[12px] text-danger-ink">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-control border border-hair px-4 py-2 text-[13px] text-ink-2 hover:bg-surface-soft"
        >
          Cancel
        </button>
        <button
          onClick={go}
          disabled={pending}
          className="rounded-control bg-danger px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
