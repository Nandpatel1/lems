import type {
  Task,
  Milestone,
  Founder,
  LibraryFolder,
  TeamMember,
  Confidence,
  TopicDetail,
} from "./types";

export const founder = { name: "Nand", initial: "N" };

export const founders: Founder[] = [
  { id: "n", name: "Nand", initial: "N" },
  { id: "m", name: "Madhav", initial: "M" },
  { id: "k", name: "Kedar", initial: "K" },
];

export const readiness = 41;

export const learnedThisWeek = 6;
export const appliedThisWeek = 4;

export const milestones: Milestone[] = [
  { id: "brand", label: "brand", done: true },
  { id: "site", label: "site", done: false, current: true },
  { id: "socials", label: "socials", done: false },
  { id: "content", label: "content", done: false },
  { id: "sales", label: "sales team", done: false },
];

export const focusTask: Task = {
  id: "t-logo",
  title: "Ship our brand logo — v1",
  type: "build",
  state: "in_progress",
  deadline: "Fri",
  effortMin: 90,
  note: "The real deliverable behind everything you studied this week.",
};

export const otherTasks: Task[] = [
  {
    id: "t-cold",
    title: "Cold email fundamentals — playlist",
    type: "learn",
    state: "todo",
    source: "YouTube",
    overdue: true,
  },
  {
    id: "t-seo",
    title: "SEO foundations",
    type: "learn",
    state: "in_progress",
    isFolder: true,
    childrenDone: 3,
    childrenTotal: 7,
  },
  {
    id: "t-ads",
    title: "Advanced Meta Ads course",
    type: "learn",
    state: "parked",
    parkedReason: "Madhav's on ads",
  },
];

export const libraryFolders: LibraryFolder[] = [
  {
    id: "f-sales",
    name: "Sales",
    ordered: true,
    resources: [
      {
        id: "r1",
        title: "Cold email fundamentals — playlist",
        type: "learn",
        source: "YouTube",
        tags: ["email", "outreach"],
        effortMin: 120,
      },
      {
        id: "r2",
        title: "Send 10 real cold emails",
        type: "build",
        tags: ["email", "practice"],
        effortMin: 60,
      },
    ],
  },
  {
    id: "f-seo",
    name: "SEO",
    ordered: false,
    resources: [
      {
        id: "r3",
        title: "SEO foundations",
        type: "learn",
        source: "Course",
        tags: ["seo", "organic"],
        effortMin: 240,
      },
      {
        id: "r4",
        title: "Keyword research walkthrough",
        type: "learn",
        source: "Blog",
        tags: ["seo"],
        effortMin: 30,
      },
    ],
  },
  {
    id: "f-brand",
    name: "Our agency",
    ordered: false,
    resources: [
      {
        id: "r5",
        title: "Ship our brand logo — v1",
        type: "build",
        tags: ["brand", "launch"],
        effortMin: 90,
      },
      {
        id: "r6",
        title: "Set up our Instagram page",
        type: "build",
        tags: ["socials", "launch"],
      },
    ],
  },
];

export const allTags = ["email", "outreach", "seo", "brand", "socials", "launch", "practice"];

export const teamMembers: TeamMember[] = [
  { id: "n", name: "Nand", initial: "N", pending: 2 },
  { id: "m", name: "Madhav", initial: "M", pending: 3 },
  { id: "k", name: "Kedar", initial: "K", pending: 1 },
];

export const confidences: Confidence[] = [
  { id: "n", name: "Nand", initial: "N", score: 3 },
  { id: "m", name: "Madhav", initial: "M", score: 4 },
  { id: "k", name: "Kedar", initial: "K", score: 3 },
];

/** Timestamps are relative to load so the seeded list never reads as stale. */
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

const [nand, madhav, kedar] = founders;

export const topics: TopicDetail[] = [
  {
    id: "tp-niche",
    title: "Should we niche down to one industry?",
    description:
      "We keep pitching everyone and our case studies look scattered. Wondering if picking one vertical for the next 6 months would make the outreach write itself. Not proposing it yet — want to hear where you two land.",
    state: "active",
    author: kedar.name,
    authorId: kedar.id,
    authorInitial: kedar.initial,
    createdAt: hoursAgo(72),
    lastActivityAt: hoursAgo(24),
    replyCount: 2,
    participants: [kedar, nand, madhav],
    replies: [
      {
        id: "tr-1",
        author: nand.name,
        authorId: nand.id,
        authorInitial: nand.initial,
        body: "I'm for it. Our two best results are both D2C — leading with that costs us nothing and the deck gets easier to write.",
        createdAt: hoursAgo(48),
      },
      {
        id: "tr-2",
        author: madhav.name,
        authorId: madhav.id,
        authorInitial: madhav.initial,
        body: "Agreed on the positioning, but let's not turn away work outside it while we're this early. Niche the marketing, not the invoice.",
        createdAt: hoursAgo(24),
      },
    ],
  },
  {
    id: "tp-pricing",
    title: "Doubt: how are we pricing retainers?",
    description:
      "A lead asked for monthly and I froze. Do we have a number, or are we quoting per project every time?",
    state: "active",
    author: madhav.name,
    authorId: madhav.id,
    authorInitial: madhav.initial,
    createdAt: hoursAgo(10),
    lastActivityAt: hoursAgo(4),
    replyCount: 1,
    participants: [madhav, nand],
    replies: [
      {
        id: "tr-3",
        author: nand.name,
        authorId: nand.id,
        authorInitial: nand.initial,
        body: "No number yet. Let's set a floor this week so nobody has to freeze again.",
        createdAt: hoursAgo(4),
      },
    ],
  },
  {
    id: "tp-brand-files",
    title: "Note: moved all brand files to the shared drive",
    description:
      "Logos, fonts and the colour sheet now live under Brand/ on the shared drive. Stop using the ones in your downloads folder.",
    state: "inactive",
    author: nand.name,
    authorId: nand.id,
    authorInitial: nand.initial,
    createdAt: hoursAgo(120),
    lastActivityAt: hoursAgo(120),
    replyCount: 0,
    participants: [nand],
    replies: [],
  },
];
