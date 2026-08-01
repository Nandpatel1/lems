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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            className="group flex cursor-pointer items-center gap-3 rounded-card border border-hair bg-surface px-4 py-3.5 transition-colors duration-quick hover:border-hair-strong hover:bg-surface-soft/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-[15px] font-medium text-accent-ink">
              {m.initial}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-medium text-ink">{m.name}</span>
                {m.id === currentUid && (
                  <span className="shrink-0 rounded-chip bg-surface-soft px-2 py-0.5 text-[10px] text-ink-3">
                    you
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-ink-3">
                {m.pending > 0 ? (
                  <>
                    <span className="font-medium text-accent-ink">{m.pending}</span> pending
                  </>
                ) : (
                  "Nothing pending"
                )}
              </p>
            </div>
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
