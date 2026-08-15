import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, Globe, User, AlertTriangle, Radio, Lock, Activity, RefreshCw } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

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

  const { data: stats, refetch: refetchStats } = useSuspenseQuery({
    queryKey: ["security-stats"],
    queryFn: () => getSecurityStats({}),
  });

  const { data: suspiciousIPs, refetch: refetchSuspicious } = useSuspenseQuery({
    queryKey: ["suspicious-ips"],
    queryFn: () => getSuspiciousIPs({}),
  });

  const { data: recentEvents, refetch: refetchEvents } = useSuspenseQuery({
    queryKey: ["recent-security-events"],
    queryFn: () => listSecurityEvents({ data: { limit: 10 } }),
  });

  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchStats(), refetchSuspicious(), refetchEvents()]);
    setIsRefreshing(false);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Security Monitoring
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] tracking-widest uppercase flex items-center gap-1.5 animate-pulse"
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
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/5 hover:border-red-500/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Auth Failures
                </p>
                <h3 className="text-2xl font-black text-white group-hover:text-red-500 transition-colors">
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

        <Card className="bg-black/40 border-white/5 hover:border-amber-500/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Rate Limits
                </p>
                <h3 className="text-2xl font-black text-white group-hover:text-amber-500 transition-colors">
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

        <Card className="bg-black/40 border-white/5 hover:border-blue-500/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Suspicious IPs
                </p>
                <h3 className="text-2xl font-black text-white group-hover:text-blue-500 transition-colors">
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

        <Card className="bg-black/40 border-white/5 hover:border-green-500/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Total Events
                </p>
                <h3 className="text-2xl font-black text-white group-hover:text-green-500 transition-colors">
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
        <Card className="lg:col-span-2 bg-black/40 border-white/5">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#ffffff40"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#ffffff40", fontWeight: "bold" }}
                  />
                  <YAxis
                    stroke="#ffffff40"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#ffffff40", fontWeight: "bold" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#121212",
                      border: "1px solid rgba(255,255,255,0.1)",
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
        <Card className="bg-black/40 border-white/5">
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
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-mono font-bold text-white/90">{ip.ip}</p>
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
