"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { AppNotification } from "@/lib/data";
import {
  clearNotifications,
  dismissNotification,
  fetchNotifications,
} from "@/app/actions";

/** How often an open tab re-checks. Notifications arrive from other people, so
 *  nothing local can invalidate them — but a founder leaves this tab open all
 *  day, and a bell that only updates on navigation reads as broken. */
const POLL_MS = 60_000;

interface NotificationsValue {
  items: AppNotification[];
  /** Topics this person has activity on that they haven't opened yet. Drives
   *  the Discuss tab badge and the highlight on individual cards. */
  unseenTopics: Set<string>;
  /** Take one row off the list — what opening or dismissing it does. */
  drop: (id: string) => void;
  clearAll: () => void;
  /** Opening a topic means you've seen everything in it. Clears its rows
   *  locally; `markTopicSeen` does the same on the server. */
  forgetTopic: (topicId: string) => void;
}

const Ctx = createContext<NotificationsValue | null>(null);

export function useNotifications(): NotificationsValue {
  const value = useContext(Ctx);
  if (!value)
    throw new Error("useNotifications must be used inside NotificationsProvider");
  return value;
}

/** One copy of the notification list for the whole app shell.
 *
 *  It used to live inside the bell, which was fine while the bell was the only
 *  thing that cared. Now the Discuss tab badge and every topic card read the
 *  same state, and three components each polling their own copy would drift
 *  apart within a minute of each other.
 *
 *  Ids acted on locally are remembered in `dismissed`, because a poll or a
 *  server re-render that raced the delete would otherwise resurrect a row the
 *  reader has already dealt with — and a badge that reappears after you clear
 *  it is worse than no badge. */
export default function NotificationsProvider({
  initial,
  children,
}: {
  initial: AppNotification[];
  children: React.ReactNode;
}) {
  const dismissed = useRef<Set<string>>(new Set());
  const [items, setItems] = useState<AppNotification[]>(initial);
  const [, startTransition] = useTransition();

  const accept = useCallback((incoming: AppNotification[]) => {
    setItems(incoming.filter((n) => !dismissed.current.has(n.id)));
  }, []);

  // The server render is the source of truth on navigation; polling refreshes
  // it in place between navigations.
  useEffect(() => accept(initial), [initial, accept]);

  const refresh = useCallback(() => {
    fetchNotifications().then(accept).catch(() => {});
  }, [accept]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const id = setInterval(onFocus, POLL_MS);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  const drop = useCallback((id: string) => {
    dismissed.current.add(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
    startTransition(async () => {
      await dismissNotification(id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems((prev) => {
      for (const n of prev) dismissed.current.add(n.id);
      return [];
    });
    startTransition(async () => {
      await clearNotifications();
    });
  }, []);

  /** Local half of "I've read this topic". The server half is `markTopicSeen`,
   *  called alongside it — this one exists so the badge drops the instant the
   *  page opens rather than on the next round trip. */
  const forgetTopic = useCallback((topicId: string) => {
    setItems((prev) => {
      for (const n of prev) if (n.topicId === topicId) dismissed.current.add(n.id);
      return prev.filter((n) => n.topicId !== topicId);
    });
  }, []);

  const unseenTopics = useMemo(
    () =>
      new Set(
        items
          .filter((n) => n.topicId && (n.type === "topic" || n.type === "topic_reply"))
          .map((n) => n.topicId as string)
      ),
    [items]
  );

  const value = useMemo(
    () => ({ items, unseenTopics, drop, clearAll, forgetTopic }),
    [items, unseenTopics, drop, clearAll, forgetTopic]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
