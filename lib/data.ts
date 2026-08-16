import { supabaseAdmin } from "./supabase/server";
import { CURRENT_USER } from "./constants";
import { getCurrentUserId } from "./session";
import type {
  Task,
  Milestone,
  LibraryFolder,
  TeamMember,
  Confidence,
  Founder,
  Topic,
  TopicDetail,
} from "./types";
import * as seed from "./seed";

async function currentUid(): Promise<string> {
  return (await getCurrentUserId()) ?? CURRENT_USER;
}

export async function getProfiles(): Promise<Founder[]> {
  const db = supabaseAdmin();
  try {
    if (!db) throw new Error("no-db");
    const { data } = await db.from("profiles").select("id, name, initial");
    if (!data) throw new Error("empty");
    return data
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .map((p: any) => ({ id: p.id, name: p.name, initial: p.initial }));
  } catch {
    return seed.founders;
  }
}

export type NotificationType =
  | "comment"
  | "assigned"
  | "poke"
  | "topic"
  | "topic_reply";

/** Actor and task are joined at read time rather than baked into `body`, so a
 *  renamed resource or person reads correctly in notifications sent before the
 *  rename. `body` therefore holds only the raw payload — the comment text for
 *  'comment', a whole sentence for the older 'assigned'/'poke' rows. */
export interface AppNotification {
  id: string;
  type: NotificationType | string;
  body: string;
  read: boolean;
  createdAt: string;
  taskId?: string;
  taskTitle?: string;
  /** Whose workspace the task lives in — a thread participant is often not the
   *  owner, so this, not the recipient, is what the deep link points at. */
  taskOwnerId?: string;
  /** Set instead of taskId when the notification is about a discussion topic.
   *  A row points at one or the other, never both. */
  topicId?: string;
  topicTitle?: string;
  actorName?: string;
  actorInitial?: string;
}

/** Supabase returns an embedded one-to-many as an object, but a to-many shape
 *  as an array. Normalise so callers don't have to care. */
function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

// notifications points at profiles twice (recipient, actor), so the actor join
// has to name its constraint or Postgrest can't disambiguate.
const NOTIFICATION_BASE =
  "id, type, body, read, created_at, task_id, " +
  "actor:profiles!notifications_actor_id_fkey(name, initial), " +
  "task:tasks(title, owner_id)";

const NOTIFICATION_SELECT = `${NOTIFICATION_BASE}, topic_id, topic:topics(title)`;

function mapNotification(n: any): AppNotification {
  const actor = one<any>(n.actor);
  const task = one<any>(n.task);
  const topic = one<any>(n.topic);
  return {
    id: n.id,
    type: n.type,
    body: n.body,
    read: n.read,
    createdAt: n.created_at,
    taskId: n.task_id ?? undefined,
    taskTitle: task?.title ?? undefined,
    taskOwnerId: task?.owner_id ?? undefined,
    topicId: n.topic_id ?? undefined,
    topicTitle: topic?.title ?? undefined,
    actorName: actor?.name ?? undefined,
    actorInitial: actor?.initial ?? undefined,
  };
}

export async function getNotifications(): Promise<AppNotification[]> {
  const db = supabaseAdmin();
  const uid = await getCurrentUserId();
  try {
    if (!db || !uid) throw new Error("no");
    const read = (select: string) =>
      db
        .from("notifications")
        .select(select)
        .eq("recipient_id", uid)
        .order("created_at", { ascending: false })
        .limit(20);

    // A database that hasn't had supabase/discussions.sql run against it has no
    // topics table, and asking for the join fails the whole query. Falling back
    // to the task-only shape keeps the bell working there rather than going
    // silently empty — the one thing worse than missing topic notifications is
    // missing all of them.
    let { data, error } = await read(NOTIFICATION_SELECT);
    if (error) ({ data, error } = await read(NOTIFICATION_BASE));
    if (error) throw error;

    return (data ?? []).map(mapNotification);
  } catch {
    return [];
  }
}

export async function getCurrentProfile(): Promise<{ name: string; initial: string }> {
  const uid = await getCurrentUserId();
  const db = supabaseAdmin();
  try {
    if (!db || !uid) throw new Error("no");
    const { data } = await db
      .from("profiles")
      .select("name, initial")
      .eq("id", uid)
      .single();
    if (!data) throw new Error("empty");
    return { name: data.name, initial: data.initial };
  } catch {
    return { name: seed.founder.name, initial: "N" };
  }
}

/** A completed item counts as "learned" if it carried knowledge — which "both"
 *  does as well as "learn". ("Applied" is the `applied` flag, set on completion
 *  for build and both.) A "both" item therefore lands in each side of the
 *  learned→applied ratio exactly once, which is the honest reading: you
 *  absorbed it *and* you shipped with it. */
