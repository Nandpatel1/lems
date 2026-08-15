"use client";

import { useEffect } from "react";
import { markTopicSeen } from "@/app/actions";
import { useNotifications } from "./NotificationsProvider";

/** Renders nothing; its whole job is the side effect.
 *
 *  Opening a topic is the act of reading it, so arriving on the page is what
 *  clears its highlight — not a "mark as read" button nobody would press. Both
 *  halves fire together: the local one so the badge drops before the network
 *  does anything, the server one so it stays dropped on the next visit and in
 *  the other founder's tab.
 *
 *  Deliberately not done during the page's server render: a GET that quietly
 *  writes to the database is the kind of thing that fires twice on a prefetch
 *  and once more on every refresh. */
export default function MarkTopicSeen({ topicId }: { topicId: string }) {
  const { forgetTopic } = useNotifications();

  useEffect(() => {
    forgetTopic(topicId);
    markTopicSeen(topicId).catch(() => {});
  }, [topicId, forgetTopic]);

  return null;
}
