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

function revalidateAll() {
  revalidatePath("/today");
  revalidatePath("/readiness");
  revalidatePath("/team");
  revalidatePath("/library");
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

/** Capture a new resource into the shared library; optionally assign it to someone. */
export async function addResource(input: NewResource): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  if (!input.title.trim()) return { ok: false, error: "Title is required" };

  const { data, error } = await db
    .from("resources")
    .insert({
      title: input.title.trim(),
      type: "learn",
      folder_id: input.folderId || null,
      source: input.source?.trim() || null,
      description: input.description?.trim() || null,
    })
    .select("title, type")
    .single();
  if (error) return { ok: false, error: error.message };

  if (input.assignTo && data) {
    const { data: task, error: taskErr } = await db
      .from("tasks")
      .insert({
        owner_id: input.assignTo,
        title: data.title,
        type: data.type,
        state: "todo",
        deadline: input.deadline || null,
        folder_id: input.folderId || null,
      })
      .select("id")
      .single();
    if (taskErr) return { ok: false, error: taskErr.message };
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
    .select("title, type, folder_id")
    .eq("id", resourceId)
    .single();
  if (error || !r) return { ok: false, error: error?.message ?? "Resource not found" };

  // Dedup: don't create a duplicate if this person already has it active.
  const { data: existing } = await db
    .from("tasks")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("title", r.title)
    .neq("state", "complete")
    .limit(1);
  if (existing && existing.length > 0) {
    return { ok: true };
  }

  const { data: task, error: taskErr } = await db
    .from("tasks")
    .insert({
      owner_id: ownerId,
      title: r.title,
      type: r.type,
      state: "todo",
      deadline: deadline || null,
      folder_id: r.folder_id ?? null,
    })
    .select("id")
    .single();
  if (taskErr) return { ok: false, error: taskErr.message };

  await notifyAssignment(db, ownerId, r.title, task?.id ?? null);
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
    db.from("resources").select("title, type").eq("folder_id", folderId),
  ]);
  if (error) return { ok: false, error: error.message };
  if (!resources || resources.length === 0) return { ok: false, error: "Folder is empty" };

  const { data: existing } = await db
    .from("tasks")
    .select("title")
    .eq("owner_id", ownerId)
    .neq("state", "complete");
  const have = new Set((existing ?? []).map((t: any) => t.title));

  const toInsert = resources
    .filter((r: any) => !have.has(r.title))
    .map((r: any) => ({
      owner_id: ownerId,
      title: r.title,
      type: r.type,
      state: "todo",
      deadline: deadline || null,
      folder_id: folderId,
    }));

  if (toInsert.length > 0) {
    const { error: insErr } = await db.from("tasks").insert(toInsert);
    if (insErr) return { ok: false, error: insErr.message };
  }

  const me = await currentUid();
  if (ownerId !== me) {
    await db.from("notifications").insert({
      recipient_id: ownerId,
      actor_id: me,
      type: "assigned",
      task_id: null,
      body: `New assignment: the "${folder?.name ?? "folder"}" folder (${
        toInsert.length
      } item${toInsert.length === 1 ? "" : "s"}).`,
    });
  }

  revalidateAll();
  return { ok: true };
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
