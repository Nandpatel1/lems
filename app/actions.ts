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
  addToQueue?: boolean;
}

/** Capture a new resource into the shared library; optionally drop it in my queue. */
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

  if (input.addToQueue && data) {
    const { error: taskErr } = await db.from("tasks").insert({
      owner_id: await currentUid(),
      title: data.title,
      type: data.type,
      state: "todo",
    });
    if (taskErr) return { ok: false, error: taskErr.message };
  }

  revalidateAll();
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
