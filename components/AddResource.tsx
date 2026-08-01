"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { addResource, createFolder } from "@/app/actions";
import type { ItemType } from "@/lib/types";
import { TYPE_OPTIONS } from "./TypeChip";
import Select from "./Select";
import Modal from "./Modal";

type FolderOpt = { id: string; name: string };

/** Capture only. Assigning an owner and a deadline is a separate, deliberate
 *  step on the resource once it exists (see AssignControl), so this form stays
 *  about *what* the thing is, not who has to do it. */
export default function AddResource({ folders }: { folders: FolderOpt[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [extraFolders, setExtraFolders] = useState<FolderOpt[]>([]);
  const allFolders = [...folders, ...extraFolders];

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("learn");
  const [folderId, setFolderId] = useState<string>(folders[0]?.id ?? "");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");

  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setType("learn");
    setFolderId(folders[0]?.id ?? "");
    setSource("");
    setDescription("");
    setError(null);
    setNewFolderMode(false);
    setNewFolderName("");
    setFolderError(null);
  }

  function createNewFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    setFolderError(null);
    startTransition(async () => {
      const res = await createFolder(name);
      if (res.ok && res.id) {
        setExtraFolders((prev) => [...prev, { id: res.id!, name }]);
        setFolderId(res.id);
        setNewFolderMode(false);
        setNewFolderName("");
      } else {
        setFolderError(res.error ?? "Couldn't create folder");
      }
    });
  }

  /** Arrow keys move the selection and the focus together, wrapping at both
   *  ends — the standard radiogroup behaviour. */
  function selectByArrow(e: React.KeyboardEvent, i: number) {
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
    if (!back && !fwd) return;
    e.preventDefault();
    const next =
      (i + (fwd ? 1 : -1) + TYPE_OPTIONS.length) % TYPE_OPTIONS.length;
    setType(TYPE_OPTIONS[next].value);
    const group = e.currentTarget.parentElement;
    group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  }

  function submit() {
    if (!title.trim() || !folderId) {
      setError(!folderId ? "Please choose a folder" : "Title is required");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await addResource({
        title,
        type,
        folderId,
        source,
        description,
      });
      if (res.ok) {
        reset();
        setOpen(false);
      } else {
        setError(res.error ?? "Something went wrong");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-control bg-accent px-3.5 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" /> Add a resource
      </button>

      {open && (
        <Modal title="Add a resource" onClose={() => setOpen(false)} onEnter={submit}>
          <label className="block text-[11px] text-ink-3">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="e.g. Advanced cold email tactics"
            className="mt-1 w-full rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
          />

          {/* Directly after the title: what kind of work this is shapes how
              everyone reads the rest of the form. */}
          <div className="mt-3">
            <label className="block text-[11px] text-ink-3">Type</label>
            <div
              role="radiogroup"
              aria-label="Type"
              className="mt-1 flex items-stretch gap-0.5 rounded-control border border-hair bg-surface p-0.5"
            >
              {TYPE_OPTIONS.map(({ value, label, Icon }, i) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={type === value}
                  // Roving tabindex: the group is one tab stop, and arrows move
                  // within it — what `role="radiogroup"` promises a screen
                  // reader. Without this, Tab lands on all three and arrows do
                  // nothing, which is the pattern half-implemented.
                  tabIndex={type === value ? 0 : -1}
                  onClick={() => setType(value)}
                  onKeyDown={(e) => selectByArrow(e, i)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[13px] transition-colors duration-quick focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                    type === value
                      ? "bg-accent-tint font-medium text-accent-ink"
                      : "text-ink-2 hover:bg-surface-soft hover:text-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-ink-3">
              {type === "learn"
                ? "Research & knowledge — something to absorb."
                : type === "build"
                ? "An action item — real work to ship."
                : "Learn it, then ship something with it."}
            </p>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-ink-3">Folder</label>
              {!newFolderMode && (
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderMode(true);
                    setFolderError(null);
                  }}
                  className="text-[11px] font-medium text-accent-ink hover:underline"
                >
                  + New folder
                </button>
              )}
            </div>
            {newFolderMode ? (
              <div className="mt-1 flex items-center gap-1.5">
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  placeholder="New folder name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      createNewFolder();
                    }
                  }}
                  className="flex-1 rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={createNewFolder}
                  disabled={pending || !newFolderName.trim()}
                  className="rounded-control bg-accent px-3 py-2 text-[12px] font-medium text-white disabled:opacity-60"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderMode(false);
                    setNewFolderName("");
                    setFolderError(null);
                  }}
                  aria-label="Cancel new folder"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-control border border-hair text-ink-3 hover:bg-surface-soft"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-1">
                <Select
                  ariaLabel="Folder"
                  value={folderId}
                  onChange={setFolderId}
                  placeholder="Choose a folder"
                  options={allFolders.map((f) => ({ value: f.id, label: f.name }))}
                />
              </div>
            )}
            {folderError && <p className="mt-1 text-[11px] text-warm-ink">{folderError}</p>}
          </div>

          <label className="mt-3 block text-[11px] text-ink-3">Source</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="YouTube, Blog…"
            className="mt-1 w-full rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
          />

          <label className="mt-3 block text-[11px] text-ink-3">Details (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Context, links, what to focus on…"
            className="mt-1 w-full resize-none rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
          />

          <p className="mt-3 text-[11px] text-ink-3">
            Lands in the Library. Assign it to someone — with a deadline — from there.
          </p>

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
              disabled={pending || !title.trim() || !folderId}
              className="rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Add resource"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
