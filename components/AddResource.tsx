"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { addResource } from "@/app/actions";
import Select from "./Select";

type FolderOpt = { id: string; name: string };
type MemberOpt = { id: string; name: string };

export default function AddResource({
  folders,
  members,
}: {
  folders: FolderOpt[];
  members: MemberOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState<string>(folders[0]?.id ?? "");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [assignTo, setAssignTo] = useState<string>("");
  const [deadline, setDeadline] = useState("");

  function reset() {
    setTitle("");
    setFolderId(folders[0]?.id ?? "");
    setSource("");
    setDescription("");
    setAssignTo("");
    setDeadline("");
    setError(null);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await addResource({
        title,
        folderId: folderId || null,
        source,
        description,
        assignTo: assignTo || null,
        deadline: deadline || null,
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-hero border border-hair bg-canvas p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-medium text-ink">Add a resource</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-ink-3 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block text-[11px] text-ink-3">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced cold email tactics"
              className="mt-1 w-full rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-ink-3">Folder</label>
                <div className="mt-1">
                  <Select
                    ariaLabel="Folder"
                    value={folderId}
                    onChange={setFolderId}
                    options={[
                      { value: "", label: "No folder" },
                      ...folders.map((f) => ({ value: f.id, label: f.name })),
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-ink-3">Source</label>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="YouTube, Blog…"
                  className="mt-1 w-full rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                />
              </div>
            </div>

            <label className="mt-3 block text-[11px] text-ink-3">Details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Context, links, what to focus on…"
              className="mt-1 w-full resize-none rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-ink-3">Assign to</label>
                <div className="mt-1">
                  <Select
                    ariaLabel="Assign to"
                    value={assignTo}
                    onChange={setAssignTo}
                    options={[
                      { value: "", label: "No one (library only)" },
                      ...members.map((m) => ({ value: m.id, label: m.name })),
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-ink-3">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={!assignTo}
                  className="mt-1 w-full rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent disabled:opacity-50"
                />
              </div>
            </div>

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
                disabled={pending || !title.trim()}
                className="rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-60"
              >
                {pending ? "Saving…" : "Add resource"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
