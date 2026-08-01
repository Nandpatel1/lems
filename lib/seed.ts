import type {
  Task,
  Milestone,
  Founder,
  LibraryFolder,
  TeamMember,
  Confidence,
} from "./types";

export const founder = { name: "Nand", initial: "N" };

export const founders: Founder[] = [
  { id: "n", name: "Nand", initial: "N" },
  { id: "a", name: "Aryan", initial: "A" },
  { id: "r", name: "Rohan", initial: "R" },
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
    parkedReason: "Aryan's on ads",
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
  { id: "a", name: "Aryan", initial: "A", pending: 3 },
  { id: "r", name: "Rohan", initial: "R", pending: 1 },
];

export const confidences: Confidence[] = [
  { id: "n", name: "Nand", initial: "N", score: 3 },
  { id: "a", name: "Aryan", initial: "A", score: 4 },
  { id: "r", name: "Rohan", initial: "R", score: 3 },
];
