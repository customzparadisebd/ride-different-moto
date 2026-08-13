// ============================================================
// ADMIN AUDIT LOG VIEWER
// Purpose: Read-only history of sensitive admin activity: logins,
//          failed logins, order changes, staff/role/permission
//          changes, MFA and session events.
// Status: COMPLETED
// Security: Requires the audit.view permission (Super Admin by
//          default). The table is append-only — no client role can
//          insert, edit or delete entries.
// Future: Product create/edit/delete and API-configuration events
//          will append to this same log when those modules land.
// ============================================================
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { listAuditLog } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/ad/audit-log")({
  head: () => ({ meta: [{ title: "Audit log — CZP Ops" }] }),
  component: AuditLogPage,
});

function AuditLogPage() {
  const [search, setSearch] = useState("");
  const logs = useQuery({
    queryKey: ["audit-log", search],
    queryFn: () => listAuditLog({ data: { search: search || undefined, limit: 150 } }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Append-only record of admin activity. Cannot be edited or deleted.
        </p>
      </div>

      <Input
        placeholder="Search action, email or target…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11 max-w-sm"
      />

      <div className="space-y-2">
        {(logs.data ?? []).map((row) => (
          <div key={row.id} className="rounded-lg border border-border bg-card p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                {row.action}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.actor_email ?? "unknown user"}
              {row.actor_role ? ` (${row.actor_role})` : ""} ·{" "}
              {row.target_label ?? row.target_id ?? "—"}
              {row.target_type ? ` · ${row.target_type}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              IP {row.ip_address ?? "n/a"} ·{" "}
              {row.user_agent ? row.user_agent.slice(0, 80) : "device n/a"}
            </p>
            {row.old_value || row.new_value ? (
              <pre className="mt-2 overflow-x-auto rounded bg-secondary p-2 text-[11px] leading-snug">
                {JSON.stringify({ before: row.old_value, after: row.new_value }, null, 1)}
              </pre>
            ) : null}
          </div>
        ))}
        {logs.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {!logs.isLoading && !logs.data?.length ? (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        ) : null}
      </div>
    </div>
  );
}
