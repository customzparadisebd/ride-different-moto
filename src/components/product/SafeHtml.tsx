// ============================================================
// SAFE HTML
// Purpose: Render admin-authored product HTML safely. Sanitising
//          happens in the browser with the bundled DOMPurify (the
//          previous CDN <script> was blocked by our CSP, so
//          descriptions were rendered unsanitised or not at all).
// ============================================================
import { useEffect, useState } from "react";

export function SafeHtml({ html, className }: { html: string; className?: string }) {
  const [clean, setClean] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("dompurify").then((mod) => {
      if (cancelled) return;
      setClean(mod.default.sanitize(html));
    });
    return () => {
      cancelled = true;
    };
  }, [html]);

  // Before sanitising (SSR + first paint) render as plain text — never raw HTML.
  if (clean === null) {
    return <div className={className}>{html.replace(/<[^>]*>/g, "")}</div>;
  }
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
