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

export interface AppNotification {
  id: string;
  type: string;
  body: string;
  read: boolean;
  createdAt: string;
  taskId?: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const db = supabaseAdmin();
  const uid = await getCurrentUserId();
  try {
    if (!db || !uid) throw new Error("no");
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("recipient_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((n: any) => ({
      id: n.id,
      type: n.type,
      body: n.body,
      read: n.read,
      createdAt: n.created_at,
      taskId: n.task_id ?? undefined,
    }));
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
    source: row.source ?? undefined,
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
  learned: number;
  applied: number;
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
    const [{ data: profile }, { data: tasks }] = await Promise.all([
      db.from("profiles").select("name").eq("id", uid).single(),
      db.from("tasks").select("*").eq("owner_id", uid),
    ]);
    if (!tasks) throw new Error("empty");

    const active = tasks.filter((t: any) => t.state !== "complete");
    active.sort(byDeadline);
    const learned = tasks.filter(
      (t: any) => t.type === "learn" && t.state === "complete"
    ).length;
    const applied = tasks.filter((t: any) => t.applied).length;

    return {
      founderName: profile?.name ?? seed.founder.name,
      learned,
      applied,
      tasks: active.map(mapTask),
    };
  } catch {
    return {
      founderName: seed.founder.name,
      learned: seed.learnedThisWeek,
      applied: seed.appliedThisWeek,
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
    return folders.map((f: any) => ({
      id: f.id,
      name: f.name,
      ordered: f.ordered,
      resources: resources
        .filter((r: any) => r.folder_id === f.id)
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          source: r.source ?? undefined,
          tags: r.tags ?? [],
          effortMin: r.est_effort_min ?? undefined,
        })),
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
      learned: tasks.filter((t: any) => t.type === "learn" && t.state === "complete").length,
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
  weeklyShipped: number;
}

export async function getTeam(): Promise<TeamData> {
  const db = supabaseAdmin();
  try {
    if (!db) throw new Error("no-db");
    const [{ data: profiles }, { data: tasks }] = await Promise.all([
      db.from("profiles").select("*"),
      db.from("tasks").select("owner_id,state,applied"),
    ]);
    if (!profiles || !tasks) throw new Error("empty");
    const members: TeamMember[] = profiles
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .map((p: any) => {
        const own = tasks.filter((t: any) => t.owner_id === p.id);
        return {
          id: p.id,
          name: p.name,
          initial: p.initial,
          shipped: own.filter((t: any) => t.state === "complete" || t.applied).length,
          inProgress: own.filter((t: any) => t.state === "in_progress").length,
          focus: p.focus ?? "",
        };
      });
    const weeklyShipped = members.reduce((s, m) => s + m.shipped, 0);
    return { members, weeklyShipped };
  } catch {
    return { members: seed.teamMembers, weeklyShipped: seed.weeklyShipped };
  }
}
