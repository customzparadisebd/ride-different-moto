import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, AlertTriangle, RefreshCw, Lock, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { verifyDatabaseSecurity } from "@/lib/security-check.functions";
import { site } from "@/data/site";

export const Route = createFileRoute("/ad/diagnostics")({
  component: AdminDiagnostics,
});

function AdminDiagnostics() {
  const verify = useServerFn(verifyDatabaseSecurity) as any;
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await (verify as any)({ data: {} });
      setResults(res);
      toast.success("Security check completed");
    } catch (err: any) {
      toast.error(err.message || "Security check failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Security Diagnostics</h1>
          <p className="text-sm text-muted-foreground">Automated RLS verification and index coverage check.</p>
        </div>
        <Button 
          variant="red" 
          onClick={runCheck} 
          disabled={loading}
          className="gap-2"
        >
          {loading ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          Run Security Scan
        </Button>
      </div>

      <div className="mt-8 grid gap-6">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-tight">
            <Lock className="size-5 text-primary" />
            Row Level Security (RLS) Status
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="p-3">Table</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Access</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!results ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                      No scan results available. Run a security scan to verify database policies.
                    </td>
                  </tr>
                ) : (
                  results.results.map((res: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{res.table}</td>
                      <td className="p-3 font-mono text-[10px] uppercase">{res.role}</td>
                      <td className="p-3 text-xs text-muted-foreground">{res.action}</td>
                      <td className="p-3 text-right">
                        {res.status === "SECURE" || res.success ? (
                          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">
                            PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                            FAIL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-tight">
            <ExternalLink className="size-5 text-primary" />
            SEO & Index Coverage
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StatusCard 
              label="Sitemap XML"
              status="Online"
              href="/api/public/sitemap/xml"
              description="Dynamically generated product sitemap"
            />
            <StatusCard 
              label="Robots.txt"
              status="Valid"
              href="/api/public/robots/txt"
              description="Crawler instructions and sitemap link"
            />
          </div>
          <div className="mt-6 rounded-lg bg-muted/50 p-4 border border-border">
             <div className="flex items-start gap-3">
                <AlertTriangle className="size-4 text-amber-500 mt-1" />
                <div className="text-xs space-y-2">
                   <p className="font-bold uppercase tracking-wider text-foreground">Action Required</p>
                   <p className="text-muted-foreground leading-relaxed">
                      To complete indexing, you must manually submit the sitemap to search engines:
                   </p>
                   <ul className="list-disc list-inside text-primary font-medium">
                      <li><a href="https://search.google.com/search-console/sitemaps" target="_blank" rel="noreferrer" className="hover:underline">Google Search Console</a></li>
                      <li><a href="https://www.bing.com/webmasters/sitemaps" target="_blank" rel="noreferrer" className="hover:underline">Bing Webmaster Tools</a></li>
                   </ul>
                   <p className="text-[10px] italic">Verification URL: {site.url}/api/public/sitemap/xml</p>
                </div>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusCard({ label, status, href, description }: { label: string; status: string; href: string; description: string }) {
  return (
    <div className="rounded-lg border border-border p-4 transition-all hover:border-primary/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-[10px] font-bold text-green-500 uppercase">{status}</span>
      </div>
      <p className="mt-1 text-xs text-foreground font-semibold">{description}</p>
      <a 
        href={href} 
        target="_blank" 
        rel="noreferrer" 
        className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
      >
        View Route <ExternalLink className="size-3" />
      </a>
    </div>
  );
}
