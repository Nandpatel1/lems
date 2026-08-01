import { redirect } from "next/navigation";
import { getProfiles } from "@/lib/data";
import { getMemberTasks } from "@/app/actions";
import { getCurrentUserId } from "@/lib/session";
import MemberWorkspace from "@/components/MemberWorkspace";

export const dynamic = "force-dynamic";

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ task?: string }>;
}) {
  const { id } = await params;
  const { task } = await searchParams;
  const [profiles, tasks, uid] = await Promise.all([
    getProfiles(),
    getMemberTasks(id),
    getCurrentUserId(),
  ]);
  const member = profiles.find((p) => p.id === id);
  if (!member) redirect("/team");

  return (
    <MemberWorkspace
      member={member}
      currentUid={uid}
      tasks={tasks}
      // Where a notification points. Kept in the URL rather than consumed, so
      // the link survives a refresh and can be pasted to a teammate.
      focusTaskId={task ?? null}
    />
  );
}
