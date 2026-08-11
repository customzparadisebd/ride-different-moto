// ============================================================
// STORE SETTINGS
// Purpose: Operations settings that used to be hard-coded —
//          delivery charges per zone, enabled payment methods,
//          support contact and low-stock threshold.
// Status: COMPLETED
// Security: Saving requires the products.manage permission; the
//          server function validates and audits the change.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { adminHead } from "@/components/admin/AdminShell";
import { CitiesPanel } from "@/components/admin/checkout/CitiesPanel";
import { DeliveryZonesPanel } from "@/components/admin/checkout/DeliveryZonesPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyAccess } from "@/lib/orders.functions";
import { PAYMENT_METHODS } from "@/lib/orders.shared";
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "@/lib/settings.shared";
import { getStoreSettings, saveStoreSettings } from "@/lib/store-settings.functions";

export const Route = createFileRoute("/_authenticated/ad/settings")({
  head: () => adminHead("Settings — CZP Ops"),
  component: AdminSettings,
});

function AdminSettings() {
  const queryClient = useQueryClient();
  const load = useServerFn(getStoreSettings);
  const save = useServerFn(saveStoreSettings);
  const access = useServerFn(getMyAccess);

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({}) });
  const canManage = accessQuery.data?.permissions.includes("products.manage") ?? false;
  const canManageZones = accessQuery.data?.permissions.includes("zones.manage") ?? false;

  const settingsQuery = useQuery({ queryKey: ["store-settings"], queryFn: () => load() });
  const [draft, setDraft] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    if (settingsQuery.data) setDraft(settingsQuery.data);
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: save,
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the settings."),
  });

  const togglePayment = (value: StoreSettings["paymentMethods"][number]) =>
    setDraft((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.includes(value)
        ? current.paymentMethods.filter((method) => method !== value)
        : [...current.paymentMethods, value],
    }));

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Settings</h1>
      <p className="text-xs text-muted-foreground">
        Delivery charges, payment methods and support contact used across the store.
      </p>

      {settingsQuery.isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading settings…</p>
      ) : (
        <form
          className="mt-6 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({ data: draft as never });
          }}
        >
          <fieldset
            disabled={!canManage || mutation.isPending}
            className="space-y-6 disabled:opacity-70"
          >
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <h2 className="font-display text-sm font-bold uppercase">Payment methods</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.value}
                    className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                      checked={draft.paymentMethods.includes(method.value)}
                      onChange={() => togglePayment(method.value)}
                    />
                    {method.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <h2 className="font-display text-sm font-bold uppercase">Support & stock</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Support phone
                  </Label>
                  <Input
                    className="mt-1.5 h-11"
                    value={draft.supportPhone}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, supportPhone: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Support email
                  </Label>
                  <Input
                    className="mt-1.5 h-11"
                    value={draft.supportEmail ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, supportEmail: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Low-stock alert at
                  </Label>
                  <Input
                    className="mt-1.5 h-11"
                    inputMode="numeric"
                    value={String(draft.lowStockThreshold)}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        lowStockThreshold: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* WHATSAPP SUPPORT — COMPLETED */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <h2 className="font-display text-sm font-bold uppercase">WhatsApp support</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Shown under the Place Order button at checkout.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    WhatsApp number
                  </Label>
                  <Input
                    className="mt-1.5 h-11"
                    value={draft.whatsappPhone}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, whatsappPhone: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Support message
                  </Label>
                  <Input
                    className="mt-1.5 h-11"
                    value={draft.whatsappMessage}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, whatsappMessage: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* ---- Couriers moved to their own screen ---- */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <h2 className="font-display text-sm font-bold uppercase">Couriers</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Delivery partners, per-zone charges, COD % and API keys are managed on the Couriers
                screen. Keys stay server-side and are never shown here.
              </p>
            </div>

            <Button type="submit" variant="red" size="touch" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save settings"}
            </Button>
          </fieldset>

          {!canManage ? (
            <p className="text-xs text-muted-foreground">
              You can view these settings but only accounts with the “Manage products & settings”
              permission can change them.
            </p>
          ) : null}
        </form>
      )}

      {/* CITY & DELIVERY ZONES — COMPLETED */}
      <div className="mt-6 space-y-6">
        <DeliveryZonesPanel canManage={canManageZones} />
        <CitiesPanel canManage={canManageZones} />
        {!canManageZones ? (
          <p className="text-xs text-muted-foreground">
            Only accounts with the “Manage delivery zones” permission can change cities and zones.
          </p>
        ) : null}
      </div>
    </section>
  );
}
