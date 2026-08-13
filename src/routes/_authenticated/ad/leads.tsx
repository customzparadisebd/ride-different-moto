import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { MessageSquare, Calendar, Phone, Mail, User } from "lucide-react";

import { getLeads } from "@/lib/leads.functions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/ad/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  const fetchLeads = useServerFn(getLeads);
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: () => fetchLeads({}),
  });

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Customer Leads</h1>
        <p className="text-muted-foreground">Manage messages and inquiries from the contact form.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
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
          {leads.map((lead: any) => (
            <Card key={lead.id} className="overflow-hidden border-border bg-card shadow-sm transition-colors hover:border-primary/40">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="bg-primary/5 text-primary">
                    {lead.source.replace("_", " ")}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 size-3" />
                    {format(new Date(lead.created_at), "MMM d, yyyy")}
                  </div>
                </div>
                <CardTitle className="mt-2 flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  {lead.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-muted-foreground" />
                    <a href={`tel:${lead.phone}`} className="hover:text-primary">{lead.phone}</a>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <a href={`mailto:${lead.email}`} className="hover:text-primary">{lead.email}</a>
                    </div>
                  )}
                </div>
                
                {lead.message && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm italic">
                    "{lead.message}"
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
