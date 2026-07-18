"use client";

import { MessageCircle } from "lucide-react";
import { waMeUrl } from "@/lib/wa";

/** One-tap WhatsApp nudge: opens WhatsApp with a prefilled message; the user
 *  picks the team group and sends. Free, no API. */
export default function WaNudge({
  text,
  label = "Nudge on WhatsApp",
}: {
  text: string;
  label?: string;
}) {
  return (
    <a
      href={waMeUrl(text)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-control border border-hair-strong bg-surface px-3 py-2 text-[13px] text-ink-2 transition-colors duration-quick hover:bg-surface-soft"
    >
      <MessageCircle className="h-4 w-4 text-ship-ink" />
      {label}
    </a>
  );
}
