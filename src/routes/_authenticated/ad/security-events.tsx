import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Search, Filter, Clock, Globe, User, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSecurityEvents } from "@/lib/security-events.functions";

const TZ = "Asia/Dhaka";

export const Route = createFileRoute("/_authenticated/ad/security-events")({
  component: SecurityEventsPage,
});

function SecurityEventsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "rate_limit" | "login_throttle">("all");

  const { data: events } = useSuspenseQuery({
    queryKey: ["security-events", { search, type }],
    queryFn: () => listSecurityEvents({ data: { search, type, limit: 100 } }),
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Security Events
        </h1>
        <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">
          Monitor rate limiting and login throttling activity
        </p>
      </div>

      <Card className="border-white/5 bg-white/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search IP, Email or Route..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-black/40 border-white/10"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="w-[180px] bg-black/40 border-white/10">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10">
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="rate_limit">Rate Limiting</SelectItem>
                  <SelectItem value="login_throttle">Login Throttling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground w-[200px]">Timestamp (BD)</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Event Type</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">IP Address</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Actor/Context</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground uppercase tracking-widest text-xs">
                      No security events found
                    </TableCell>
                  </TableRow>
                ) : (
                  events?.map((event) => (
                    <TableRow key={event.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-xs font-mono text-white/70">
                        {format(toZonedTime(new Date(event.created_at), TZ), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`uppercase text-[10px] tracking-widest ${
                            event.event_type === "rate_limit" 
                              ? "border-amber-500/50 text-amber-500 bg-amber-500/5" 
                              : "border-red-500/50 text-red-500 bg-red-500/5"
                          }`}
                        >
                          {event.event_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono flex items-center gap-2">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        {event.ip_address}
                      </TableCell>
                      <TableCell className="text-xs">
                        {event.actor_email ? (
                          <div className="flex items-center gap-2 text-white/80">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {event.actor_email}
                          </div>
                        ) : (
                          <div className="text-muted-foreground/60 italic">N/A</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {JSON.stringify(event.metadata)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Rate Limit Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/60">
              IPs are automatically throttled when exceeding 100 requests/minute. 
              Security events are recorded when traffic reaches 10x this threshold.
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Brute Force Protection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/60">
              Accounts are locked after 3 failed attempts. Lockouts extend progressively from 5 to 60 minutes.
              All triggered lockouts are logged as security events.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
