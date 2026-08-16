"use client";

import { useState, useTransition } from "react";
import { Plus, X, Check } from "lucide-react";
import { addResource, createFolder } from "@/app/actions";
import { TYPE_OPTIONS, composeType, type BaseType } from "./TypeChip";
import Select from "./Select";
import Modal from "./Modal";
import MarkdownEditor from "./MarkdownEditor";

type FolderOpt = { id: string; name: string };

/** Models the shape of good details — a link, then what to do with it — rather
 *  than demonstrating syntax. The toolbar is what says "markdown"; a
 *  placeholder full of asterisks would only teach people to type asterisks. */
const DETAILS_PLACEHOLDER = `Paste the link, then say what matters about it.

https://youtube.com/watch?v=…

- First 20 minutes is the useful part
- Steal the templates, not the script`;

/** Capture only. Assigning an owner and a deadline is a separate, deliberate
 *  step on the resource once it exists (see AssignControl), so this form stays
 *  about *what* the thing is, not who has to do it.
 *
 *  There used to be a separate "Source" box next to Details, which asked for a
 *  word like "YouTube" — a field that cost a decision and returned almost
 *  nothing, while the link people actually wanted to paste went into Details
 *  anyway. Details absorbed it: it's markdown now, so a pasted link renders as
 *  a link, and where the resource lives is read back off that link rather than
 *  typed a second time. One field, doing more than the two it replaced. */
export default function AddResource({ folders }: { folders: FolderOpt[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [extraFolders, setExtraFolders] = useState<FolderOpt[]>([]);
  const allFolders = [...folders, ...extraFolders];

  const [title, setTitle] = useState("");
  /** The kinds of work this is. Both selected == the stored "both" type — the
   *  form asks what the thing *is*, not which of three boxes it fits in. */
  const [types, setTypes] = useState<BaseType[]>(["learn"]);
  const [folderId, setFolderId] = useState<string>(folders[0]?.id ?? "");
  const [description, setDescription] = useState("");

  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setTypes(["learn"]);
    setFolderId(folders[0]?.id ?? "");
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

  /** Toggle a kind on or off, keeping the canonical Learn-then-Build order.
   *  The last one on can't be switched off — an item with no type at all isn't
   *  a state worth having, so the control simply refuses rather than letting
   *  the form fall into an error. */
  function toggleType(value: BaseType) {
    setTypes((prev) => {
      if (prev.includes(value))
        return prev.length === 1 ? prev : prev.filter((p) => p !== value);
      return TYPE_OPTIONS.map((o) => o.value).filter(
        (o) => o === value || prev.includes(o)
      );
    });
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
        type: composeType(types),
        folderId,
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
        <Modal
          title="Add a resource"
          maxWidth="max-w-lg"
          onClose={() => setOpen(false)}
          onEnter={submit}
        >
          {/* The fields scroll; the decision to save doesn't. Details can grow
              tall now, and a Save button that drifts below the fold is a Save
              button people stop finding. The negative margin puts the
              scrollbar on the card's edge rather than inside the text. */}
          <div className="-mx-5 min-h-0 flex-1 overflow-y-auto px-5">
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
            <div className="flex items-baseline justify-between gap-2">
              <label className="text-[11px] text-ink-3">Type</label>
              {/* Says up front that this isn't a one-of-three choice — the
                  affordance for multi-select has to arrive before the click,
                  not be discovered by trying it. */}
              <span className="text-[11px] text-ink-3">Pick one or both</span>
            </div>
            <div
              role="group"
              aria-label="Type"
              className="mt-1 flex items-stretch gap-0.5 rounded-control border border-hair bg-surface p-0.5"
            >
              {TYPE_OPTIONS.map(({ value, label, Icon }) => {
                const on = types.includes(value);
                const locked = on && types.length === 1;
                return (
                  <button
                    key={value}
                    type="button"
                    // Checkboxes, not radios: each is independently on or off,
                    // and each is its own tab stop — the standard behaviour a
                    // screen reader is promised by this role.
                    role="checkbox"
                    aria-checked={on}
                    title={locked ? "At least one type is required" : undefined}
                    onClick={() => toggleType(value)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[13px] transition-colors duration-quick focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                      on
                        ? "bg-accent-tint font-medium text-accent-ink"
                        : "text-ink-2 hover:bg-surface-soft hover:text-ink"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                    {/* Always occupies its space, so toggling never nudges the
                        label sideways. */}
                    <Check
                      aria-hidden="true"
                      className={`h-3.5 w-3.5 shrink-0 transition-opacity duration-quick ${
                        on ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-ink-3">
              {types.length === 2
                ? "Learn it, then ship something with it."
                : types[0] === "build"
                ? "An action item — real work to ship."
                : "Research & knowledge — something to absorb."}
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

          {/* Last, and the largest thing on the form — the only field here
              that carries the actual substance of a resource. */}
          <div className="mt-4">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <label className="text-[11px] text-ink-3">Details</label>
              <span className="text-[11px] text-ink-3">Optional</span>
            </div>
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              minRows={5}
              placeholder={DETAILS_PLACEHOLDER}
              onSubmit={submit}
            />
          </div>

          <p className="mt-4 text-[11px] text-ink-3">
            Lands in the Library. Assign it to someone — with a deadline — from there.
          </p>

          {error && <p className="mt-3 text-[12px] text-warm-ink">{error}</p>}
          </div>

          <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-hair pt-4">
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
