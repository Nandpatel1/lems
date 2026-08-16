"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/** Every element is mapped by hand onto the app's tokens rather than left to a
 *  typography plugin. Details live inside modals at 13px, so the whole scale is
 *  compressed: an `h1` here is 15px, not 32px. Headings that arrive first in a
 *  block lose their top margin (`first:mt-0`) so the rendered text starts flush
 *  with the label above it, exactly where a plain paragraph would have.
 *
 *  No `rehype-raw`: raw HTML in the source stays inert text. Details are shared
 *  across the team, and a paste from a random page shouldn't be able to inject
 *  markup into everyone else's screen. */
const components: Components = {
  p: ({ children }) => (
    <p className="my-2 text-[13px] leading-[1.7] text-ink first:mt-0 last:mb-0">{children}</p>
  ),

  h1: ({ children }) => (
    <h1 className="mb-1.5 mt-5 text-[15px] font-semibold leading-snug text-ink first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-4 text-[14px] font-semibold leading-snug text-ink first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-3.5 text-[13px] font-semibold leading-snug text-ink first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-1 mt-3 text-[12px] font-semibold uppercase tracking-wide text-ink-2 first:mt-0">
      {children}
    </h4>
  ),

  // Links open away from the app — a resource's details are a jumping-off
  // point, and losing the page you were reading to follow one is a bad trade.
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-accent-ink underline decoration-accent/40 underline-offset-2 transition-colors duration-quick hover:decoration-accent break-words"
    >
      {children}
    </a>
  ),

  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="text-ink-3 line-through">{children}</del>,

  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 marker:text-ink-3 first:mt-0 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-ink-3 first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children, className }) => {
    // GFM tags checklist items; they carry their own box, so the bullet would
    // be a second marker on the same line.
    const isTask = typeof className === "string" && className.includes("task-list-item");
    return (
      <li className={`text-[13px] leading-[1.65] text-ink ${isTask ? "-ml-5 list-none" : ""}`}>
        {children}
      </li>
    );
  },
  // Rendered, not editable: ticking a box here would silently rewrite shared
  // text for the whole team, so the state is shown and left alone.
  input: ({ checked, type }) =>
    type === "checkbox" ? (
      <input
        type="checkbox"
        checked={!!checked}
        readOnly
        aria-readonly="true"
        tabIndex={-1}
        className="pointer-events-none mr-2 h-[13px] w-[13px] translate-y-[2px] accent-accent"
      />
    ) : null,

  blockquote: ({ children }) => (
    <blockquote className="my-2.5 border-l-2 border-accent/40 pl-3 text-ink-2 first:mt-0 last:mb-0">
      {children}
    </blockquote>
  ),

  code: ({ children, className }) => (
    <code
      className={`rounded-[5px] bg-surface-soft px-1.5 py-0.5 font-mono text-[12px] text-ink ${
        className ?? ""
      }`}
    >
      {children}
    </code>
  ),
  // The inner `code` is reset back to plain text by the `.md pre code` rule in
  // globals.css — a pill inside a code block is a pill too many.
  pre: ({ children }) => (
    <pre className="my-2.5 overflow-x-auto rounded-control border border-hair bg-surface-soft p-3 font-mono text-[12px] leading-relaxed text-ink first:mt-0 last:mb-0">
      {children}
    </pre>
  ),

  hr: () => <hr className="my-4 border-hair" />,

  // Tables scroll inside their own box; the modal itself must never scroll
  // sideways.
  table: ({ children }) => (
    <div className="my-2.5 overflow-x-auto rounded-control border border-hair">
      <table className="w-full border-collapse text-[12px]">{children}</table>
    </div>
  ),
  // The rule belongs to the row, not the cell: on a cell, `last:` means the
  // last *column*, which draws the divider under part of a row and not the
  // rest of it.
  tr: ({ children }) => <tr className="border-b border-hair last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="bg-surface-soft px-2.5 py-1.5 text-left font-medium text-ink-2">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-2.5 py-1.5 align-top text-ink">{children}</td>
  ),

  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} className="my-2 max-w-full rounded-control border border-hair" />
  ),
};

/** Read-only rendering of a details field. */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
