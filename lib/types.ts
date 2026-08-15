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
  /** Everything not complete: todo, in progress, and parked alike. The team
   *  board shows what's left, not what's banked. */
  pending: number;
}

export interface Confidence {
  id: string;
  name: string;
  initial: string;
  score: number;
}

/** Whether a topic is a live conversation. An attention signal, not a lock —
 *  an inactive topic still takes replies, and anyone can flip it back. */
export type TopicState = "active" | "inactive";

/** A general-discussion topic: an idea, a doubt, or a note that isn't work.
 *  It belongs to the team rather than to a person's plate, which is why it has
 *  no owner, no deadline and no type — only a state and a thread. */
export interface Topic {
  id: string;
  title: string;
  description?: string;
  state: TopicState;
  /** Who started it. Null id once their profile is gone — the writing stays. */
  author: string;
  authorId: string | null;
  authorInitial: string;
  createdAt: string;
  /** Newest reply, or creation time if there are none. What the list sorts by. */
  lastActivityAt: string;
  replyCount: number;
  /** Everyone who has written here, starter first — the avatar stack. */
  participants: Founder[];
}

/** Deliberately the same shape as `TaskComment`, so both threads render
 *  through the same log component. */
export interface TopicReply {
  id: string;
  author: string;
  authorId: string | null;
  authorInitial: string;
  body: string;
  createdAt: string;
}

export interface TopicDetail extends Topic {
  replies: TopicReply[];
}
