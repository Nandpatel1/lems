"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListChecks,
  Quote,
  Code,
} from "lucide-react";
import Markdown from "./Markdown";

/** Matches the marker that opens a list item, so Enter can carry it to the
 *  next line the way every editor people already use does. */
const LIST_RE = /^(\s*)(?:([-*+])\s+(\[[ xX]\]\s+)?|(\d+)\.\s+)/;
const URL_RE = /^https?:\/\/\S+$/i;

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** Resting height. The field grows past it as the text does. */
  minRows?: number;
  autoFocus?: boolean;
  /** ⌘↵ / Ctrl+↵ while writing. */
  onSubmit?: () => void;
  ariaLabel?: string;
};

/** One field that behaves like markdown rather than merely accepting it.
 *
 *  The bet here is that people write details in the same three shapes every
 *  time — a link, a couple of lines of context, a short list of what to focus
 *  on — and that the field should make those three effortless and leave the
 *  rest to plain typing. So: pasting a link onto selected text links it, Enter
 *  carries a list marker forward, and an empty list item ends the list. The
 *  toolbar exists mostly to *announce* that this is markdown; the shortcuts
 *  behind it are what get used.
 *
 *  Preview is a peer of Write rather than a split pane: at this width a split
 *  gives you two cramped columns instead of one comfortable one, and details
 *  are written in short bursts, not composed. */
