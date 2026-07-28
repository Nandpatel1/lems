"use client";

import { useState } from "react";
import type { TeamMember } from "@/lib/types";
import MemberTasksModal from "./MemberTasksModal";

export default function TeamBoard({
  members,
  currentUid,
}: {
  members: TeamMember[];
  currentUid: string | null;
}) {
  const [selected, setSelected] = useState<TeamMember | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <section
            key={m.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(m)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelected(m);
              }
            }}
            className="cursor-pointer rounded-card border border-hair bg-surface p-4 transition-colors duration-quick hover:border-hair-strong hover:bg-surface-soft/40"
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-tint text-[13px] font-medium text-accent-ink">
                {m.initial}
              </span>
              <span className="text-[14px] font-medium text-ink">{m.name}</span>
            </div>

            <div className="mb-3 flex gap-4">
              <div>
                <p className="text-[20px] font-medium text-ship-ink">{m.shipped}</p>
                <p className="text-[11px] text-ink-3">shipped</p>
              </div>
              <div>
                <p className="text-[20px] font-medium text-accent-ink">{m.inProgress}</p>
                <p className="text-[11px] text-ink-3">in progress</p>
              </div>
            </div>

            <div className="rounded-control bg-surface-soft px-3 py-2">
              <p className="text-[11px] text-ink-3">now</p>
              <p className="text-[12px] text-ink">{m.focus}</p>
            </div>

            {m.id === currentUid && (
              <p className="mt-3 text-[11px] text-ink-3">This is you · tap to review</p>
            )}
          </section>
        ))}
      </div>

      {selected && (
        <MemberTasksModal
          member={{ id: selected.id, name: selected.name, initial: selected.initial }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
