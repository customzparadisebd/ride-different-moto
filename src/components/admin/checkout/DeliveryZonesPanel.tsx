// ============================================================
// CITY & DELIVERY ZONES — COMPLETED (admin UI)
// Purpose: Edit each delivery zone's name, charge and active state.
//          Checkout totals follow these values — nothing hardcoded.
// Security: Saving requires the zones.manage permission.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listCheckoutConfig, saveDeliveryZone } from "@/lib/checkout-config.functions";
import type { DeliveryZoneOption } from "@/lib/checkout-config.shared";

export function DeliveryZonesPanel({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const load = useServerFn(listCheckoutConfig);
  const save = useServerFn(saveDeliveryZone);

  const configQuery = useQuery({ queryKey: ["checkout-admin-config"], queryFn: () => load() });
  const zones = configQuery.data?.zones ?? [];

  const mutation = useMutation({
    mutationFn: save,
    onSuccess: () => {
      toast.success("Delivery zone saved");
      void queryClient.invalidateQueries({ queryKey: ["checkout-admin-config"] });
      void queryClient.invalidateQueries({ queryKey: ["checkout-config"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the zone."),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h2 className="font-display text-sm font-bold uppercase">Delivery zones & charges</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        The checkout total updates automatically from these charges.
      </p>

      {configQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading zones…</p>
      ) : (
        <div className="mt-3 space-y-3">
          {zones.map((zone) => (
            <ZoneRow
              key={zone.id}
              zone={zone}
              canManage={canManage}
              saving={mutation.isPending}
              onSave={(values) => mutation.mutate({ data: values })}
            />
          ))}
          {!zones.length ? (
            <p className="text-xs text-muted-foreground">No delivery zones configured yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ZoneRow({
  zone,
  canManage,
  saving,
  onSave,
}: {
  zone: DeliveryZoneOption;
  canManage: boolean;
  saving: boolean;
  onSave: (values: {
    id: string;
    name: string;
    charge: number;
    isActive: boolean;
    sortOrder: number;
  }) => void;
}) {
  const [name, setName] = useState(zone.name);
  const [charge, setCharge] = useState(String(zone.charge));
  const [isActive, setIsActive] = useState(zone.isActive);

  return (
    <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[minmax(0,1fr)_120px_auto_auto] sm:items-end">
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Zone name</Label>
        <Input
          className="mt-1.5 h-11"
          value={name}
          disabled={!canManage}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Charge (৳)</Label>
        <Input
          className="mt-1.5 h-11"
          inputMode="numeric"
          value={charge}
          disabled={!canManage}
          onChange={(event) => setCharge(event.target.value)}
        />
      </div>
      <label className="flex min-h-11 items-center gap-2 text-xs">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={isActive}
          disabled={!canManage}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        Active
      </label>
      <Button
        type="button"
        variant="steel"
        size="touch"
        disabled={!canManage || saving}
        onClick={() =>
          onSave({
            id: zone.id,
            name: name.trim() || zone.name,
            charge: Number(charge) || 0,
            isActive,
            sortOrder: zone.sortOrder,
          })
        }
      >
        Save
      </Button>
    </div>
  );
}
