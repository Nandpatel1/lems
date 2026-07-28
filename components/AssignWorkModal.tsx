"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Search, BookOpen, Hammer, Library } from "lucide-react";
import Modal from "./Modal";
import {
  getAssignableResources,
  assignResourcesToMember,
  type AssignableFolder,
} from "@/app/actions";

export default function AssignWorkModal({
  member,
  isSelf,
  onClose,
  onAssigned,
}: {
  member: { id: string; name: string };
  isSelf: boolean;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [folders, setFolders] = useState<AssignableFolder[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let live = true;
    getAssignableResources(member.id).then((f) => {
      if (live) setFolders(f);
    });
    return () => {
      live = false;
    };
  }, [member.id]);

  // Filtering hides non-matches but never hides what's already selected, so a
  // pick can't silently vanish while you keep typing.
  const visible = useMemo(() => {
    if (!folders) return [];
    const q = query.trim().toLowerCase();
    if (!q) return folders;
    return folders
      .map((f) => ({
        ...f,
        resources: f.resources.filter(
          (r) => r.title.toLowerCase().includes(q) || picked.has(r.id)
        ),
      }))
      .filter((f) => f.resources.length > 0);
  }, [folders, query, picked]);

  const available = useMemo(
    () => (folders ?? []).flatMap((f) => f.resources).filter((r) => !r.assigned),
    [folders]
  );

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleFolder(folder: AssignableFolder) {
    const ids = folder.resources.filter((r) => !r.assigned).map((r) => r.id);
    const allPicked = ids.length > 0 && ids.every((id) => picked.has(id));
    setPicked((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (allPicked) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function submit() {
    if (picked.size === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await assignResourcesToMember(
        Array.from(picked),
        member.id,
        deadline || null
      );
      if (res.ok) {
        onAssigned();
        onClose();
      } else {
        setError(res.error ?? "Something went wrong");
      }
    });
  }

  const who = isSelf ? "yourself" : member.name;

  return (
    <Modal
      title={`Assign work to ${who}`}
      maxWidth="max-w-xl"
      onClose={onClose}
      onEnter={submit}
    >
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the library…"
          aria-label="Search the library"
          className="w-full rounded-control border border-hair bg-surface py-2 pl-9 pr-3 text-[13px] text-ink outline-none focus:border-accent"
        />
      </div>

      {/* Resource list */}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-card border border-hair bg-surface">
        {folders === null ? (
          <p className="px-4 py-8 text-center text-[12px] text-ink-3">
            Loading the library…
          </p>
        ) : folders.length === 0 ? (
          <EmptyState
            title="The library is empty"
            body="Add a resource in the Library first — every task comes from there."
          />
        ) : available.length === 0 ? (
          <EmptyState
            title={isSelf ? "You have everything" : `${member.name} has everything`}
            body="Every resource in the library is already assigned. Add something new to the Library to assign more."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No matches"
            body={`Nothing in the library matches "${query.trim()}".`}
          />
        ) : (
          visible.map((folder) => {
            const selectable = folder.resources.filter((r) => !r.assigned);
            const allPicked =
              selectable.length > 0 && selectable.every((r) => picked.has(r.id));
            return (
              <section key={folder.id} className="border-b border-hair last:border-b-0">
                <div className="flex items-center gap-2 bg-surface-soft px-3.5 py-2">
                  <span className="text-[11px] font-medium text-ink-2">{folder.name}</span>
                  <span className="text-[11px] text-ink-3">
                    {folder.resources.length}
                  </span>
                  {selectable.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleFolder(folder)}
                      className="ml-auto rounded-chip px-1.5 py-0.5 text-[11px] text-accent-ink transition-colors duration-quick hover:bg-accent-tint"
                    >
                      {allPicked ? "Clear" : "Select all"}
                    </button>
                  )}
                </div>

                {folder.resources.map((r) => {
                  const checked = picked.has(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={r.assigned}
                      aria-pressed={checked}
                      onClick={() => toggle(r.id)}
                      className={`flex w-full items-center gap-3 border-b border-hair px-3.5 py-2.5 text-left transition-colors duration-quick last:border-b-0 ${
                        r.assigned
                          ? "cursor-default"
                          : checked
                          ? "bg-accent-tint"
                          : "hover:bg-surface-soft"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors duration-quick ${
                          r.assigned
                            ? "border-hair bg-surface-soft"
                            : checked
                            ? "border-accent bg-accent"
                            : "border-hair-strong bg-surface"
                        }`}
                      >
                        {(checked || r.assigned) && (
                          <Check
                            className={`h-3 w-3 ${
                              r.assigned ? "text-ink-3" : "text-white"
                            }`}
                          />
                        )}
                      </span>

                      {r.type === "build" ? (
                        <Hammer className="h-3.5 w-3.5 shrink-0 text-ship-ink" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-accent-ink" />
                      )}

                      <span
                        className={`min-w-0 flex-1 truncate text-[13px] ${
                          r.assigned ? "text-ink-3" : "text-ink"
                        }`}
                      >
                        {r.title}
                      </span>

                      {r.assigned ? (
                        <span className="shrink-0 text-[11px] text-ink-3">
                          already assigned
                        </span>
                      ) : (
                        r.source && (
                          <span className="shrink-0 text-[11px] text-ink-3">{r.source}</span>
                        )
                      )}
                    </button>
                  );
                })}
              </section>
            );
          })
        )}
      </div>

      {/* Deadline + submit */}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <label
            htmlFor="assign-deadline"
            className="block text-[11px] text-ink-3"
          >
            Deadline (optional)
          </label>
          <input
            id="assign-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 rounded-control border border-hair bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-control border border-hair px-4 py-2 text-[13px] text-ink-2 transition-colors duration-quick hover:bg-surface-soft"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={pending || picked.size === 0}
            className="rounded-control bg-accent px-4 py-2 text-[13px] font-medium text-white transition-transform duration-quick active:scale-[0.98] disabled:opacity-50"
          >
            {pending
              ? "Assigning…"
              : picked.size === 0
              ? "Select items to assign"
              : `Assign ${picked.size} item${picked.size === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-right text-[12px] text-danger-ink">{error}</p>}
    </Modal>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <Library className="mx-auto h-5 w-5 text-ink-3" />
      <p className="mt-2 text-[13px] font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[12px] text-ink-2">{body}</p>
    </div>
  );
}