export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minRows = 4,
  autoFocus,
  onSubmit,
  ariaLabel = "Details",
}: Props) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const taRef = useRef<HTMLTextAreaElement>(null);
  /** Where the caret should land after a programmatic edit. Applied in the
   *  layout effect so React has already re-rendered the new value. */
  const pendingSel = useRef<[number, number] | null>(null);

  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    // Grow to fit. `max-h` on the element caps it and hands over to scrolling,
    // so a long note never pushes the modal's buttons off-screen.
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
    if (pendingSel.current) {
      const [start, end] = pendingSel.current;
      pendingSel.current = null;
      ta.focus();
      ta.setSelectionRange(start, end);
    }
  }, [value, mode]);

  /** Splice `text` into the value and say where the caret ends up. */
  function splice(start: number, end: number, text: string, sel: [number, number]) {
    onChange(value.slice(0, start) + text + value.slice(end));
    pendingSel.current = sel;
  }

  function selection(): [number, number] {
    const ta = taRef.current;
    if (!ta) return [value.length, value.length];
    return [ta.selectionStart, ta.selectionEnd];
  }

  /** Toggleable inline markers: `**`, `_`, `` ` ``. Pressing bold on already
   *  bold text unbolds it, which is the behaviour a toolbar button implies. */
  function wrap(marker: string) {
    const [start, end] = selection();
    const selected = value.slice(start, end);
    const len = marker.length;

    if (
      value.slice(start - len, start) === marker &&
      value.slice(end, end + len) === marker
    ) {
      splice(start - len, end + len, selected, [start - len, end - len]);
      return;
    }
    if (!selected) {
      splice(start, end, marker + marker, [start + len, start + len]);
      return;
    }
    splice(start, end, marker + selected + marker, [start + len, end + len]);
  }

  /** Add or remove a line marker across every line the selection touches. */
  function togglePrefix(prefix: string) {
    const [start, end] = selection();
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndIdx = value.indexOf("\n", end);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

    const lines = value.slice(lineStart, lineEnd).split("\n");
    const allOn = lines.every((l) => l.startsWith(prefix));
    const next = lines
      .map((l) => (allOn ? l.slice(prefix.length) : prefix + l))
      .join("\n");

    splice(lineStart, lineEnd, next, [lineStart, lineStart + next.length]);
  }

  /** ⌘K. Selection that already looks like a URL becomes the destination and
   *  the caret waits for a label; anything else becomes the label with `url`
   *  pre-selected, so the next keystroke replaces it. */
  function insertLink() {
    const [start, end] = selection();
    const selected = value.slice(start, end);

    if (URL_RE.test(selected)) {
      splice(start, end, `[](${selected})`, [start + 1, start + 1]);
      return;
    }
    const label = selected || "text";
    const text = `[${label}](url)`;
    const urlStart = start + label.length + 3;
    splice(start, end, text, selected ? [urlStart, urlStart + 3] : [start + 1, start + 1 + label.length]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (mod && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === "b") return e.preventDefault(), wrap("**");
      if (key === "i") return e.preventDefault(), wrap("_");
      if (key === "k") return e.preventDefault(), insertLink();
    }
    if (e.key !== "Enter" || e.shiftKey || mod) return;

    // List continuation.
    const [start, end] = selection();
    if (start !== end) return;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const line = value.slice(lineStart, start);
    const m = line.match(LIST_RE);
    if (!m) return;

    // Enter on an item you never wrote anything into means "I'm done with the
    // list" — so it clears the marker instead of laying down another one.
    if (line.length === m[0].length) {
      e.preventDefault();
      splice(lineStart, start, "", [lineStart, lineStart]);
      return;
    }

    const [, indent, bullet, task, ordered] = m;
    const marker = ordered
      ? `${Number(ordered) + 1}. `
      : `${bullet} ${task ? "[ ] " : ""}`;
    const insert = `\n${indent}${marker}`;
    e.preventDefault();
    splice(start, start, insert, [start + insert.length, start + insert.length]);
  }

  /** A pasted link is the whole reason this field exists. Dropped onto
   *  selected text it links that text; dropped on its own it stays bare, which
   *  GFM auto-links anyway — so the plain paste needs no ceremony. */
  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = e.clipboardData.getData("text/plain").trim();
    if (!URL_RE.test(pasted)) return;
    const [start, end] = selection();
    if (start === end) return;
    e.preventDefault();
    const label = value.slice(start, end);
    const text = `[${label}](${pasted})`;
    splice(start, end, text, [start + text.length, start + text.length]);
  }

  const hasContent = value.trim().length > 0;
  const tools = [
    { Icon: Bold, label: "Bold", hint: "⌘B", run: () => wrap("**") },
    { Icon: Italic, label: "Italic", hint: "⌘I", run: () => wrap("_") },
    { Icon: Link2, label: "Link", hint: "⌘K", run: insertLink },
    { Icon: List, label: "Bulleted list", run: () => togglePrefix("- ") },
    { Icon: ListChecks, label: "Checklist", run: () => togglePrefix("- [ ] ") },
    { Icon: Quote, label: "Quote", run: () => togglePrefix("> ") },
    { Icon: Code, label: "Code", run: () => wrap("`") },
  ];

  return (
    <div
      // Enter belongs to the editor. Without this the modal's submit-on-Enter
      // would fire from the toolbar and post a half-written resource.
      onKeyDown={(e) => {
        if (e.key === "Enter") e.stopPropagation();
      }}
    >
      <div className="overflow-hidden rounded-control border border-hair bg-surface transition-colors duration-quick focus-within:border-accent">
        {/* One strip, two jobs: what you can do to the text, and which of the
            two views you're in. In Preview the formatting tools leave rather
            than sit there greyed out — nothing to format, nothing to show. */}
        <div className="flex items-center gap-0.5 border-b border-hair bg-surface-soft px-1.5 py-1">
          {mode === "write" &&
            tools.map(({ Icon, label, hint, run }) => (
              <button
                key={label}
                type="button"
                title={hint ? `${label} (${hint})` : label}
                aria-label={label}
                // Keeps the caret where it is, so a toolbar click acts on the
                // selection you made rather than on nothing.
                onMouseDown={(e) => e.preventDefault()}
                onClick={run}
                className="grid h-6 w-6 place-items-center rounded-chip text-ink-3 transition-colors duration-quick hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}

          <div className="ml-auto flex items-center gap-0.5 rounded-chip bg-surface p-0.5">
            {(["write", "preview"] as const).map((m) => {
              const on = mode === m;
              const disabled = m === "preview" && !hasContent;
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  disabled={disabled}
                  title={disabled ? "Nothing to preview yet" : undefined}
                  onClick={() => setMode(m)}
                  className={`rounded-[5px] px-2 py-0.5 text-[11px] transition-colors duration-quick disabled:opacity-40 ${
                    on
                      ? "bg-accent-tint font-medium text-accent-ink"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {m === "write" ? "Write" : "Preview"}
                </button>
              );
            })}
          </div>
        </div>

        {mode === "write" ? (
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            rows={minRows}
            autoFocus={autoFocus}
            aria-label={ariaLabel}
            placeholder={placeholder}
            className="block max-h-[50vh] w-full resize-none bg-surface px-3 py-2.5 text-[13px] leading-[1.7] text-ink outline-none placeholder:text-ink-3"
          />
        ) : (
          // Matched padding and a floor equal to the resting textarea, so
          // switching views doesn't make the panel jump.
          <div
            className="max-h-[50vh] overflow-y-auto px-3 py-2.5"
            style={{ minHeight: `${minRows * 22 + 20}px` }}
          >
            <Markdown>{value}</Markdown>
          </div>
        )}
      </div>

      <p className="mt-1.5 text-[11px] leading-normal text-ink-3">
        Markdown supported. Paste a link onto selected text to turn it into a link.
      </p>
    </div>
  );
}
