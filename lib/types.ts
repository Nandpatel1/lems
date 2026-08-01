/** What kind of work an item is: knowledge to absorb, an action to ship, or
 *  both at once. Owned by the resource and synced onto its tasks by trigger. */
export type ItemType = "learn" | "build" | "both";
export type TaskState = "parked" | "todo" | "in_progress" | "complete";

export interface Task {
  id: string;
  title: string;
  type: ItemType;
  state: TaskState;
  source?: string;
  deadline?: string;
  overdue?: boolean;
  applied?: boolean;
  parkedReason?: string;
  effortMin?: number;
  isFolder?: boolean;
  childrenDone?: number;
  childrenTotal?: number;
  note?: string;
  folderName?: string;
}

export interface Milestone {
  id: string;
  label: string;
  done: boolean;
  current?: boolean;
}

export interface Founder {
  id: string;
  name: string;
  initial: string;
}

export interface Resource {
  id: string;
  title: string;
  type: ItemType;
  source?: string;
  tags: string[];
  effortMin?: number;
  description?: string;
}

export interface LibraryFolder {
  id: string;
  name: string;
  ordered: boolean;
  resources: Resource[];
}

export interface TeamMember {
  id: string;
  name: string;
  initial: string;
  /** Completed work. Feeds the team-wide "things shipped" line — the cards
   *  themselves show what's left, not what's banked. */
  shipped: number;
  /** Everything not complete: todo, in progress, and parked alike. */
  pending: number;
  focus: string;
}

export interface Confidence {
  id: string;
  name: string;
  initial: string;
  score: number;
}
