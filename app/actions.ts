"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CURRENT_USER } from "@/lib/constants";
import { getCurrentUserId } from "@/lib/session";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function currentUid(): Promise<string> {
  return (await getCurrentUserId()) ?? CURRENT_USER;
}

/** Every deletion ripples across all four surfaces, so they all revalidate
 *  together. /team/[id] is a dynamic segment and needs naming explicitly. */
function revalidateAll() {
  revalidatePath("/today");
  revalidatePath("/readiness");
  revalidatePath("/team");
  revalidatePath("/team/[id]", "page");
  revalidatePath("/library");
}

/** Turn a Postgres error into something a teammate can act on. */
function friendlyError(err: { code?: string; message: string }): string {
  // 23503 = FK violation: the resource or folder was deleted underneath us.
  if (err.code === "23503")
    return "That item was just removed from the library. Refresh and try again.";
  // 23505 = unique violation on (owner_id, resource_id).
  if (err.code === "23505") return "That's already assigned to them.";
  return err.message;
}

/** Take a task off someone's plate. A task IS the assignment (person ×
 *  resource), so unassigning is removing the row — the resource itself stays
 *  in the Library and can be assigned again, to them or anyone else. Their
 *  notes and the comment thread go with it. */
export async function unassignTask(taskId: string): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db.from("tasks").delete().eq("id", taskId);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

/** Permanently delete a library resource. Every task assigned from it goes
 *  with it — the `tasks.resource_id` cascade does that in the same
 *  statement, so there is no window where a task outlives its resource. */
export async function deleteResource(resourceId: string): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db.from("resources").delete().eq("id", resourceId);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

/** Permanently delete a folder. One statement: the cascade takes its
 *  resources, their tasks, and those tasks' comments and notifications. */
export async function deleteFolder(folderId: string): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db.from("folders").delete().eq("id", folderId);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export interface DeletionImpact {
  resources: number;
  tasks: number;
  completed: number;
  people: number;
}

function summarize(
  rows: { owner_id: string | null; state: string }[],
  resources: number
): DeletionImpact {
  return {
    resources,
    tasks: rows.length,
    completed: rows.filter((r) => r.state === "complete").length,
    people: new Set(rows.map((r) => r.owner_id)).size,
  };
}

/** What a resource deletion would take with it, so the confirm step can
 *  say it out loud instead of quietly wiping someone else's work. */
export async function getResourceDeletionImpact(
  resourceId: string
): Promise<DeletionImpact> {
  const db = supabaseAdmin();
  if (!db) return { resources: 1, tasks: 0, completed: 0, people: 0 };
  const { data } = await db
    .from("tasks")
    .select("owner_id, state")
    .eq("resource_id", resourceId);
  return summarize(data ?? [], 1);
}

/** Same, for a whole folder. */
export async function getFolderDeletionImpact(
  folderId: string
): Promise<DeletionImpact> {
  const db = supabaseAdmin();
  if (!db) return { resources: 0, tasks: 0, completed: 0, people: 0 };
  const [{ count }, { data }] = await Promise.all([
    db
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("folder_id", folderId),
    db.from("tasks").select("owner_id, state").eq("folder_id", folderId),
  ]);
  return summarize(data ?? [], count ?? 0);
}

/** Mark a task done, with an optional brief of what got done (saved to its notes).
 *  Build tasks also count as "applied" (shipped real work). */
export async function completeTask(
  taskId: string,
  brief?: string
): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };

  const { data: t } = await db
    .from("tasks")
    .select("type, note")
    .eq("id", taskId)
    .single();

  const applied = t?.type === "build";
  const trimmed = brief?.trim();
  const note = trimmed
    ? t?.note
      ? `${t.note}\n\nDone: ${trimmed}`
      : `Done: ${trimmed}`
    : t?.note ?? null;

  const { error } = await db
    .from("tasks")
    .update({ state: "complete", applied, note })
    .eq("id", taskId);
  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true };
}

export interface NewResource {
  title: string;
  folderId?: string | null;
  source?: string;
  description?: string;
  assignTo?: string | null;
  deadline?: string | null;
}

async function notifyAssignment(
  db: NonNullable<ReturnType<typeof supabaseAdmin>>,
  ownerId: string,
  title: string,
  taskId: string | null
) {
  const me = await currentUid();
  if (ownerId === me) return;
  await db.from("notifications").insert({
    recipient_id: ownerId,
    actor_id: me,
    type: "assigned",
    task_id: taskId,
    body: `New assignment: "${title}".`,
  });
}

/** Create a new library folder. Returns its id so the caller can select it. */
export async function createFolder(
  name: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Folder name is required" };
  const { data, error } = await db
    .from("folders")
    .insert({ name: trimmed })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/library");
  return { ok: true, id: data?.id };
}

