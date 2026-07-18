"use client";

import { useState, useTransition } from "react";
import { Bell, Check, MessageCircle } from "lucide-react";
import { pokeTeammate } from "@/app/actions";
import { waMeUrl } from "@/lib/wa";

export default function NudgeButton({
  memberId,
  memberName,
  focus,
}: {
  memberId: string;
  memberName: string;
  focus: string;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const waText = `Nudge for ${memberName}: keep the momentum on "${focus}". We're on the road to launch.`;

  function nudge() {
    startTransition(async () => {
      const res = await pokeTeammate(
        memberId,
        null,
        `A teammate nudged you — keep going on "${focus}".`
      );
      if (res.ok) setDone(true);
    });
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        onClick={nudge}
        disabled={pending || done}
        className={`inline-flex items-center gap-1.5 rounded-control border px-3 py-1.5 text-[12px] transition-colors duration-quick ${
          done
            ? "border-ship-tint bg-ship-tint text-ship-ink"
            : "border-hair-strong bg-surface text-ink-2 hover:bg-surface-soft"
        }`}
      >
        {done ? (
          <>
            <Check className="h-3.5 w-3.5" /> Nudged
          </>
        ) : (
          <>
            <Bell className="h-3.5 w-3.5" /> Nudge
          </>
        )}
      </button>
      <a
        href={waMeUrl(waText)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Nudge ${memberName} on WhatsApp`}
        className="grid h-[30px] w-[30px] place-items-center rounded-control border border-hair-strong bg-surface text-ship-ink transition-colors duration-quick hover:bg-surface-soft"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
    </div>
  );
}
