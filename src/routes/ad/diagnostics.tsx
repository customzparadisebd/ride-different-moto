import { getEnvironment } from "@/lib/env";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, Globe, Settings, Database } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ad/diagnostics")({
  component: DiagnosticsPage,
});

function DiagnosticsPage() {
  const env = getEnvironment();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "N/A (SSR)";
  const viteAppEnv = import.meta.env["VITE_APP_ENV"] || "Not Set";
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "Not Set";

  const maskValue = (val: string, type: "url" | "token") => {
    if (val === "Not Set") return val;
    if (type === "url") {
      try {
        const url = new URL(val);
        // Only show the project ref part of the subdomain
        const projectRef = url.hostname.split(".")[0];
        return `${url.protocol}//${projectRef}.supabase.co (Redacted)`;
      } catch {
        return val.substring(0, 10) + "... (Redacted)";
      }
    }
    return val.substring(0, 4) + "****" + val.substring(val.length - 4);
  };

  const data = [
    {
      label: "Current Hostname",
      value: hostname,
      icon: Globe,
      description: "Used to detect production vs. staging by domain matching.",
    },
    {
      label: "VITE_APP_ENV",
      value: viteAppEnv,
      icon: Settings,
      description: "Explicit environment override variable.",
    },
    {
      label: "Supabase Project",
      value: maskValue(supabaseUrl, "url"),
      icon: Database,
      description: "The backend project (redacted for security).",
    },
    {
      label: "Detected Environment",
      value: env.toUpperCase(),
      icon: env === "production" ? ShieldCheck : AlertTriangle,
      description: "The final resolution used for UI banners and safety checks.",
      highlight: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">System Diagnostics</h1>
        <p className="text-muted-foreground">Technical environment details and detection logic audit.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.map((item) => (
          <Card key={item.label} className={item.highlight ? "border-primary/50 bg-primary/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <item.icon className={item.highlight ? "text-primary h-4 w-4" : "text-muted-foreground h-4 w-4"} />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate" title={item.value}>
                {item.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment Detection Logic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 font-mono text-xs">
            <p className="font-bold text-primary mb-2">// Detection logic from src/lib/env.ts</p>
            <p>if (hostname === "customzparadisebd.com" || hostname === "www.customzparadisebd.com" || VITE_APP_ENV === "production") {"{"}</p>
            <p className="ml-4 text-emerald-500">return "production";</p>
            <p>{"}"} else {"{"}</p>
            <p className="ml-4 text-amber-500">return "staging";</p>
            <p>{"}"}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            The "STAGING" badge appears because the current hostname does not match the production whitelist and the override variable is not set to production.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
