import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import {
  MessageSquare,
  Calendar,
  Phone,
  Mail,
  User,
  Download,
  MoreVertical,
  CheckCircle2,
  Clock,
  PhoneCall,
  StickyNote,
  Save,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getLeads, updateLeadStatus } from "@/lib/leads.functions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/ad/leads")({
  component: LeadsPage,
});

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "New", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Clock },
  contacted: {
    label: "Contacted",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: PhoneCall,
  },
  closed: {
    label: "Closed",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: CheckCircle2,
  },
};

function LeadsPage() {
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(getLeads);
  const updateStatusFn = useServerFn(updateLeadStatus);

  const [editingLead, setEditingLead] = useState<any>(null);
  const [notes, setNotes] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: () => fetchLeads({}),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; status: any; internalNotes?: string }) =>
      updateStatusFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
      toast.success("Lead updated successfully");
      setEditingLead(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update lead");
    },
  });

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = [
      "Date",
      "Name",
      "Phone",
      "Email",
      "Source",
      "Status",
      "Message",
      "Internal Notes",
    ];
    const rows = leads.map((l: any) => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm"),
      l.name,
      l.phone,
      l.email || "",
      l.source,
      l.status,
      (l.message || "").replace(/"/g, '""'),
      (l.internal_notes || "").replace(/"/g, '""'),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
            Customer Leads
          </h1>
          <p className="text-muted-foreground">
            Manage messages and workflow for customer inquiries.
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="w-full sm:w-auto"
          disabled={leads.length === 0}
        >
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/50" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed py-20 text-center">
          <MessageSquare className="mb-4 size-12 text-muted-foreground/40" />
          <h3 className="text-lg font-bold">No leads yet</h3>
          <p className="text-muted-foreground">New contact form submissions will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead: any) => {
            const status = STATUS_CONFIG[lead.status] || STATUS_CONFIG["new"];
            const StatusIcon = status?.icon || Clock;

            return (
              <Card
                key={lead.id}
                className="group relative overflow-hidden border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className={`capitalize ${status?.color || ""}`}>
                      <StatusIcon className="mr-1 size-3" />
                      {status?.label || lead.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {format(new Date(lead.created_at), "MMM d")}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingLead(lead);
                              setNotes(lead.internal_notes || "");
                            }}
                          >
                            <StickyNote className="mr-2 size-4" />
                            Internal Notes
                          </DropdownMenuItem>
                          <div className="my-1 h-px bg-muted" />
                          <DropdownMenuItem
                            onClick={() => updateMutation.mutate({ id: lead.id, status: "new" })}
                          >
                            Mark as New
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateMutation.mutate({ id: lead.id, status: "contacted" })
                            }
                          >
                            Mark as Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateMutation.mutate({ id: lead.id, status: "closed" })}
                          >
                            Mark as Closed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardTitle className="mt-2 flex items-center gap-2 text-base">
                    <User className="size-4 text-muted-foreground" />
                    {lead.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 text-muted-foreground" />
                      <a
                        href={`tel:${lead.phone}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {lead.phone}
                      </a>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-muted-foreground" />
                        <a
                          href={`mailto:${lead.email}`}
                          className="truncate text-muted-foreground hover:text-primary transition-colors"
                        >
                          {lead.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {lead.message && (
                    <div className="rounded-xl bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
                      <p className="line-clamp-3 italic">"{lead.message}"</p>
                    </div>
                  )}

                  {lead.internal_notes && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                        <StickyNote className="size-3" />
                        Internal Note
                      </div>
                      <p className="text-xs text-foreground/80 line-clamp-2">
                        {lead.internal_notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                    <span>Source: {lead.source.replace("_", " ")}</span>
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 text-[9px] uppercase font-bold tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity"
                    >
                      ID: {lead.id.slice(0, 8)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Internal Notes for {editingLead?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Add internal followup notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] resize-none focus-visible:ring-primary"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLead(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateMutation.mutate({
                  id: editingLead.id,
                  status: editingLead.status,
                  internalNotes: notes,
                })
              }
              disabled={updateMutation.isPending}
            >
              <Save className="mr-2 size-4" />
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
