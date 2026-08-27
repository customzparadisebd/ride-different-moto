// ============================================================
// SANITIZE HTML (isomorphic, no DOM required)
// Purpose: Produce safe, structure-preserving HTML during SSR so
//          product descriptions render formatted on first paint.
//          On the client, DOMPurify still re-sanitises as the
//          authoritative pass (defense in depth).
// ============================================================

const ALLOWED_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "small", "span", "div",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "pre", "code", "hr",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "a", "img", "figure", "figcaption",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
};

// Tags whose entire content must be dropped.
const DANGEROUS_BLOCKS = /<(script|style|iframe|object|embed|noscript|svg|math|template|form)\b[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_SELF = /<\/?(script|style|iframe|object|embed|noscript|svg|math|template|form|input|button|link|meta|base)\b[^>]*>/gi;

function isSafeUrl(value: string): boolean {
  const url = value.trim().replace(/[\u0000-\u001f]/g, "").toLowerCase();
  if (url.startsWith("javascript:") || url.startsWith("data:") || url.startsWith("vbscript:")) {
    return url.startsWith("data:image/") && !url.includes("svg");
  }
  return true;
}

function sanitizeAttrs(tag: string, rawAttrs: string): string {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed) return "";

  const out: string[] = [];
  const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(rawAttrs)) !== null) {
    const name = (match[1] ?? "").toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    if (!allowed.has(name)) continue;
    if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;
    out.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }
  if (tag === "a") {
    const hasTarget = out.some((a) => a.startsWith("target="));
    if (hasTarget) out.push('rel="noopener noreferrer"');
  }
  return out.length ? ` ${out.join(" ")}` : "";
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";

  let html = input.replace(DANGEROUS_BLOCKS, "").replace(DANGEROUS_SELF, "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  return html.replace(
    /<\s*(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g,
    (_full, slash: string, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (slash) return `</${tag}>`;
      const selfClosing = tag === "br" || tag === "img" || tag === "hr";
      return `<${tag}${sanitizeAttrs(tag, rawAttrs)}${selfClosing ? " /" : ""}>`;
    },
  );
}
