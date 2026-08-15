"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CURRENT_USER } from "@/lib/constants";
import { getCurrentUserId } from "@/lib/session";
import { getNotifications, type AppNotification } from "@/lib/data";
import type { ItemType, TaskState, TopicState } from "@/lib/types";

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
  // 22P02 = bad enum value. In practice this means the database hasn't had
  // `supabase/item-type-both.sql` run against it yet, so it can't store an
  // item that is Learn *and* Build. Say that, rather than leaking the raw
  // Postgres text.
  if (err.code === "22P02" && err.message.includes("item_type"))
    return "This database can't store Learn & Build together yet — run supabase/item-type-both.sql, or pick just one for now.";
  return err.message;
}

/** Take a task off someone's plate. A task IS the assignment (person ×
 *  resource), so unassigning is removing the row — the resource itself stays
 *  in the Library and can be assigned again, to them or anyone else. Their
 *  personal notes go with it; the discussion does not, because it hangs off
 *  the work and outlives whoever was holding it. */
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
 *  Build tasks — and "both" tasks, which carry an action item too — also count
 *  as "applied" (shipped real work). */
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

  const applied = t?.type === "build" || t?.type === "both";
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
  type: ItemType;
  folderId?: string | null;
  source?: string;
  description?: string;
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

/** Capture a new resource into the shared library. Capture only — handing it to
 *  someone with a deadline is a separate step (`assignResourceToMember`), so
 *  adding to the library never silently puts work on a teammate's plate. */
export async function addResource(input: NewResource): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  if (!input.title.trim()) return { ok: false, error: "Title is required" };
  if (!input.folderId) return { ok: false, error: "Please choose a folder" };

  const { error } = await db.from("resources").insert({
    title: input.title.trim(),
    type: input.type ?? "learn",
    folder_id: input.folderId,
    source: input.source?.trim() || null,
    description: input.description?.trim() || null,
  });
  if (error) return { ok: false, error: friendlyError(error) };

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

export interface TaskComment {
  id: string;
  author: string;
  /** Null once the author's profile is gone — the comment outlives them. */
  authorId: string | null;
  authorInitial: string;
  body: string;
  createdAt: string;
}

export interface TaskDetail {
  note: string | null;
  type: ItemType;
  state: string;
  canComplete: boolean;
  comments: TaskComment[];
  /** Everyone holding this work, in name order — the people who share the
   *  discussion. Named in the UI so it's obvious the thread isn't private. */
  assignees: { id: string; name: string; initial: string }[];
}

const EMPTY_DETAIL: TaskDetail = {
  note: null,
  type: "learn",
  state: "todo",
  canComplete: false,
  comments: [],
  assignees: [],
};

/** Load a task's own note and status, plus the discussion — which belongs to
 *  the underlying resource, so everyone assigned the same work reads and
 *  writes the same thread. */
export async function getTaskDetail(taskId: string): Promise<TaskDetail> {
  const db = supabaseAdmin();
  if (!db) return EMPTY_DETAIL;

  const { data: task } = await db
    .from("tasks")
    .select("note, type, state, is_folder, resource_id")
    .eq("id", taskId)
    .single();
  if (!task) return EMPTY_DETAIL;

  const [{ data: comments }, { data: holders }] = await Promise.all([
    db
      .from("comments")
      .select("id, body, created_at, author_id, author:profiles(name, initial)")
      .eq("resource_id", task.resource_id)
      .order("created_at", { ascending: true }),
    db
      .from("tasks")
      .select("owner:profiles(id, name, initial)")
      .eq("resource_id", task.resource_id),
  ]);

  const state = task.state ?? "todo";
  return {
    note: task.note ?? null,
    type: (task.type as ItemType) ?? "learn",
    state,
    canComplete: state !== "complete" && !task.is_folder,
    assignees: (holders ?? [])
      .map((h: any) => (Array.isArray(h.owner) ? h.owner[0] : h.owner))
      .filter(Boolean)
      .sort((a: any, b: any) => a.name.localeCompare(b.name)),
    comments: (comments ?? []).map((c: any) => {
      const author = Array.isArray(c.author) ? c.author[0] : c.author;
      const name = author?.name ?? "Someone";
      return {
        id: c.id,
        body: c.body,
        createdAt: c.created_at,
        authorId: c.author_id ?? null,
        author: name,
        authorInitial: author?.initial ?? name.charAt(0).toUpperCase(),
      };
    }),
  };
}

