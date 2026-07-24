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

/** Complete a learn item. Optionally spawn a real-world action (the turn-into-action moment). */
export async function completeLearn(
  taskId: string,
  actionTitle?: string
): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };

  const { error } = await db.from("tasks").update({ state: "complete" }).eq("id", taskId);
  if (error) return { ok: false, error: error.message };

  if (actionTitle && actionTitle.trim()) {
    const { error: insErr } = await db.from("tasks").insert({
      owner_id: await currentUid(),
      title: actionTitle.trim(),
      type: "build",
      state: "todo",
    });
    if (insErr) return { ok: false, error: insErr.message };
  }

  revalidateAll();
  return { ok: true };
}

export interface NewResource {
  title: string;
  type: "learn" | "build";
  folderId?: string | null;
  source?: string;
  tags?: string[];
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
      type: input.type,
      folder_id: input.folderId || null,
      source: input.source?.trim() || null,
      tags: input.tags ?? [],
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
    .select("title, type")
    .eq("id", resourceId)
    .single();
  if (error || !r) return { ok: false, error: error?.message ?? "Resource not found" };

  const { data: task, error: taskErr } = await db
    .from("tasks")
    .insert({
      owner_id: ownerId,
      title: r.title,
      type: r.type,
      state: "todo",
      deadline: deadline || null,
    })
    .select("id")
    .single();
  if (taskErr) return { ok: false, error: taskErr.message };

  await notifyAssignment(db, ownerId, r.title, task?.id ?? null);
  revalidateAll();
  return { ok: true };
}

export interface TaskDetail {
  note: string | null;
  comments: { id: string; author: string; body: string; createdAt: string }[];
}

/** Load a task's personal note and its comment thread. */
export async function getTaskDetail(taskId: string): Promise<TaskDetail> {
  const db = supabaseAdmin();
  if (!db) return { note: null, comments: [] };
  const [{ data: task }, { data: comments }] = await Promise.all([
    db.from("tasks").select("note").eq("id", taskId).single(),
    db
      .from("comments")
      .select("id, body, created_at, author:profiles(name)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
  ]);
  return {
    note: task?.note ?? null,
    comments: (comments ?? []).map((c: any) => ({
      id: c.id,
      body: c.body,
      createdAt: c.created_at,
      author: c.author?.name ?? "Someone",
    })),
  };
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

/** Mark a build/action task as shipped for real — the moment readiness moves. */
export async function markShipped(taskId: string): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };

  const { error } = await db
    .from("tasks")
    .update({ state: "complete", applied: true })
    .eq("id", taskId);
  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true };
}