/** Capture a new resource into the shared library; optionally assign it to someone. */
export async function addResource(input: NewResource): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  if (!input.title.trim()) return { ok: false, error: "Title is required" };
  if (!input.folderId) return { ok: false, error: "Please choose a folder" };

  const { data, error } = await db
    .from("resources")
    .insert({
      title: input.title.trim(),
      type: "learn",
      folder_id: input.folderId,
      source: input.source?.trim() || null,
      description: input.description?.trim() || null,
    })
    .select("id, title, type, source, folder_id")
    .single();
  if (error) return { ok: false, error: friendlyError(error) };

  if (input.assignTo && data) {
    const { data: task, error: taskErr } = await db
      .from("tasks")
      .insert({
        owner_id: input.assignTo,
        resource_id: data.id,
        title: data.title,
        type: data.type,
        source: data.source,
        folder_id: data.folder_id,
        state: "todo",
        deadline: input.deadline || null,
      })
      .select("id")
      .single();
    if (taskErr) return { ok: false, error: friendlyError(taskErr) };
    await notifyAssignment(db, input.assignTo, data.title, task?.id ?? null);
  }

  revalidateAll();
  return { ok: true };
}

/** Assign an existing library resource to a teammate (or yourself), with an optional deadline. */
export async function assignResourceToMember(
  resourceId: string,
  ownerId: string,
  deadline?: string | null
): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };

  const { data: r, error } = await db
    .from("resources")
    .select("id, title, type, source, folder_id")
    .eq("id", resourceId)
    .single();
  if (error || !r)
    return { ok: false, error: "That resource is no longer in the library." };

  // Idempotent by construction: the (owner_id, resource_id) unique constraint
  // means a second assign is a no-op, whatever state the first one is in.
  // No read-then-write, so two people assigning at once can't race.
  const { data: inserted, error: taskErr } = await db
    .from("tasks")
    .upsert(
      {
        owner_id: ownerId,
        resource_id: r.id,
        title: r.title,
        type: r.type,
        source: r.source,
        folder_id: r.folder_id,
        state: "todo",
        deadline: deadline || null,
      },
      { onConflict: "owner_id,resource_id", ignoreDuplicates: true }
    )
    .select("id");
  if (taskErr) return { ok: false, error: friendlyError(taskErr) };

  // Empty means they already had it — don't nudge them about nothing.
  const task = inserted?.[0];
  if (task) await notifyAssignment(db, ownerId, r.title, task.id);

  revalidateAll();
  return { ok: true };
}

/** Assign every resource in a folder to a teammate (deduped), with one notification. */
export async function assignFolderToMember(
  folderId: string,
  ownerId: string,
  deadline?: string | null
): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };

  const [{ data: folder }, { data: resources, error }] = await Promise.all([
    db.from("folders").select("name").eq("id", folderId).single(),
    db
      .from("resources")
      .select("id, title, type, source, folder_id")
      .eq("folder_id", folderId),
  ]);
  if (error) return { ok: false, error: error.message };
  if (!resources || resources.length === 0) return { ok: false, error: "Folder is empty" };

  // Same unique constraint does the deduping — anything they already have is
  // skipped, and what comes back is exactly what was newly assigned.
  const { data: inserted, error: insErr } = await db
    .from("tasks")
    .upsert(
      resources.map((r: any) => ({
        owner_id: ownerId,
        resource_id: r.id,
        title: r.title,
        type: r.type,
        source: r.source,
        folder_id: r.folder_id,
        state: "todo",
        deadline: deadline || null,
      })),
      { onConflict: "owner_id,resource_id", ignoreDuplicates: true }
    )
    .select("id");
  if (insErr) return { ok: false, error: friendlyError(insErr) };

  const added = inserted?.length ?? 0;
  const me = await currentUid();
  if (added > 0 && ownerId !== me) {
    await db.from("notifications").insert({
      recipient_id: ownerId,
      actor_id: me,
      type: "assigned",
      task_id: null,
      body: `New assignment: the "${folder?.name ?? "folder"}" folder (${added} item${
        added === 1 ? "" : "s"
      }).`,
    });
  }

  revalidateAll();
  return { ok: true };
}

export interface AssignableResource {
  id: string;
  title: string;
  type: "learn" | "build";
  source?: string;
  /** Already on this person's plate — shown, but not selectable again. */
  assigned: boolean;
}

export interface AssignableFolder {
  id: string;
  name: string;
  resources: AssignableResource[];
}

/** The whole Library, flagged with what this person already has, so the
 *  assign panel can show everything in context instead of hiding the items
 *  they're already working on. */
export async function getAssignableResources(
  memberId: string
): Promise<AssignableFolder[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const [{ data: folders }, { data: resources }, { data: theirs }] = await Promise.all([
    db.from("folders").select("id, name"),
    db.from("resources").select("id, title, type, source, folder_id"),
    db.from("tasks").select("resource_id").eq("owner_id", memberId),
  ]);
  if (!folders || !resources) return [];

  const taken = new Set((theirs ?? []).map((t: any) => t.resource_id));

  return folders
    .map((f: any) => ({
      id: f.id,
      name: f.name,
      resources: resources
        .filter((r: any) => r.folder_id === f.id)
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          source: r.source ?? undefined,
          assigned: taken.has(r.id),
        }))
        .sort((a: AssignableResource, b: AssignableResource) =>
          a.title.localeCompare(b.title)
        ),
    }))
    .filter((f: AssignableFolder) => f.resources.length > 0)
    .sort((a: AssignableFolder, b: AssignableFolder) => a.name.localeCompare(b.name));
}

