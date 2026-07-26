"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export type SelectOption = { value: string; label: string };

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  ariaLabel,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const o = options[active];
        if (o) {
          onChange(o.value);
          setOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, active, options, onChange]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setActive(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((o) => !o);
        }}
        className="flex w-full items-center justify-between gap-2 rounded-control border border-hair bg-surface px-3 py-2 text-[13px] transition-colors duration-quick hover:border-hair-strong focus:border-accent focus:outline-none disabled:opacity-50"
      >
        <span className={`truncate ${selected ? "text-ink" : "text-ink-3"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-3 transition-transform duration-quick ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto rounded-control border border-hair bg-surface p-1 shadow-md"
        >
          {options.map((o, i) => {
            const isSel = o.value === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={isSel}
                key={o.value}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-[7px] px-2.5 py-2 text-left text-[13px] transition-colors duration-quick ${
                  i === active ? "bg-surface-soft" : ""
                } ${isSel ? "font-medium text-accent-ink" : "text-ink"}`}
              >
                <span className="truncate">{o.label}</span>
                {isSel && <Check className="h-3.5 w-3.5 shrink-0 text-accent-ink" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
