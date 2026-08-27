// ============================================================
// SAFE HTML
// Purpose: Render admin-authored product HTML safely. An isomorphic
//          allowlist sanitiser runs during SSR so the formatted
//          description (paragraphs, lists, images, links) is in the
//          first paint and visible to crawlers / no-JS clients.
//          DOMPurify then re-sanitises in the browser as the
//          authoritative pass.
// ============================================================
import { useEffect, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";

export function SafeHtml({ html, className }: { html: string; className?: string }) {
  const [clean, setClean] = useState<string>(() => sanitizeHtml(html));

  useEffect(() => {
    let cancelled = false;
    setClean(sanitizeHtml(html));
    void import("dompurify").then((mod) => {
      if (cancelled) return;
      setClean(mod.default.sanitize(html));
    });
    return () => {
      cancelled = true;
    };
  }, [html]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
