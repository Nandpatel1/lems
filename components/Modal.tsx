"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({
  title,
  onClose,
  onEnter,
  children,
  maxWidth = "max-w-md",
}: {
  title?: React.ReactNode;
  onClose: () => void;
  onEnter?: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the card so keyboard events originate inside the modal (unless an
    // inner field already grabbed focus via autoFocus).
    const card = cardRef.current;
    if (card && !card.contains(document.activeElement)) card.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleKeyDown(e: React.KeyboardEvent) {
    // Never let key events leak to elements behind the modal.
    e.stopPropagation();
    if (e.key === "Enter" && onEnter) {
      const t = e.target as HTMLElement;
      if (t.tagName === "TEXTAREA") return; // allow newlines
      if (document.querySelector('[data-select-open="true"]')) return; // let a dropdown pick
      e.preventDefault();
      onEnter();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className={`flex max-h-[85vh] w-full ${maxWidth} flex-col rounded-hero border border-hair bg-canvas p-5 outline-none`}
      >
        {title !== undefined && (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="text-[16px] font-medium text-ink">{title}</div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 text-ink-3 transition-colors duration-quick hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