function countsAsLearned(row: { type: string; state: string }): boolean {
  return (row.type === "learn" || row.type === "both") && row.state === "complete";
}

function weekdayLabel(deadline: string | null): string | undefined {
  if (!deadline) return undefined;
  return new Date(deadline).toLocaleDateString("en-GB", { weekday: "short" });
}

function isOverdue(deadline: string | null, state: string): boolean {
  if (!deadline || state === "complete") return false;
  return new Date(deadline).getTime() < Date.now();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    state: row.state,
    deadline: weekdayLabel(row.deadline),
    overdue: isOverdue(row.deadline, row.state),
    applied: row.applied ?? false,
    parkedReason: row.parked_reason ?? undefined,
    effortMin: row.effort_min ?? undefined,
    isFolder: row.is_folder ?? false,
    childrenDone: row.children_done ?? undefined,
    childrenTotal: row.children_total ?? undefined,
    note: row.note ?? undefined,
  };
}

function mapMilestones(rows: any[]): Milestone[] {
  return rows
    .sort((a, b) => a.idx - b.idx)
    .map((m) => ({ id: m.id, label: m.label, done: m.done, current: m.current }));
}

function computeReadiness(ms: Milestone[]): number {
  if (ms.length === 0) return 0;
  const done = ms.filter((m) => m.done).length;
  const current = ms.filter((m) => m.current && !m.done).length;
  return Math.round(((done + 0.5 * current) / ms.length) * 100);
}

export interface TodayData {
  founderName: string;
  tasks: Task[];
}

function byDeadline(a: any, b: any): number {
  // Parked tasks sink to the bottom; otherwise soonest deadline first, no-deadline last.
  const pa = a.state === "parked" ? 1 : 0;
  const pb = b.state === "parked" ? 1 : 0;
  if (pa !== pb) return pa - pb;
  const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
  const db2 = b.deadline ? new Date(b.deadline).getTime() : Infinity;
  return da - db2;
}

export async function getToday(): Promise<TodayData> {
  const db = supabaseAdmin();
  try {
    if (!db) throw new Error("no-db");
    const uid = await currentUid();
    const [{ data: profile }, { data: tasks }, { data: folders }] = await Promise.all([
      db.from("profiles").select("name").eq("id", uid).single(),
      db.from("tasks").select("*").eq("owner_id", uid),
      db.from("folders").select("id, name"),
    ]);
    if (!tasks) throw new Error("empty");

    const folderMap = new Map<string, string>(
      (folders ?? []).map((f: any) => [f.id, f.name])
    );
    const active = tasks.filter((t: any) => t.state !== "complete");
    active.sort(byDeadline);

    return {
      founderName: profile?.name ?? seed.founder.name,
      tasks: active.map((t: any) => ({
        ...mapTask(t),
        folderName: t.folder_id ? folderMap.get(t.folder_id) : undefined,
      })),
    };
  } catch {
    return {
      founderName: seed.founder.name,
      tasks: [seed.focusTask, ...seed.otherTasks],
    };
  }
}

export async function getLibrary(): Promise<LibraryFolder[]> {
  const db = supabaseAdmin();
  try {
    if (!db) throw new Error("no-db");
    const [{ data: folders }, { data: resources }] = await Promise.all([
      db.from("folders").select("*"),
      db.from("resources").select("*"),
    ]);
    if (!folders || !resources) throw new Error("empty");
    const mapRes = (r: any) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      tags: r.tags ?? [],
      effortMin: r.est_effort_min ?? undefined,
      description: r.description ?? undefined,
    });

    // resources.folder_id is NOT NULL, so every resource lands in a group —
    // there is no "Unfiled" bucket to fall through to.
    return folders.map((f: any) => ({
      id: f.id,
      name: f.name,
      ordered: f.ordered,
      resources: resources.filter((r: any) => r.folder_id === f.id).map(mapRes),
    }));
  } catch {
    return seed.libraryFolders;
  }
}

export interface ReadinessData {
  readiness: number;
  milestones: Milestone[];
  confidences: Confidence[];
  learned: number;
  applied: number;
}

export async function getReadiness(): Promise<ReadinessData> {
  const db = supabaseAdmin();
  try {
    if (!db) throw new Error("no-db");
    const uid = await currentUid();
    const [{ data: ms }, { data: profiles }, { data: tasks }] = await Promise.all([
      db.from("milestones").select("*"),
      db.from("profiles").select("*"),
      db.from("tasks").select("type,state,applied,owner_id").eq("owner_id", uid),
    ]);
    if (!ms || !profiles || !tasks) throw new Error("empty");
    const milestones = mapMilestones(ms);
    return {
      readiness: computeReadiness(milestones),
      milestones,
      confidences: profiles
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
        .map((p: any) => ({ id: p.id, name: p.name, initial: p.initial, score: p.score })),
      learned: tasks.filter(countsAsLearned).length,
      applied: tasks.filter((t: any) => t.applied).length,
    };
  } catch {
    return {
      readiness: seed.readiness,
      milestones: seed.milestones,
      confidences: seed.confidences,
      learned: seed.learnedThisWeek,
      applied: seed.appliedThisWeek,
    };
  }
}

