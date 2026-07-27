"use client";

import { useState } from "react";
import { Folder, FolderOpen, ChevronRight, ExternalLink, FileText, Trash2 } from "lucide-react";
import type { LibraryFolder, Resource } from "@/lib/types";
import AssignControl from "./AssignControl";
import ResourceDetailModal from "./ResourceDetailModal";
import ConfirmDialog from "./ConfirmDialog";
import {
  assignResourceToMember,
  assignFolderToMember,
  deleteFolder,
  deleteResource,
  deleteUnfiledResources,
} from "@/app/actions";

type Member = { id: string; name: string };

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
  const [confirmClearUnfiled, setConfirmClearUnfiled] = useState(false);
  const isUnfiled = folder.id === "__unfiled__";

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
          {isUnfiled ? (
            folder.resources.length > 0 && (
              <span onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setConfirmClearUnfiled(true)}
                  className="inline-flex items-center gap-1 rounded-chip border border-hair-strong bg-surface px-2 py-1 text-[11px] text-danger-ink transition-colors duration-quick hover:border-danger hover:bg-danger-tint"
                >
                  <Trash2 className="h-3 w-3" /> Clear all
                </button>
              </span>
            )
          ) : (
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
          )}
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
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-3">
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
        <ConfirmDialog
          title="Delete folder"
          message={
            <>
              Delete <span className="font-medium text-ink">&quot;{folder.name}&quot;</span> and
              its {folder.resources.length} resource
              {folder.resources.length === 1 ? "" : "s"}? Any tasks created from this folder are
              removed too. This can&apos;t be undone.
            </>
          }
          confirmLabel="Delete folder"
          onConfirm={() => deleteFolder(folder.id)}
          onClose={() => setConfirmingDelete(false)}
        />
      )}

      {confirmResource && (
        <ConfirmDialog
          title="Delete resource"
          message={
            <>
              Delete <span className="font-medium text-ink">&quot;{confirmResource.title}&quot;</span>{" "}
              from the library? This can&apos;t be undone.
            </>
          }
          confirmLabel="Delete resource"
          onConfirm={() => deleteResource(confirmResource.id)}
          onClose={() => setConfirmResource(null)}
        />
      )}

      {confirmClearUnfiled && (
        <ConfirmDialog
          title="Clear unfiled resources"
          message={
            <>
              Delete all {folder.resources.length} unfiled resource
              {folder.resources.length === 1 ? "" : "s"}? This can&apos;t be undone.
            </>
          }
          confirmLabel="Delete all"
          onConfirm={() => deleteUnfiledResources()}
          onClose={() => setConfirmClearUnfiled(false)}
        />
      )}
    </section>
  );
}
