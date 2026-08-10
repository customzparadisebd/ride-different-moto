// ============================================================
// COURIER MANAGEMENT SCREEN
// Purpose: Add, edit, switch on/off, test and remove delivery
//          partners (SteadFast, Pathao, RedX or any custom API).
// Status: COMPLETED
// Security: The screen only renders for staff with couriers.view;
//           editing, testing and deleting need couriers.manage
//           (Super Admin). Credentials are write-only.
// Future: Automatic status sync via courier webhooks.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { adminHead } from "@/components/admin/AdminShell";
import { CourierForm } from "@/components/admin/couriers/CourierForm";
import { SafeImage } from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/lib/admin.shared";
import {
  deleteCourier,
  listCouriers,
  saveCourier,
  setCourierActive,
  testCourierConnection,
} from "@/lib/couriers.functions";
import {
  emptyCourier,
  type CourierInput,
  type CourierSummary,
} from "@/lib/couriers.shared";
import { formatBDT } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/czp-ops-9f2c/couriers")({
  head: () => adminHead("Couriers — CZP Ops"),
  component: CouriersPage,
});

function CouriersPage() {
  const { access } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const fetchCouriers = useServerFn(listCouriers);
  const save = useServerFn(saveCourier);
  const toggle = useServerFn(setCourierActive);
  const remove = useServerFn(deleteCourier);
  const test = useServerFn(testCourierConnection);

  const [editing, setEditing] = useState<{ draft: CourierInput; existing?: CourierSummary } | null>(
    null,
  );

  const canManage = access.permissions.includes(PERMISSIONS.couriersManage);
  const query = useQuery({ queryKey: ["admin-couriers"], queryFn: () => fetchCouriers({}) });
  const couriers = query.data?.couriers ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-couriers"] });

  const saveMutation = useMutation({
    mutationFn: save,
    onSuccess: () => {
      toast.success("Courier saved.");
      setEditing(null);
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the courier."),
  });

  const toggleMutation = useMutation({
    mutationFn: toggle,
    onSuccess: () => {
      toast.success("Courier updated.");
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message || "Could not update the courier."),
  });

  const removeMutation = useMutation({
    mutationFn: remove,
    onSuccess: () => {
      toast.success("Courier removed.");
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message || "Could not remove the courier."),
  });

  const testMutation = useMutation({
    mutationFn: test,
    onSuccess: (result) => {
      if (result.ok) toast.success(result.message);
      else toast.error(`${result.message} Needs: ${result.requires.join(", ")}.`);
    },
    onError: (error: Error) => toast.error(error.message || "Could not test the connection."),
  });

  const startEdit = (courier: CourierSummary) =>
    setEditing({
      existing: courier,
      draft: {
        id: courier.id,
        slug: courier.slug,
        name: courier.name,
        logoUrl: courier.logoUrl ?? "",
        phone: courier.phone ?? "",
        baseUrl: courier.baseUrl,
        insideCharge: courier.insideCharge,
        outsideCharge: courier.outsideCharge,
        codPercent: courier.codPercent,
        isActive: courier.isActive,
        sortOrder: courier.sortOrder,
        extraFields: courier.extraFields,
        credentials: {},
      },
    });

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Couriers</h1>
          <p className="text-xs text-muted-foreground">
            Delivery partners, charges and API connections. Keys are stored server-side only.
          </p>
        </div>
        {canManage && !editing && (
          <Button
            variant="red"
            size="touch"
            onClick={() => setEditing({ draft: emptyCourier(couriers.length) })}
          >
            Add courier
          </Button>
        )}
      </div>

      {editing && canManage && (
        <div className="mt-5">
          <CourierForm
            initial={editing.draft}
            existing={editing.existing}
            isPending={saveMutation.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(value) => saveMutation.mutate({ data: value as never })}
          />
        </div>
      )}

      {query.isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading couriers…</p>
      ) : couriers.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
          No courier configured yet.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {couriers.map((courier) => (
            <article
              key={courier.id}
              className="rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {courier.logoUrl ? (
                    <SafeImage
                      src={courier.logoUrl}
                      alt={`${courier.name} logo`}
                      className="h-10 w-10 rounded-lg object-contain"
                    />
                  ) : null}
                  <div>
                    <h2 className="font-display text-lg font-bold uppercase">{courier.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {courier.slug} · {courier.phone || "no phone"}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    courier.isActive
                      ? "bg-green-500/15 text-green-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {courier.isActive ? "On" : "Off"}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <Stat label="Inside Dhaka" value={formatBDT(courier.insideCharge)} />
                <Stat label="Outside Dhaka" value={formatBDT(courier.outsideCharge)} />
                <Stat label="COD" value={`${courier.codPercent}%`} />
              </dl>

              <p className="mt-3 text-xs text-muted-foreground">
                API: {courier.baseUrl || "not set"} ·{" "}
                {Object.values(courier.credentialsSet).some(Boolean)
                  ? "credentials saved"
                  : "no credentials"}
              </p>

              {canManage && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="steel" size="sm" onClick={() => startEdit(courier)}>
                    Edit
                  </Button>
                  <Button
                    variant="steel"
                    size="sm"
                    disabled={testMutation.isPending}
                    onClick={() => testMutation.mutate({ data: { courierId: courier.id } })}
                  >
                    Test connection
                  </Button>
                  <Button
                    variant="steel"
                    size="sm"
                    disabled={toggleMutation.isPending}
                    onClick={() =>
                      toggleMutation.mutate({
                        data: { courierId: courier.id, isActive: !courier.isActive },
                      })
                    }
                  >
                    {courier.isActive ? "Switch off" : "Switch on"}
                  </Button>
                  {access.isSuperAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={removeMutation.isPending}
                      onClick={() => {
                        if (!window.confirm(`Remove ${courier.name}?`)) return;
                        removeMutation.mutate({ data: { courierId: courier.id } });
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-2">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
