import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, X, Shield, Clock, Monitor, Globe, Smartphone, User } from "lucide-react";
import { toast } from "sonner";

import { listPendingApprovals, handleApprovalAction } from "@/lib/login-approvals.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/ad/login-requests")({
  component: LoginRequestsPage,
});

function LoginRequestsPage() {
  const queryClient = useQueryClient();
  
  const { data: requests, isLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: () => listPendingApprovals({}),
    refetchInterval: 5000, // Refresh every 5s for notifications
  });

  const mutation = useMutation({
    mutationFn: (args: { requestId: string; action: "approve" | "reject" }) => 
      handleApprovalAction({ data: args }),
    onSuccess: (_, variables) => {
      toast.success(`Request ${variables.action}ed successfully`);
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Action failed");
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tighter">
            Staff Login Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve pending login attempts from staff members.
          </p>
        </div>
        <Badge variant="outline" className="h-8 px-3 font-mono">
          {requests?.length || 0} Pending
        </Badge>
      </div>

      <div className="grid gap-6">
        {requests?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-widest">No Pending Requests</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                All staff login attempts have been processed or none are currently active.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests?.map((req: any) => (
              <Card key={req.id} className="overflow-hidden border-white/5 bg-white/5 transition-all hover:border-white/10">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold uppercase tracking-tight">
                          {req.full_name || "Unknown Staff"}
                        </CardTitle>
                        <CardDescription className="text-xs truncate max-w-[150px]">
                          {req.email}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-none uppercase text-[10px]">
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium uppercase tracking-widest">
                    <div className="space-y-1">
                      <span className="text-muted-foreground/60 block">Request ID</span>
                      <span className="font-mono text-[10px]">{req.id.slice(0, 8)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground/60 block">Time</span>
                      <span className="text-white flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(req.created_at), "hh:mm a")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground/80">
                      <Monitor className="h-3 w-3" />
                      <span>{req.user_agent?.includes("Mobi") ? "Mobile" : "Desktop"} • {req.ip_address}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 truncate italic">
                      {req.user_agent}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="red"
                      className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest"
                      onClick={() => mutation.mutate({ requestId: req.id, action: "approve" })}
                      disabled={mutation.isPending}
                    >
                      <Check className="h-3 w-3 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500"
                      onClick={() => mutation.mutate({ requestId: req.id, action: "reject" })}
                      disabled={mutation.isPending}
                    >
                      <X className="h-3 w-3 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {requests && requests.length > 0 && (
         <div className="rounded-lg border border-white/5 bg-black/40 p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
              <Shield className="h-3 w-3" />
              Security Note
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Staff login approvals expire automatically after 10 minutes. 
              Always verify the IP address and device information before approving a request.
            </p>
         </div>
      )}
    </div>
  );
}
