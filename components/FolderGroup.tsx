"use client";

import { useState } from "react";
import { Folder, FolderOpen, ChevronRight, ExternalLink, FileText } from "lucide-react";
import type { LibraryFolder, Resource } from "@/lib/types";
import AssignControl from "./AssignControl";
import ResourceDetailModal from "./ResourceDetailModal";
import { assignResourceToMember, assignFolderToMember } from "@/app/actions";

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
          <span onClick={(e) => e.stopPropagation()}>
            <AssignControl
              members={members}
              heading={`Assign all of "${folder.name}"`}
              triggerLabel="Assign folder"
              onAssign={(o, d) => assignFolderToMember(folder.id, o, d)}
            />
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
                <span onClick={(e) => e.stopPropagation()}>
                  <AssignControl
                    members={members}
                    heading={`Assign "${r.title}"`}
                    onAssign={(o, d) => assignResourceToMember(r.id, o, d)}
                  />
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {detail && (
        <ResourceDetailModal resource={detail} onClose={() => setDetail(null)} />
      )}
    </section>
  );
}
