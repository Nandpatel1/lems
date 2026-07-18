import { Folder, ListOrdered, ExternalLink } from "lucide-react";
import TypeChip from "@/components/TypeChip";
import AddResource from "@/components/AddResource";
import { allTags } from "@/lib/seed";
import { getLibrary } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const libraryFolders = await getLibrary();
  const folderOpts = libraryFolders.map((f) => ({ id: f.id, name: f.name }));
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Library</h1>
          <p className="mt-0.5 text-[12px] text-ink-3">
            Your shared knowledge base — organize it however works, reshape it anytime.
          </p>
        </div>
        <AddResource folders={folderOpts} />
      </div>

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-hair bg-surface px-3 py-1 text-[12px] text-ink-2"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {libraryFolders.map((folder) => (
          <section key={folder.id} className="rounded-card border border-hair bg-surface">
            <div className="flex items-center gap-2 border-b border-hair px-4 py-3">
              <Folder className="h-4 w-4 text-accent-ink" />
              <span className="text-[14px] font-medium text-ink">{folder.name}</span>
              {folder.ordered && (
                <span className="inline-flex items-center gap-1 rounded-chip bg-surface-soft px-2 py-0.5 text-[11px] text-ink-2">
                  <ListOrdered className="h-3 w-3" /> ordered path
                </span>
              )}
              <span className="ml-auto text-[12px] text-ink-3">
                {folder.resources.length} items
              </span>
            </div>

            <div>
              {folder.resources.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 border-b border-hair/60 px-4 py-3 last:border-b-0"
                >
                  <TypeChip type={r.type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink">{r.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-3">
                      {r.source && (
                        <span className="inline-flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> {r.source}
                        </span>
                      )}
                      {r.tags.map((t) => (
                        <span key={t}>#{t}</span>
                      ))}
                    </div>
                  </div>
                  {r.effortMin && (
                    <span className="shrink-0 text-[11px] text-ink-3">≈ {r.effortMin}m</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