/** Assign several resources at once. Anything they already have is skipped by
 *  the (owner_id, resource_id) constraint, so this is safe to re-run and the
 *  returned count is exactly what was newly added. */
export async function assignResourcesToMember(
  resourceIds: string[],
  ownerId: string,
  deadline?: string | null
): Promise<{ ok: boolean; assigned?: number; error?: string }> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  if (resourceIds.length === 0) return { ok: false, error: "Nothing selected" };

  const { data: resources, error } = await db
    .from("resources")
    .select("id, title, type, source, folder_id")
    .in("id", resourceIds);
  if (error) return { ok: false, error: error.message };
  if (!resources || resources.length === 0)
    return { ok: false, error: "Those resources are no longer in the library." };

  const { data: inserted, error: insErr } = await db
    .from("tasks")
    .upsert(
      resources.map((r: any) => ({
        owner_id: ownerId,
        resource_id: r.id,
        title: r.title,
        type: r.type,
        source: r.source,
        folder_id: r.folder_id,
        state: "todo",
        deadline: deadline || null,
      })),
      { onConflict: "owner_id,resource_id", ignoreDuplicates: true }
    )
    // Title comes back from the insert, not from `resources` — with duplicates
    // skipped, the two lists don't line up.
    .select("id, title");
  if (insErr) return { ok: false, error: friendlyError(insErr) };

  const assigned = inserted?.length ?? 0;
  const me = await currentUid();
  if (assigned > 0 && ownerId !== me) {
    const only = assigned === 1 ? inserted![0] : null;
    await db.from("notifications").insert({
      recipient_id: ownerId,
      actor_id: me,
      type: "assigned",
      task_id: only?.id ?? null,
      body: only
        ? `New assignment: "${only.title}".`
        : `New assignment: ${assigned} items.`,
    });
  }

  revalidateAll();
  return { ok: true, assigned };
}

/** Save the free-form details on a library resource. */
export async function saveResourceDescription(
  resourceId: string,
  description: string
): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("resources")
    .update({ description: description.trim() || null })
    .eq("id", resourceId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/library");
  return { ok: true };
}

export interface TaskDetail {
  note: string | null;
  state: string;
  canComplete: boolean;
  comments: { id: string; author: string; body: string; createdAt: string }[];
}

/** Load a task's note, status, and comment thread. */
export async function getTaskDetail(taskId: string): Promise<TaskDetail> {
  const db = supabaseAdmin();
  if (!db) return { note: null, state: "todo", canComplete: false, comments: [] };
  const [{ data: task }, { data: comments }] = await Promise.all([
    db.from("tasks").select("note, state, is_folder").eq("id", taskId).single(),
    db
      .from("comments")
      .select("id, body, created_at, author:profiles(name)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
  ]);
  const state = task?.state ?? "todo";
  return {
    note: task?.note ?? null,
    state,
    canComplete: state !== "complete" && !task?.is_folder,
    comments: (comments ?? []).map((c: any) => ({
      id: c.id,
      body: c.body,
      createdAt: c.created_at,
      author: c.author?.name ?? "Someone",
    })),
  };
}

export interface MemberTaskRow {
  id: string;
  title: string;
  type: "learn" | "build";
  state: string;
  deadline: string | null;
  note: string | null;
  isFolder: boolean;
}

/** All of a teammate's tasks (active + completed), newest first — for team review. */
export async function getMemberTasks(memberId: string): Promise<MemberTaskRow[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data } = await db
    .from("tasks")
    .select("id, title, type, state, deadline, note, is_folder")
    .eq("owner_id", memberId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((t: any) => ({
    id: t.id,
    title: t.title,
    type: t.type,
    state: t.state,
    deadline: t.deadline ?? null,
    note: t.note ?? null,
    isFolder: t.is_folder ?? false,
  }));
}

/** Save the personal note on a task. */
export async function saveNote(taskId: string, note: string): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db.from("tasks").update({ note }).eq("id", taskId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Add a comment to a task's thread. */
export async function addComment(taskId: string, body: string): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  if (!body.trim()) return { ok: false, error: "Empty comment" };
  const { error } = await db.from("comments").insert({
    task_id: taskId,
    author_id: await currentUid(),
    body: body.trim(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Send an in-app poke (nudge) to a teammate about a task. */
export async function pokeTeammate(
  recipientId: string,
  taskId: string | null,
  body: string
): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db.from("notifications").insert({
    recipient_id: recipientId,
    actor_id: await currentUid(),
    type: "poke",
    task_id: taskId,
    body,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Mark all of my notifications read. */
export async function markNotificationsRead(): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", await currentUid())
    .eq("read", false);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// (markShipped removed — completion is unified in completeTask above.)
