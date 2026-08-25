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
import { createFileRoute, useNavigate, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CitiesPanel } from "@/components/admin/checkout/CitiesPanel";
import { DeliveryZonesPanel } from "@/components/admin/checkout/DeliveryZonesPanel";
import { SteadfastSettingsPanel } from "@/components/admin/couriers/SteadfastSettingsPanel";
import { InvoiceSettingsPanel } from "@/components/admin/settings/InvoiceSettingsPanel";
import { SiteSettingsPanel } from "@/components/admin/settings/SiteSettingsPanel";
import { AISettingsPanel } from "@/components/admin/settings/AISettingsPanel";
import { SectionSettingsPanel } from "@/components/admin/settings/SectionSettingsPanel";
import { LogoSettingsPanel } from "@/components/admin/settings/LogoSettingsPanel";
import { ProductOrderPanel } from "@/components/admin/settings/ProductOrderPanel";
import { BikeModelsPanel } from "@/components/admin/settings/BikeModelsPanel";
import { GalleryPanel } from "@/components/admin/settings/GalleryPanel";
import { Button } from "@/components/ui/button";


import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyAccess } from "@/lib/orders.functions";
import { PAYMENT_METHODS } from "@/lib/orders.shared";
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "@/lib/settings.shared";
import { getStoreSettings, saveStoreSettings } from "@/lib/store-settings.functions";

