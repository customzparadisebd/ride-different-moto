import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, Globe, User, AlertTriangle, Radio, Lock, Activity, RefreshCw, Beaker, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getSecurityStats,
  getSuspiciousIPs,
  listSecurityEvents,
} from "@/lib/security-events.functions";
import { runInvoiceStressTest, runLoadTest } from "@/lib/stress-test.functions";
import { listSecurityAlerts, listInvoiceCollisions, markNotificationRead } from "@/lib/security-alerts.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// BD Timezone is UTC+6
const toBDTime = (date: string | Date) => {
  const d = new Date(date);
  return new Date(d.getTime() + 6 * 60 * 60 * 1000);
};

export const Route = createFileRoute("/_authenticated/ad/security-dashboard")({
  head: () => ({
    meta: [
      { title: "Security Dashboard — CZP Ops" },
      { name: "description", content: "Real-time security monitoring for Customz Paradise BD" },
    ],
  }),
  component: SecurityDashboardPage,
});

function SecurityDashboardPage() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stressResult, setStressResult] = useState<any>(null);
  const [isStressing, setIsStressing] = useState(false);
  const [loadResult, setLoadResult] = useState<any>(null);
  const [isLoadTesting, setIsLoadTesting] = useState(false);

  const { data: stats, refetch: refetchStats } = useSuspenseQuery({
    queryKey: ["security-stats"],
    queryFn: () => getSecurityStats({ data: undefined }),
  });

  const { data: suspiciousIPs, refetch: refetchSuspicious } = useSuspenseQuery({
    queryKey: ["suspicious-ips"],
    queryFn: () => getSuspiciousIPs({ data: undefined }),
  });

  const { data: recentEvents, refetch: refetchEvents } = useSuspenseQuery({
    queryKey: ["recent-security-events"],
    queryFn: () => listSecurityEvents({ data: { limit: 10 } } as never),
  });

  const { data: securityAlerts, refetch: refetchAlerts } = useSuspenseQuery({
    queryKey: ["security-alerts"],
    queryFn: () => listSecurityAlerts({ data: undefined }),
  });

  const { data: collisions, refetch: refetchCollisions } = useSuspenseQuery({
    queryKey: ["invoice-collisions"],
    queryFn: () => listInvoiceCollisions({ data: undefined }),
  });

  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchStats(), 
      refetchSuspicious(), 
      refetchEvents(),
      refetchAlerts(),
      refetchCollisions()
    ]);
    setIsRefreshing(false);
  };

  const runStressTest = async () => {
    setIsStressing(true);
    try {
      const result = await runInvoiceStressTest();
      setStressResult(result);
    } catch (err) {
      setStressResult({ success: false, errors: ["Request failed"] });
    } finally {
      setIsStressing(false);
    }
  };

  const executeLoadTest = async () => {
    setIsLoadTesting(true);
    try {
      const result = await runLoadTest();
      setLoadResult(result);
    } catch (err) {
      setLoadResult({ success: false, errors: ["Load test failed"] });
    } finally {
      setIsLoadTesting(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("security-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["security-stats"] });
          queryClient.invalidateQueries({ queryKey: ["recent-security-events"] });
          queryClient.invalidateQueries({ queryKey: ["suspicious-ips"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "invoice_collisions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["invoice-collisions"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-black uppercase tracking-tighter text-foreground dark:text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Security Monitoring
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20 text-[10px] tracking-widest uppercase flex items-center gap-1.5 animate-pulse"
            >
              <Radio className="h-3 w-3" />
              Live
            </Badge>
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">
            Real-time threat detection and incident response
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-accent/50 hover:bg-accent dark:bg-white/5 dark:hover:bg-white/10 border border-border dark:border-white/10 rounded-md text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card dark:bg-black/40 border-border dark:border-white/5 hover:border-red-500/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Auth Failures
                </p>
                <h3 className="text-2xl font-black text-foreground dark:text-white group-hover:text-red-500 transition-colors">
                  {stats.authFailures}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">Last 24 hours</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                <Lock className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-black/40 border-border dark:border-white/5 hover:border-amber-500/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Rate Limits
                </p>
                <h3 className="text-2xl font-black text-foreground dark:text-white group-hover:text-amber-500 transition-colors">
                  {stats.rateLimits}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Violations recorded
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-black/40 border-border dark:border-white/5 hover:border-blue-500/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Suspicious IPs
                </p>
                <h3 className="text-2xl font-black text-foreground dark:text-white group-hover:text-blue-500 transition-colors">
                  {stats.suspiciousIPs}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Unique addresses
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-black/40 border-border dark:border-white/5 hover:border-green-500/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Total Events
                </p>
                <h3 className="text-2xl font-black text-foreground dark:text-white group-hover:text-green-500 transition-colors">
                  {stats.totalEvents}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">System wide</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Chart */}
        <Card className="lg:col-span-2 bg-card dark:bg-black/40 border-border dark:border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Security Event Timeline
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Incident frequency per hour (Last 24h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeline}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="currentColor"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "currentColor", fontWeight: "bold", opacity: 0.4 }}
                  />
                  <YAxis
                    stroke="currentColor"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "currentColor", fontWeight: "bold", opacity: 0.4 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#ef4444", fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Suspicious IPs */}
        <Card className="bg-card dark:bg-black/40 border-border dark:border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Top Suspicious IPs
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Addresses flagged for excessive failures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suspiciousIPs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No suspicious activity detected.
                </p>
              ) : (
                suspiciousIPs.map((ip) => (
                  <div
                    key={ip.ip}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/30 dark:bg-white/5 border border-border dark:border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-mono font-bold text-foreground dark:text-white/90">{ip.ip}</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                          {ip.failures} Failures · {ip.limits} Limits
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-500/30 text-amber-500 bg-amber-500/5 uppercase tracking-widest"
                    >
                      Flagged
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts & Invoice Collisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card dark:bg-black/40 border-border dark:border-white/5 border-l-4 border-l-red-600">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Security Alerts


            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Critical system alerts and collision incidents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityAlerts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No active security alerts.</p>
              ) : (
                securityAlerts.map((alert: any) => (
                  <div 
                    key={alert.id} 
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      alert.is_read ? "bg-accent/30 dark:bg-white/5 border-border dark:border-white/5 opacity-60" : "bg-red-500/5 dark:bg-red-950/20 border-red-200 dark:border-red-900/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-black text-foreground dark:text-white uppercase tracking-tight">{alert.title}</p>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{format(new Date(alert.created_at), "HH:mm:ss")}</span>
                    </div>
                    <p className="text-[11px] text-foreground/70 dark:text-white/70 leading-relaxed mb-2">{alert.message}</p>
                    {!alert.is_read && (
                      <button 
                        onClick={() => markNotificationRead(alert.id)}
                        className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-black/40 border-border dark:border-white/5 border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" />
              Invoice Collision Forensic Log
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Detailed tracking of blocked duplicate invoice attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {collisions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No collisions detected.</p>
              ) : (
                collisions.map((c: any) => (
                  <div key={c.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[11px] font-black text-amber-500 uppercase tracking-tighter">Collision: {c.invoice_no}</p>
                        <p className="text-[9px] text-muted-foreground font-bold">{format(new Date(c.detected_at), "PPP p")}</p>
                      </div>
                      <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-500">Forensic Block</Badge>
                    </div>
                    <div className="mt-2 text-[9px] font-mono text-white/50 bg-black/40 p-2 rounded max-h-20 overflow-auto">
                      {JSON.stringify(c.attempted_order_payload, null, 2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Concurrency Stress Test */}
      <Card className="bg-black/40 border-white/5 border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Beaker className="h-4 w-4 text-primary" />
              Invoice Serial Stress Test
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Verify atomic sequence generation under simultaneous load. (Isolated test: Does not affect production serials. Max 10 concurrent requests.)
            </CardDescription>
          </div>
          <button
            onClick={runStressTest}
            disabled={isStressing}
            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 rounded-md text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]"
          >
            {isStressing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Radio className="h-3.5 w-3.5" />
            )}
            {isStressing ? "Running..." : "Launch Test"}
          </button>
        </CardHeader>
        <CardContent>
          {stressResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${stressResult.success ? "bg-green-500/20" : "bg-red-500/20"}`}
                >
                  {stressResult.success ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-tight text-white">
                    {stressResult.success ? "Test Passed" : "Test Failed"}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    {stressResult.total} simultaneous requests processed.{" "}
                    {stressResult.duplicates} duplicates found.
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Unique IDs
                    </p>
                    <p className="text-xl font-black text-white">{stressResult.unique}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Target
                    </p>
                    <p className="text-xl font-black text-white">{stressResult.total}</p>
                  </div>
                </div>
              </div>

              {stressResult.invoices.length > 0 && (
                <div className="rounded-md border border-white/5 bg-black/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Generated Sequence
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {stressResult.invoices.map((inv: string, i: number) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="font-mono text-[10px] bg-white/5 border-white/10 text-white/80"
                      >
                        {inv}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {stressResult.errors.length > 0 && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">
                    Errors Encountered
                  </p>
                  <ul className="list-disc list-inside text-xs text-red-400/80 font-medium">
                    {stressResult.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.02]">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Beaker className="h-8 w-8 text-white/20" />
              </div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">
                Ready to Stress Test
              </h4>
              <p className="text-[10px] text-muted-foreground max-w-xs mt-2 font-medium">
                Launches 10 parallel database requests to the atomic sequence generator to verify
                row-level locking and uniqueness.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load Testing Card */}
      <Card className="bg-black/40 border-white/5 border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Storefront Load Test
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Simulate peak traffic by triggering multiple parallel read requests
            </CardDescription>
          </div>
          <button
            onClick={executeLoadTest}
            disabled={isLoadTesting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            {isLoadTesting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Activity className="h-3.5 w-3.5" />
            )}
            {isLoadTesting ? "Testing..." : "Run Load Test"}
          </button>
        </CardHeader>
        <CardContent>
          {loadResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Requests
                  </p>
                  <p className="text-xl font-black text-white">{loadResult.requests}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Total Time
                  </p>
                  <p className="text-xl font-black text-white">{loadResult.durationMs}ms</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Avg/Req
                  </p>
                  <p className="text-xl font-black text-white">{Math.round(loadResult.avgRequestMs)}ms</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Status
                  </p>
                  <p className={`text-xl font-black ${loadResult.success ? "text-green-500" : "text-red-500"}`}>
                    {loadResult.success ? "PASS" : "FAIL"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Recent Events Table */}
      <Card className="bg-black/40 border-white/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Incidents
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Latest security events across the platform
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="border-white/10 text-white/60 text-[10px] uppercase tracking-widest font-bold"
          >
            Real-time Feed
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-[180px]">
                    Timestamp (BD)
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Event Type
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    IP Address
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Actor/Email
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">
                    Route
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground text-xs uppercase tracking-widest"
                    >
                      No recent security events
                    </TableCell>
                  </TableRow>
                ) : (
                  recentEvents.map((event) => (
                    <TableRow
                      key={event.id}
                      className="border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      <TableCell className="text-[11px] font-mono text-white/60">
                        {format(toBDTime(event.created_at || new Date()), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`uppercase text-[9px] tracking-widest px-2 py-0 ${
                            event.event_type === "rate_limit"
                              ? "border-amber-500/50 text-amber-500 bg-amber-500/5"
                              : "border-red-500/50 text-red-500 bg-red-500/5"
                          }`}
                        >
                          {event.event_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] font-mono group-hover:text-white transition-colors">
                        {event.ip_address}
                      </TableCell>
                      <TableCell className="text-[11px]">
                        {event.actor_email ? (
                          <div className="flex items-center gap-2 text-white/70">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {event.actor_email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground text-right max-w-[200px] truncate">
                        {event.route || "/api/rpc/*"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
