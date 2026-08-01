"use client";

import { useEffect, useState } from "react";
import { Folder, FolderOpen, ChevronRight, ExternalLink, FileText, Trash2 } from "lucide-react";
import type { LibraryFolder, Resource } from "@/lib/types";
import AssignControl from "./AssignControl";
import TypeChip from "./TypeChip";
import ResourceDetailModal from "./ResourceDetailModal";
import ConfirmDialog from "./ConfirmDialog";
import {
  assignResourceToMember,
  assignFolderToMember,
  deleteFolder,
  deleteResource,
  getFolderDeletionImpact,
  getResourceDeletionImpact,
  type DeletionImpact,
} from "@/app/actions";

type Member = { id: string; name: string };
type DeleteKind = "folder" | "resource";

export default function FolderGroup({
  folder,
  members,
}: {
  folder: LibraryFolder;
  members: Member[];
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Resource | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmResource, setConfirmResource] = useState<Resource | null>(null);

  return (
    <section className="overflow-hidden rounded-card border border-hair bg-surface">
      {/* Folder header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="flex cursor-pointer items-center gap-2.5 px-4 py-3 transition-colors duration-quick hover:bg-surface-soft"
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-ink-3 transition-transform duration-quick ${
            open ? "rotate-90" : ""
          }`}
        />
        {open ? (
          <FolderOpen className="h-[18px] w-[18px] shrink-0 text-accent-ink" />
        ) : (
          <Folder className="h-[18px] w-[18px] shrink-0 text-accent-ink" />
        )}
        <span className="text-[14px] font-medium text-ink">{folder.name}</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="text-[12px] text-ink-3">{folder.resources.length} items</span>
          <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <AssignControl
              members={members}
              heading={`Assign all of "${folder.name}"`}
              triggerLabel="Assign folder"
              onAssign={(o, d) => assignFolderToMember(folder.id, o, d)}
            />
            <button
              onClick={() => setConfirmingDelete(true)}
              aria-label="Delete folder"
              className="grid h-7 w-7 place-items-center rounded-chip border border-hair-strong bg-surface text-ink-3 transition-colors duration-quick hover:border-danger hover:bg-danger-tint hover:text-danger-ink"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        </span>
      </div>

      {/* Resources */}
      {open && (
        <div className="border-t border-hair">
          {folder.resources.length === 0 ? (
            <p className="px-4 py-4 text-[12px] text-ink-3">No resources in this folder yet.</p>
          ) : (
            folder.resources.map((r) => (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => setDetail(r)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setDetail(r);
                }}
                className="flex cursor-pointer items-center gap-3 border-b border-hair px-4 py-3 transition-colors duration-quick last:border-b-0 hover:bg-surface-soft"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">{r.title}</p>
                  {/* On the meta line rather than beside the title: this line
                      already wraps by design, so the chip can never push the
                      title into a truncation it wouldn't otherwise need. */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-3">
                    <TypeChip type={r.type} />
                    {r.source && (
                      <span className="inline-flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> {r.source}
                      </span>
                    )}
                    {r.description && (
                      <span className="inline-flex items-center gap-1 text-accent-ink">
                        <FileText className="h-3 w-3" /> details
                      </span>
                    )}
                  </div>
                </div>
                <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <AssignControl
                    members={members}
                    heading={`Assign "${r.title}"`}
                    onAssign={(o, d) => assignResourceToMember(r.id, o, d)}
                  />
                  <button
                    onClick={() => setConfirmResource(r)}
                    aria-label="Delete resource"
                    className="grid h-7 w-7 place-items-center rounded-chip border border-hair-strong bg-surface text-ink-3 transition-colors duration-quick hover:border-danger hover:bg-danger-tint hover:text-danger-ink"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {detail && (
        <ResourceDetailModal resource={detail} onClose={() => setDetail(null)} />
      )}

      {confirmingDelete && (
        <DeleteConfirm
          kind="folder"
          id={folder.id}
          name={folder.name}
          onConfirm={() => deleteFolder(folder.id)}
          onClose={() => setConfirmingDelete(false)}
        />
      )}

      {confirmResource && (
        <DeleteConfirm
          kind="resource"
          id={confirmResource.id}
          name={confirmResource.title}
          onConfirm={() => deleteResource(confirmResource.id)}
          onClose={() => setConfirmResource(null)}
        />
      )}
    </section>
  );
}

/** Deleting from the library now cascades to everyone's assigned tasks, so
 *  say exactly who and what it takes down before the button is live. */
function DeleteConfirm({
  kind,
  id,
  name,
  onConfirm,
  onClose,
}: {
  kind: DeleteKind;
  id: string;
  name: string;
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}) {
  const [impact, setImpact] = useState<DeletionImpact | null>(null);

  useEffect(() => {
    let live = true;
    const load =
      kind === "folder" ? getFolderDeletionImpact(id) : getResourceDeletionImpact(id);
    load.then((i) => {
      if (live) setImpact(i);
    });
    return () => {
      live = false;
    };
  }, [kind, id]);

  const label = kind === "folder" ? "Delete folder" : "Delete resource";

  return (
    <ConfirmDialog
      title={label}
      confirmLabel={label}
      disabled={impact === null}
      message={
        <>
          Delete <span className="font-medium text-ink">&quot;{name}&quot;</span>
          {kind === "folder" ? " and everything inside it" : " from the library"}?
          {impact === null ? (
            <span className="mt-2 block text-ink-3">Checking what this affects…</span>
          ) : (
            <span className="mt-2 block">
              <ImpactLine kind={kind} impact={impact} />
            </span>
          )}
          <span className="mt-2 block text-ink-3">This can&apos;t be undone.</span>
        </>
      }
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}

function ImpactLine({ kind, impact }: { kind: DeleteKind; impact: DeletionImpact }) {
  const resources =
    kind === "folder"
      ? `${impact.resources} resource${impact.resources === 1 ? "" : "s"}`
      : null;

  if (impact.tasks === 0) {
    return (
      <>
        {resources ? `Removes ${resources}. ` : ""}Nobody has been assigned{" "}
        {kind === "folder" ? "anything from it" : "this"} yet.
      </>
    );
  }

  return (
    <>
      Also removes {resources ? `${resources} and ` : ""}
      <span className="font-medium text-ink">
        {impact.tasks} assigned task{impact.tasks === 1 ? "" : "s"}
      </span>{" "}
      across {impact.people} {impact.people === 1 ? "person" : "people"}
      {impact.completed > 0 && (
        <span className="text-danger-ink">
          {" "}
          — including {impact.completed} already completed, so that shipped credit
          disappears from their Team page too
        </span>
      )}
      .
    </>
  );
}
