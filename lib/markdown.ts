/** Small, dependency-free readers for markdown *text* — not a renderer.
 *
 *  The library list can't afford to mount a markdown renderer per row, and it
 *  wouldn't want to: a row needs one flat line of prose and, at most, where the
 *  thing lives. These helpers pull exactly that out of the source text.
 *  Rendering proper is `components/Markdown.tsx`. */

/** A resource's details, flattened to a single line of readable prose.
 *  Markers are removed rather than escaped — the point is a calm preview line,
 *  so `**bold**` becomes bold, and a URL becomes the site it points at. */
export function plainExcerpt(md: string | undefined, max = 150): string {
  if (!md) return "";
  const text = md
    .replace(/```[\s\S]*?```/g, "\n") // fenced code — never useful in a preview
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, "$1") // links keep their label only
    // A link pasted on its own line is the most common first line there is, and
    // the row already shows its host as a chip. Spending the opening words of
    // the preview on a repeat of that chip is the one thing it can't afford.
    .replace(/^[ \t]*https?:\/\/\S+[ \t]*$/gm, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*([-*_]\s*){3,}$/gm, "") // horizontal rules
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    // A URL still sitting inside a sentence: the host is the readable part.
    .replace(/https?:\/\/(?:www\.)?([^\s)]+)/g, (_m, rest: string) => rest.split("/")[0]);

  // Blocks are joined with a separator rather than a space. A heading running
  // straight into the line beneath it reads as one broken sentence; a middot
  // says these were separate thoughts without pretending to be punctuation.
  const flat = text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" · ");

  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

/** The first link in the details, markdown or bare. */
export function firstUrl(md: string | undefined): string | undefined {
  if (!md) return undefined;
  const inline = md.match(/\]\((https?:\/\/[^\s)]+)\)/);
  if (inline) return inline[1];
  const bare = md.match(/(?:^|\s)(https?:\/\/[^\s<>)]+)/);
  return bare?.[1];
}

/** `https://www.youtube.com/watch?v=…` → `youtube.com`.
 *  This is what replaced the old hand-typed "Source" field: where a resource
 *  lives is derivable from the link someone already pasted, so nobody should
 *  have to type "YouTube" into a box to say so. */
export function domainOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/** The site a resource points at, straight from its details. */
export function sourceDomain(md: string | undefined): string | undefined {
  return domainOf(firstUrl(md));
}
