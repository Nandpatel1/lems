import AddResource from "@/components/AddResource";
import NewFolderButton from "@/components/NewFolderButton";
import FolderGroup from "@/components/FolderGroup";
import { getLibrary, getProfiles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [libraryFolders, profiles] = await Promise.all([getLibrary(), getProfiles()]);
  const folderOpts = libraryFolders.map((f) => ({ id: f.id, name: f.name }));
  const members = profiles.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Library</h1>
          <p className="mt-0.5 text-[12px] text-ink-3">
            Your shared knowledge base — organize it however works, reshape it anytime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewFolderButton />
          <AddResource folders={folderOpts} />
        </div>
      </div>

      {libraryFolders.length === 0 ? (
        <div className="rounded-card border border-hair bg-surface px-4 py-12 text-center">
          <p className="text-[15px] font-medium text-ink">Nothing here yet</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-ink-2">
            Add your first resource to start building the team&apos;s knowledge base.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {libraryFolders.map((folder) => (
            <FolderGroup key={folder.id} folder={folder} members={members} />
          ))}
        </div>
      )}
    </div>
  );
}
