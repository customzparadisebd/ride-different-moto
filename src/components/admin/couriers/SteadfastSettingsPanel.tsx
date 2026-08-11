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
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSteadfastSettings, saveSteadfastSettings } from "@/lib/steadfast.functions";
import { CLEAR_SECRET, STEADFAST_DEFAULT_BASE_URL } from "@/lib/steadfast.shared";

export function SteadfastSettingsPanel() {
  const queryClient = useQueryClient();
  const load = useServerFn(getSteadfastSettings);
  const save = useServerFn(saveSteadfastSettings);

  const settings = useQuery({
    queryKey: ["steadfast-settings"],
    queryFn: () => load(),
    retry: false,
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
            stored?.configured
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
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
    </div>
  );
}