export interface MemberTaskRow {
  id: string;
  title: string;
  type: ItemType;
  state: TaskState;
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

/** Everyone a new comment concerns: everyone the work is assigned to, plus
 *  anyone already in the thread — minus whoever just wrote it.
 *
 *  The thread belongs to the resource, so all its assignees are in the same
 *  conversation by definition. Past commenters are added on top: someone who
 *  weighed in and has since been unassigned still gets the reply to their
 *  question.
 *
 *  Each recipient's notification points at *their own* task row for the work,
 *  so opening it lands them in their own workspace. The thread reads the same
 *  from anywhere, so the fallback for a commenter who holds no copy is simply
 *  somebody else's.
 *
 *  Best-effort throughout: a comment that saved must not report failure
 *  because notifying somebody about it didn't. */
async function notifyComment(
  db: NonNullable<ReturnType<typeof supabaseAdmin>>,
  resourceId: string,
  body: string,
  authorId: string
) {
  try {
    const [{ data: holders }, { data: thread }] = await Promise.all([
      db.from("tasks").select("id, owner_id").eq("resource_id", resourceId),
      db.from("comments").select("author_id").eq("resource_id", resourceId),
    ]);

    const taskFor = new Map<string, string>();
    for (const t of holders ?? []) if (t.owner_id) taskFor.set(t.owner_id, t.id);

    const recipients = new Set<string>(taskFor.keys());
    for (const c of thread ?? []) if (c.author_id) recipients.add(c.author_id);
    recipients.delete(authorId);
    if (recipients.size === 0) return;

    const anyTask = holders?.[0]?.id ?? null;
    const rows = [...recipients].map((id) => ({
      recipient_id: id,
      actor_id: authorId,
      type: "comment",
      task_id: taskFor.get(id) ?? anyTask,
      body,
    }));

    // One live row per thread per person. Ten comments overnight should read
    // as one thread to catch up on, not ten things to dismiss — so an
    // outstanding notification for this thread is replaced by the newest
    // rather than stacked on top of. Anything still listed is by definition
    // outstanding: opening or dismissing one deletes it.
    const taskIds = [...new Set(rows.map((r) => r.task_id).filter(Boolean))] as string[];
    if (taskIds.length > 0) {
      await db
        .from("notifications")
        .delete()
        .in("recipient_id", [...recipients])
        .in("task_id", taskIds)
        .eq("type", "comment");
    }

    await db.from("notifications").insert(rows);
  } catch {
    // Swallowed on purpose — see the doc comment above.
  }
}

/** Post to a work item's discussion, and tell the people it concerns.
 *  Callers hold a task id (that's what's on screen); the thread it resolves to
 *  is the resource's, shared with everyone else assigned the same work. */
export async function addComment(taskId: string, body: string): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Empty comment" };

  const { data: task } = await db
    .from("tasks")
    .select("resource_id")
    .eq("id", taskId)
    .single();
  if (!task?.resource_id)
    return { ok: false, error: "That task was just removed. Refresh and try again." };

  const me = await currentUid();
  const { error } = await db.from("comments").insert({
    resource_id: task.resource_id,
    author_id: me,
    body: trimmed,
  });
  if (error) return { ok: false, error: friendlyError(error) };

  // No revalidate: nothing rendered on the server shows the discussion, and
  // the poster's own view refetches the thread directly.
  await notifyComment(db, task.resource_id, trimmed, me);
  return { ok: true };
}

/** The current user's notifications, for the bell to poll. Reads through the
 *  same data layer the server render uses, so both agree. */