export interface TeamData {
  members: TeamMember[];
}

export async function getTeam(): Promise<TeamData> {
  const db = supabaseAdmin();
  try {
    if (!db) throw new Error("no-db");
    const [{ data: profiles }, { data: tasks }] = await Promise.all([
      db.from("profiles").select("*"),
      db.from("tasks").select("owner_id,state"),
    ]);
    if (!profiles || !tasks) throw new Error("empty");
    const members: TeamMember[] = profiles
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        initial: p.initial,
        pending: tasks.filter(
          (t: any) => t.owner_id === p.id && t.state !== "complete"
        ).length,
      }));
    return { members };
  } catch {
    return { members: seed.teamMembers };
  }
}

/* ---------- general discussion ---------- */

/** A writer, flattened the way the thread components want it. Falls back to a
 *  placeholder rather than dropping the entry: a reply whose author's profile
 *  is gone is still something somebody said. */
function writer(row: any): { author: string; authorId: string | null; authorInitial: string } {
  const p = one<any>(row?.author);
  const name = p?.name ?? "Someone";
  return {
    author: name,
    authorId: row?.author_id ?? null,
    authorInitial: p?.initial ?? name.charAt(0).toUpperCase(),
  };
}

/** Everyone who has written in a thread, starter first, then in the order they
 *  joined. Deduped by id, so a stack of three founders never shows six faces. */
function participantsOf(topic: any, replies: any[]): Founder[] {
  const seen = new Set<string>();
  const out: Founder[] = [];
  for (const row of [topic, ...replies]) {
    const p = one<any>(row.author);
    const id = row.author_id;
    if (!p || !id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: p.name, initial: p.initial });
  }
  return out;
}

const TOPIC_COLUMNS =
  "id, title, description, state, created_at, last_activity_at, author_id, " +
  "author:profiles(name, initial)";

const REPLY_COLUMNS =
  "id, topic_id, body, created_at, author_id, author:profiles(name, initial)";

function mapTopic(row: any, replies: any[]): Topic {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    state: row.state === "inactive" ? "inactive" : "active",
    ...writer(row),
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at ?? row.created_at,
    replyCount: replies.length,
    participants: participantsOf(row, replies),
  };
}

/** Every topic, liveliest first. Replies are fetched in one go and grouped in
 *  memory — with three founders the whole table is smaller than the round trip
 *  it would take to count them per topic. */
export async function getTopics(): Promise<Topic[]> {
  const db = supabaseAdmin();
  try {
    if (!db) throw new Error("no-db");
    const [{ data: topics, error }, { data: replies }] = await Promise.all([
      db
        .from("topics")
        .select(TOPIC_COLUMNS)
        .order("last_activity_at", { ascending: false }),
      db.from("topic_replies").select(REPLY_COLUMNS).order("created_at", { ascending: true }),
    ]);
    if (error || !topics) throw error ?? new Error("empty");

    const byTopic = new Map<string, any[]>();
    for (const r of replies ?? []) {
      const list = byTopic.get(r.topic_id);
      if (list) list.push(r);
      else byTopic.set(r.topic_id, [r]);
    }
    return topics.map((t: any) => mapTopic(t, byTopic.get(t.id) ?? []));
  } catch {
    return seed.topics;
  }
}

/** One topic and its whole thread. Null when there's no such topic — the page
 *  turns that into a redirect rather than an empty shell. */
export async function getTopicDetail(id: string): Promise<TopicDetail | null> {
  const db = supabaseAdmin();
  try {
    if (!db) throw new Error("no-db");
    const [{ data: topic, error }, { data: replies }] = await Promise.all([
      db.from("topics").select(TOPIC_COLUMNS).eq("id", id).single(),
      db
        .from("topic_replies")
        .select(REPLY_COLUMNS)
        .eq("topic_id", id)
        .order("created_at", { ascending: true }),
    ]);
    // Thrown rather than returned, so a missing row and a missing table take
    // the same path as getTopics: try the seed, and only then give up. Without
    // that, an un-migrated database lists seeded topics that 404 on click.
    if (error || !topic) throw error ?? new Error("no-topic");

    const rows = replies ?? [];
    return {
      ...mapTopic(topic, rows),
      replies: rows.map((r: any) => ({
        id: r.id,
        body: r.body,
        createdAt: r.created_at,
        ...writer(r),
      })),
    };
  } catch {
    return seed.topics.find((t) => t.id === id) ?? null;
  }
}
