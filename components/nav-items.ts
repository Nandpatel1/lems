import { Sun, BookOpen, MessagesSquare, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Ordered by how far each one is from your own hands: what you're doing now,
 *  what's on the shelf, what the team is talking about, who's carrying what.
 *  Discuss sits before Team because it's a place you write, not a dashboard
 *  you read. */
export const navItems: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/discuss", label: "Discuss", icon: MessagesSquare },
  { href: "/team", label: "Team", icon: Users },
];