export async function fetchNotifications(): Promise<AppNotification[]> {
  return getNotifications();
}

/** Take one notification off the list — what opening or dismissing it does.
 *
 *  Deleted rather than flagged: a notification is a prompt to go look at
 *  something, and once you have, it has no job left. Keeping it around only
 *  asks the reader to sort what they've handled from what they haven't. The
 *  thing it pointed at — the discussion — is the durable record. */
export async function dismissNotification(id: string): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("recipient_id", await currentUid());
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

/** Empty my notification list in one go. */
export async function clearNotifications(): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("notifications")
    .delete()
    .eq("recipient_id", await currentUid());
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// (markShipped removed — completion is unified in completeTask above.)

/* ---------- general discussion ---------- */

/** Both discussion surfaces move together: the list shows each topic's reply
 *  count and last activity, so writing in a thread changes the list too. */
function revalidateDiscuss() {
  revalidatePath("/discuss");
  revalidatePath("/discuss/[id]", "page");
}

/** Tell the rest of the team. A topic has no assignees to scope this by — it's
 *  addressed to the team by definition, so everyone but the writer hears about
 *  it.
 *
 *  Best-effort, like the comment fan-out: something that saved must not report
 *  failure because notifying people about it didn't. */
async function notifyTopic(
  db: NonNullable<ReturnType<typeof supabaseAdmin>>,
  topicId: string,
  type: "topic" | "topic_reply",
  body: string,
  authorId: string
) {
  try {
    const { data: people } = await db.from("profiles").select("id");
    const recipients = (people ?? [])
      .map((p: any) => p.id as string)
      .filter((id) => id !== authorId);
    if (recipients.length === 0) return;

    // One live row per thread per person, same as task discussions: five
    // replies overnight should read as one conversation to catch up on, not
    // five things to dismiss. A new topic is its own event and never collapses.
    if (type === "topic_reply") {
      await db
        .from("notifications")
        .delete()
        .in("recipient_id", recipients)
        .eq("topic_id", topicId)
        .eq("type", "topic_reply");
    }

    await db.from("notifications").insert(
      recipients.map((id) => ({
        recipient_id: id,
        actor_id: authorId,
        type,
        topic_id: topicId,
        task_id: null,
        body,
      }))
    );
  } catch {
    // Swallowed on purpose — see the doc comment above.
  }
}

/** Start a topic. Title carries it; the description is where the thinking goes,
 *  and is optional because "quick question:" is a legitimate whole post.
 *  Returns the id so the caller can open the thread straight away. */
export async function createTopic(
  title: string,
  description?: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "Give it a title" };

  const me = await currentUid();
  const { data, error } = await db
    .from("topics")
    .insert({
      author_id: me,
      title: trimmed,
      description: description?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: friendlyError(error) };

  if (data?.id) await notifyTopic(db, data.id, "topic", description?.trim() ?? "", me);
  revalidateDiscuss();
  return { ok: true, id: data?.id };
}

/** Write in a topic's thread. Allowed whatever the topic's state — see
 *  `setTopicState`. */
export async function addTopicReply(
  topicId: string,
  body: string
): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Nothing to post" };

  const me = await currentUid();
  const { error } = await db
    .from("topic_replies")
    .insert({ topic_id: topicId, author_id: me, body: trimmed });
  if (error) return { ok: false, error: friendlyError(error) };

  await notifyTopic(db, topicId, "topic_reply", trimmed, me);
  revalidateDiscuss();
  return { ok: true };
}

/** Flip a topic between Active and Inactive. Anyone can, at any time, in either
 *  direction — it says whether this is a live conversation, and that is a
 *  judgement the whole team shares rather than the starter's to own.
 *
 *  Deliberately not a lock: an inactive topic still accepts replies. Making
 *  people reactivate a thread before answering in it would cost more than the
 *  tidiness is worth. */
export async function setTopicState(
  topicId: string,
  state: TopicState
): Promise<ActionResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db.from("topics").update({ state }).eq("id", topicId);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidateDiscuss();
  return { ok: true };
}
