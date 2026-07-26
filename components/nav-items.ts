import { Sun, BookOpen, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/team", label: "Team", icon: Users },
];
