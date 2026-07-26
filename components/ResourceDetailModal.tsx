"use client";

import { useState, useTransition } from "react";
import { X, ExternalLink } from "lucide-react";
import { saveResourceDescription } from "@/app/actions";
import type { Resource } from "@/lib/types";

export default function ResourceDetailModal({
  resource,
  onClose,
}: {
  resource: Resource;
  onClose: () => void;
}) {
  const [desc, setDesc] = useState(resource.description ?? "");
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  function persist() {
    startTransition(async () => {
      await saveResourceDescription(resource.id, desc);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-hero border border-hair bg-canvas p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-[16px] font-medium text-ink">{resource.title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-3 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {resource.source && (
          <a
            href={/^https?:\/\//.test(resource.source) ? resource.source : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-ink-2"
          >
            <ExternalLink className="h-3.5 w-3.5" /> {resource.source}
          </a>
        )}

        <label className="block text-[12px] font-medium text-ink">Details</label>
        <p className="mb-1.5 text-[11px] text-ink-3">
          Anything useful about this — context, links, what to focus on. Everyone can see it.
        </p>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={persist}
          rows={6}
          placeholder="Add details for this resource…"
          className="w-full resize-none rounded-control border border-hair bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink outline-none focus:border-accent"
        />
        <div className="mt-1 h-4 text-[11px] text-ship-ink">{saved ? "Saved" : ""}</div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-control border border-hair px-4 py-2 text-[13px] text-ink-2 hover:bg-surface-soft"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
