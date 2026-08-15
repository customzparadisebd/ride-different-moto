// ============================================================
// STEADFAST API SETTINGS PANEL
// Purpose: Admin → Settings section where an Admin/Super Admin
//          enters, updates and activates the SteadFast API details.
// Status: COMPLETED
// Security: The panel only ever SENDS the API key/secret; the server
//          returns "stored / not stored" flags, never the values.
//          Staff and Managers do not see this section and the server
//          rejects them even if they call the endpoint directly.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { Activity, AlertCircle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSteadfastLogs,
  getSteadfastSettings,
  saveSteadfastSettings,
  testSteadfastConnection,
} from "@/lib/steadfast.functions";
import { CLEAR_SECRET, STEADFAST_DEFAULT_BASE_URL } from "@/lib/steadfast.shared";

export function SteadfastSettingsPanel() {
  const queryClient = useQueryClient();
  const load = useServerFn(getSteadfastSettings);
  const save = useServerFn(saveSteadfastSettings);
  const testConn = useServerFn(testSteadfastConnection);
  const loadLogs = useServerFn(getSteadfastLogs);

  const settings = useQuery({
    queryKey: ["steadfast-settings"],
    queryFn: () => load(),
    retry: false,
  });

  const logsQuery = useQuery({
    queryKey: ["steadfast-logs"],
    queryFn: () => loadLogs(),
    enabled: !!settings.data?.configured,
  });

  const [baseUrl, setBaseUrl] = useState(STEADFAST_DEFAULT_BASE_URL);
  const [isActive, setIsActive] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  useEffect(() => {
    if (!settings.data) return;
    setBaseUrl(settings.data.baseUrl || STEADFAST_DEFAULT_BASE_URL);
    setIsActive(settings.data.isActive);
  }, [settings.data]);

  const mutation = useMutation({
    mutationFn: save,
    onSuccess: () => {
      toast.success("SteadFast settings saved");
      setApiKey("");
      setApiSecret("");
      void queryClient.invalidateQueries({ queryKey: ["steadfast-settings"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the settings."),
  });

  const testMutation = useMutation({
    mutationFn: () => testConn({}),
    onSuccess: (res: any) => {
      if (res?.ok) {
        toast.success(res.message);
        void queryClient.invalidateQueries({ queryKey: ["steadfast-logs"] });
      } else {
        toast.error(res?.message || "Connection failed");
      }
    },
    onError: (error: Error) => toast.error(error.message || "Connection test failed."),
  });

  // Staff / Manager accounts get a 403 from the server function — hide the section.
  if (settings.isError) return null;

  const stored = settings.data;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-bold uppercase">SteadFast API integration</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Used by the “Send to SteadFast” bulk action on Orders. Keys are stored server-side and
            never shown again.
          </p>
        </div>
        <span
          className={`rounded-md px-2 py-1 text-xs font-semibold uppercase ${
            stored?.configured ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {stored?.configured ? "Active" : "Not ready"}
        </span>
      </div>

      {settings.isLoading ? (
        <p className="py-6 text-sm text-muted-foreground">Loading integration…</p>
      ) : (
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({
              data: {
                baseUrl,
                isActive,
                // Blank = keep what is stored.
                ...(apiKey ? { apiKey } : {}),
                ...(apiSecret ? { apiSecret } : {}),
              } as never,
            });
          }}
        >
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              API base URL
            </Label>
            {/* TODO: confirm the correct SteadFast host for your merchant account. */}
            <Input
              className="mt-1.5 h-11"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder={STEADFAST_DEFAULT_BASE_URL}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                API key {stored?.hasApiKey ? "(stored)" : "(required)"}
              </Label>
              <PasswordInput
                className="mt-1.5 h-11"
                autoComplete="off"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={stored?.hasApiKey ? "•••••••• — leave blank to keep" : "Api-Key"}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                API secret {stored?.hasApiSecret ? "(stored)" : "(required)"}
              </Label>
              <PasswordInput
                className="mt-1.5 h-11"
                autoComplete="off"
                value={apiSecret}
                onChange={(event) => setApiSecret(event.target.value)}
                placeholder={stored?.hasApiSecret ? "•••••••• — leave blank to keep" : "Secret-Key"}
              />
            </div>
          </div>

          <label className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[hsl(var(--primary))]"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Integration active (orders can be sent to SteadFast)
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="red" size="touch" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save SteadFast settings"}
            </Button>
            {stored?.configured ? (
              <Button
                type="button"
                variant="steel"
                size="touch"
                disabled={testMutation.isPending}
                onClick={() => testMutation.mutate()}
              >
                {testMutation.isPending ? (
                  "Testing…"
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            ) : null}
            {stored?.hasApiKey || stored?.hasApiSecret ? (
              <Button
                type="button"
                variant="steel"
                size="touch"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    data: {
                      baseUrl,
                      isActive: false,
                      apiKey: CLEAR_SECRET,
                      apiSecret: CLEAR_SECRET,
                    } as never,
                  })
                }
              >
                Remove keys & deactivate
              </Button>
            ) : null}
          </div>
        </form>
      )}

      {/* API ERROR LOGS */}
      {stored?.configured && (
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                Recent API Activity
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["steadfast-logs"] })}
              disabled={logsQuery.isFetching}
            >
              Refresh Logs
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted/30">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logsQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      Loading logs…
                    </td>
                  </tr>
                ) : logsQuery.data?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No recent activity.
                    </td>
                  </tr>
                ) : (
                  logsQuery.data?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, HH:mm")}
                      </td>
                      <td className="px-3 py-2 font-medium">{log.action.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2">
                        {log.success ? (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="h-3 w-3" />
                            Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-500">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px]">{log.status_code || "-"}</td>
                      <td
                        className="max-w-[200px] truncate px-3 py-2 text-muted-foreground"
                        title={log.message || ""}
                      >
                        {log.message || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
