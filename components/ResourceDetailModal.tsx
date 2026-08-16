"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Pencil, FileText } from "lucide-react";
import { saveResourceDescription } from "@/app/actions";
import type { Resource } from "@/lib/types";
import { firstUrl, domainOf } from "@/lib/markdown";
import Modal from "./Modal";
import TypeChip from "./TypeChip";
import Markdown from "./Markdown";
import MarkdownEditor from "./MarkdownEditor";

const PLACEHOLDER = `Paste the link, then say what matters about it.

https://youtube.com/watch?v=…

- First 20 minutes is the useful part
- Steal the templates, not the script`;

/** Read first, edit on purpose.
 *
 *  This used to open straight into a bare textarea, which was fine when details
 *  were two lines of plain text and wrong the moment they became markdown:
 *  nobody wants to read `**this**` when they came here to find out what the
 *  resource is. So the default state is the rendered thing, and editing is one
 *  deliberate click away.
 *
 *  Saving is explicit rather than on blur, for the same reason. With a toolbar
 *  in the field, blur fires whenever a click lands anywhere else, and a field
 *  that saves at moments you didn't choose is a field you stop trusting. */
export default function ResourceDetailModal({
  resource,
  onClose,
}: {
  resource: Resource;
  onClose: () => void;
}) {
  const [value, setValue] = useState(resource.description ?? "");
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Where this lives, read off the first link in the details rather than typed
  // into a field of its own.
  const url = firstUrl(value);
  const domain = domainOf(url);

  function startEditing() {
    setDraft(value);
    setEditing(true);
  }

  function save() {
    const next = draft;
    startTransition(async () => {
      const res = await saveResourceDescription(resource.id, next);
      if (!res.ok) return;
      setValue(next.trim());
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <Modal maxWidth="max-w-lg" title={resource.title} onClose={onClose}>
      <div className="-mx-5 min-h-0 flex-1 overflow-y-auto px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <TypeChip type={resource.type} />
          {domain && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-2 transition-colors duration-quick hover:text-accent-ink"
            >
              <ExternalLink className="h-3.5 w-3.5" /> {domain}
            </a>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[11px] text-ink-3">Details</span>
          <span className="flex items-center gap-3">
            {/* Holds its space so the row never reflows when the word lands. */}
            <span
              className={`text-[11px] text-ship-ink transition-opacity duration-quick ${
                saved ? "opacity-100" : "opacity-0"
              }`}
            >
              Saved
            </span>
            {!editing && value && (
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 rounded-chip border border-hair px-2 py-1 text-[11px] text-ink-2 transition-colors duration-quick hover:bg-surface-soft hover:text-ink"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}
          </span>
        </div>

        <div className="mt-1.5">
          {editing ? (
            <MarkdownEditor
              value={draft}
              onChange={setDraft}
              minRows={8}
              autoFocus
              placeholder={PLACEHOLDER}
              onSubmit={save}
            />
          ) : value ? (
            <Markdown>{value}</Markdown>
          ) : (
            // An empty details field is the most common state in a fresh
            // library, so it gets a real invitation rather than a grey dash —
            // and the whole block is the target, not a small link inside it.
            <button
              onClick={startEditing}
              className="flex w-full flex-col items-center gap-1.5 rounded-control border border-dashed border-hair-strong px-4 py-6 text-center transition-colors duration-quick hover:border-accent hover:bg-surface-soft"
            >
              <FileText className="h-4 w-4 text-ink-3" />
              <span className="text-[13px] font-medium text-ink">Add details</span>
              <span className="max-w-[34ch] text-[11px] leading-relaxed text-ink-3">
                The link, and what to focus on. Everyone on the team sees it.
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex shrink-0 items-center justify-end gap-2 border-t border-hair pt-4">
        {editing ? (
          <>
            <button
              onClick={() => setEditing(false)}
              className="rounded-control border border-hair px-4 py-2 text-[13px] text-ink-2 transition-colors duration-quick hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={pending}
              className="rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save details"}
            </button>
          </>
        ) : (
          <button
            onClick={onClose}
            className="rounded-control border border-hair px-4 py-2 text-[13px] text-ink-2 transition-colors duration-quick hover:bg-surface-soft"
          >
            Done
          </button>
        )}
      </div>
    </Modal>
  );
}