export const Route = createFileRoute("/_authenticated/ad/settings")({
  validateSearch: (search: Record<string, unknown>): { tab?: string | undefined } => {
    const tab = search["tab"];
    return { tab: typeof tab === "string" ? tab : undefined };
  },
  head: () => ({
    meta: [
      { title: "Settings — CZP Ops" },
      { property: "og:title", content: "Settings — CZP Ops" },
      { name: "description", content: "Customz Paradise BD Admin Panel" },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const load = useServerFn(getStoreSettings);
  const save = useServerFn(saveStoreSettings);
  const access = useServerFn(getMyAccess);
  const navigate = useNavigate();
  const location = useLocation();

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({ data: undefined } as never) });

  // ACCESS CONTROL: Restrict Staff from settings
  useEffect(() => {
    if (accessQuery.data) {
      const { primaryRole } = accessQuery.data;
      if (primaryRole !== "super_admin" && primaryRole !== "admin") {
        toast.error("Access denied: Admin only.");
        void navigate({ to: "/ad", replace: true });
      }
    }
  }, [accessQuery.data, navigate]);

  const canManage = accessQuery.data?.permissions.includes("products.manage") ?? false;
  const canManageZones = accessQuery.data?.permissions.includes("zones.manage") ?? false;

  const settingsQuery = useQuery({ queryKey: ["store-settings"], queryFn: () => load({ data: undefined }) });
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
    <section className="mx-auto max-w-4xl px-4 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Sub-navigation Sidebar */}
        <aside className="w-full shrink-0 md:w-56">
          <nav className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
            <SettingsTabButton
              active={location.pathname === "/ad/settings" && (!search.tab || search.tab === "general")}
              onClick={() => navigate({ to: "/ad/settings", search: { tab: "general" } })}
              label="General"
            />
            <SettingsTabButton
              active={location.pathname === "/ad/settings" && search.tab === "invoice"}
              onClick={() => navigate({ to: "/ad/settings", search: { tab: "invoice" } })}
              label="Invoice"
            />
            <SettingsTabButton
              active={location.pathname === "/ad/settings" && search.tab === "logos"}
              onClick={() => navigate({ to: "/ad/settings", search: { tab: "logos" } })}
              label="Logos"
            />
            <SettingsTabButton

              active={location.pathname === "/ad/settings" && search.tab === "delivery"}
              onClick={() => navigate({ to: "/ad/settings", search: { tab: "delivery" } })}
              label="Delivery Zones"
            />
            <SettingsTabButton
              active={location.pathname === "/ad/settings" && search.tab === "couriers"}
              onClick={() => navigate({ to: "/ad/settings", search: { tab: "couriers" } })}
              label="SteadFast"
            />
            <SettingsTabButton
              active={location.pathname === "/ad/settings" && search.tab === "homepage"}
              onClick={() => navigate({ to: "/ad/settings", search: { tab: "homepage" } })}
              label="Homepage"
            />
            <SettingsTabButton
              active={location.pathname === "/ad/settings" && search.tab === "bike-models"}
              onClick={() => navigate({ to: "/ad/settings", search: { tab: "bike-models" } })}
              label="Bike Models"
            />
            <SettingsTabButton
              active={location.pathname === "/ad/settings" && search.tab === "product-order"}
              onClick={() => navigate({ to: "/ad/settings", search: { tab: "product-order" } })}
              label="Product Order"
            />
            <SettingsTabButton
              active={location.pathname === "/ad/settings" && search.tab === "gallery"}
              onClick={() => navigate({ to: "/ad/settings", search: { tab: "gallery" } })}
              label="Gallery"
            />
            <SettingsTabButton
              active={location.pathname === "/ad/settings" && search.tab === "ai"}
              onClick={() => navigate({ to: "/ad/settings", search: { tab: "ai" } })}
              label="AI Tools"
            />
          </nav>
        </aside>

        {/* Settings Content Area */}
        <div className="flex-1 space-y-8 animate-in fade-in duration-300">
          <Outlet />

          {location.pathname === "/ad/settings" && (
            <>
              {/* TAB: GENERAL */}
              {(!search.tab || search.tab === "general") && (
                <div className="space-y-8">
                  <div>
                    <h1 className="font-display text-3xl font-bold uppercase tracking-wide">General Settings</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      Store identity, contact information, and core operational thresholds.
                    </p>
                  </div>

                  <SiteSettingsPanel canManage={canManage} />

                  {settingsQuery.isLoading ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Loading settings…</p>
                  ) : (
                    <form
                      className="space-y-6"
                      onSubmit={(event) => {
                        event.preventDefault();
                        mutation.mutate({ data: draft as never });
                      }}
                    >
                      <fieldset
                        disabled={!canManage || mutation.isPending}
                        className="space-y-6 disabled:opacity-70"
                      >
                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                            Payment Methods
                          </h2>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {PAYMENT_METHODS.map((method) => (
                              <label
                                key={method.value}
                                className="flex min-h-12 items-center gap-3 rounded-lg border border-border bg-background/50 px-4 text-sm transition-colors hover:bg-accent/50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded accent-primary"
                                  checked={draft.paymentMethods.includes(method.value)}
                                  onChange={() => togglePayment(method.value)}
                                />
                                <span className="font-medium">{method.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                            Support & Inventory
                          </h2>
                          <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Support Phone
                              </Label>
                              <Input
                                className="h-11"
                                value={draft.supportPhone}
                                onChange={(event) =>
                                  setDraft((current) => ({ ...current, supportPhone: event.target.value }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Support Email
                              </Label>
                              <Input
                                className="h-11"
                                type="email"
                                value={draft.supportEmail ?? ""}
                                onChange={(event) =>
                                  setDraft((current) => ({ ...current, supportEmail: event.target.value }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Low-Stock Alert
                              </Label>
                              <Input
                                className="h-11"
                                type="number"
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

                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                            WhatsApp Integration
                          </h2>
                          <p className="mt-1 text-[11px] text-muted-foreground font-medium">
                            Configure how WhatsApp support appears at checkout and on pages.
                          </p>
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Checkout Number
                              </Label>
                              <Input
                                className="h-11"
                                value={draft.whatsappPhone}
                                onChange={(event) =>
                                  setDraft((current) => ({ ...current, whatsappPhone: event.target.value }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Default Message
                              </Label>
                              <Input
                                className="h-11"
                                value={draft.whatsappMessage}
                                onChange={(event) =>
                                  setDraft((current) => ({ ...current, whatsappMessage: event.target.value }))
                                }
                              />
                            </div>
                          </div>

                          <div className="mt-6 pt-6 border-t border-border/50 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded accent-primary"
                                checked={draft.whatsappFloatingEnabled}
                                onChange={(e) =>
                                  setDraft((c) => ({ ...c, whatsappFloatingEnabled: e.target.checked }))
                                }
                              />
                              <span className="text-sm font-bold uppercase tracking-tight">Show Floating Button</span>
                            </label>

                            <div className="flex items-center gap-3">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Position
                              </Label>
                              <select
                                className="h-10 rounded-lg border border-input bg-background px-3 text-xs font-bold uppercase tracking-tighter focus:ring-1 focus:ring-primary outline-none"
                                value={draft.whatsappFloatingPosition}
                                onChange={(e) =>
                                  setDraft((c) => ({ ...c, whatsappFloatingPosition: e.target.value as any }))
                                }
                              >
                                <option value="bottom-right">Bottom Right</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="top-right">Top Right</option>
                                <option value="top-left">Top Left</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Button type="submit" variant="red" size="touch" disabled={mutation.isPending}>
                            {mutation.isPending ? "Saving…" : "Save all changes"}
                          </Button>
                          {!canManage && (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              Read-only Access
                            </p>
                          )}
                        </div>
                      </fieldset>
                    </form>
                  )}
                </div>
              )}

              {/* TAB: DELIVERY ZONES */}
              {search.tab === "delivery" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Delivery Zones</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manage regions, cities, and associated shipping costs for the checkout flow.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <DeliveryZonesPanel canManage={canManageZones} />
                    <CitiesPanel canManage={canManageZones} />
                    {!canManageZones && (
                      <p className="text-xs text-muted-foreground italic">
                        Only accounts with "Manage delivery zones" permission can modify these values.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: STEADFAST */}
              {search.tab === "couriers" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="font-display text-3xl font-bold uppercase tracking-wide">SteadFast API</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure automated booking and order tracking via SteadFast courier service.
                    </p>
                  </div>
                  <SteadfastSettingsPanel />
                </div>
              )}

              {/* TAB: HOMEPAGE */}
              {search.tab === "homepage" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Homepage Sections</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      Control visibility and product limits for all dynamic storefront sections.
                    </p>
                  </div>
                  <SectionSettingsPanel canManage={canManage} />
                </div>
              )}

              {/* TAB: GALLERY */}
              {search.tab === "gallery" && (
                <GalleryPanel />
              )}

              {/* TAB: AI TOOLS */}
              {search.tab === "ai" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="font-display text-3xl font-bold uppercase tracking-wide">AI Engine</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      Managed AI tools for order extraction and automated processing.
                    </p>
                  </div>
                  <AISettingsPanel canManage={accessQuery.data?.permissions.includes("api.manage") ?? false} />
                </div>
              )}
              {/* TAB: PRODUCT ORDER */}
              {search.tab === "product-order" && (
                <ProductOrderPanel />
              )}

              {/* TAB: BIKE MODELS */}
              {search.tab === "bike-models" && (
                <BikeModelsPanel />
              )}

              {/* TAB: LOGOS */}
              {search.tab === "logos" && (
                <LogoSettingsPanel canManage={canManage} />
              )}
              {/* TAB: INVOICE */}
              {search.tab === "invoice" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Invoice Settings</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure sequential numbering, company info, and printable layout rules.
                    </p>
                  </div>
                  <InvoiceSettingsPanel canManage={canManage} />
                </div>
              )}
            </>

          )}
        </div>
      </div>
    </section>
  );
}

function SettingsTabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        whitespace-nowrap rounded-lg px-4 py-3 text-left text-xs font-bold uppercase tracking-widest transition-all
        ${
          active
            ? "bg-brand-red text-white shadow-lg shadow-brand-red/20 translate-x-1"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }
      `}
    >
      {label}
    </button>
  );
}
