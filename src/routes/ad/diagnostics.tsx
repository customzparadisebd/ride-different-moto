import { getEnvironment } from "@/lib/env";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, Globe, Settings, Database, Lock } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminContext } from "@/lib/admin.functions";
import { getDiagnosticsContext } from "@/lib/diagnostics.functions";
import { PERMISSIONS } from "@/lib/admin.shared";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ad/diagnostics")({
  component: DiagnosticsPage,
});

function DiagnosticsPage() {
  const { data: adminContext, isLoading: contextLoading } = useQuery({
    queryKey: ["admin-context"],
    queryFn: () => getAdminContext(),
  });

  const { data: diagContext, error: diagError, isLoading: diagLoading } = useQuery({
    queryKey: ["diagnostics-audit"],
    queryFn: () => getDiagnosticsContext(),
    retry: false,
  });

  const env = getEnvironment();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "N/A (SSR)";
  const viteAppEnv = import.meta.env["VITE_APP_ENV"] || "Not Set";
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "Not Set";

  const maskValue = (val: string, type: "url" | "token") => {
    if (val === "Not Set") return val;
    if (type === "url") {
      try {
        const url = new URL(val);
        const projectRef = url.hostname.split(".")[0];
        return `${url.protocol}//${projectRef}.supabase.co (Redacted)`;
      } catch {
        return val.substring(0, 10) + "... (Redacted)";
      }
    }
    return val.substring(0, 4) + "****" + val.substring(val.length - 4);
  };

  if (contextLoading || diagLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const hasPermission = adminContext?.permissions.includes(PERMISSIONS.staffManage);

  if (!hasPermission || diagError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-destructive/10 p-6">
          <Lock className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="max-w-md text-muted-foreground">
          You do not have the required permissions ({PERMISSIONS.staffManage}) to view system diagnostics.
          This attempt has been logged for security audit.
        </p>
        <Button asChild variant="outline">
          <Link to="/ad">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

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
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-500">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4" />
              Security Note
            </div>
            <p className="mt-1">
              Access to this page is restricted and every visit is recorded in the audit log.
              Sensitive backend parameters are masked to prevent credential exposure.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
