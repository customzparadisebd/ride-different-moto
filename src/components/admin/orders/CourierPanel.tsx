// ============================================================
// COURIER PANEL (order detail)
// Purpose: Book this order with any active courier, show the
//          consignment / tracking information and refresh the
//          delivery status.
// Status: COMPLETED
// Security: Booking requires shipments.create and refreshing
//          requires couriers.view; both re-checked server-side.
//          API credentials never reach the browser.
// ============================================================
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { bookShipment, listCouriers, refreshShipmentStatus } from "@/lib/couriers.functions";
import { codFee, courierChargeForZone } from "@/lib/couriers.shared";
import { formatBDT } from "@/lib/format";

export function CourierPanel({
  order,
  canManage,
  onChanged,
}: {
  order: {
    id: string;
    courier_name: string | null;
    courier_tracking_id: string | null;
    courier_status: string;
    consignment_id?: string | null;
    tracking_url?: string | null;
    delivery_zone?: string | null;
    total: number | string;
    advance_paid?: number | string | null;
    status: string;
  };
  canManage: boolean;
  onChanged: () => void;
}) {
  const couriersFn = useServerFn(listCouriers);
  const book = useServerFn(bookShipment);
  const refresh = useServerFn(refreshShipmentStatus);
  const [courierId, setCourierId] = useState("");
  const [note, setNote] = useState("");

  const couriers = useQuery({ queryKey: ["admin-couriers"], queryFn: () => couriersFn({}) });
  const active = (couriers.data?.couriers ?? []).filter((courier) => courier.isActive);
  const selected = active.find((courier) => courier.id === (courierId || active[0]?.id));

  const codAmount = Math.max(Number(order.total) - Number(order.advance_paid ?? 0), 0);

  const bookMutation = useMutation({
    mutationFn: book,
    onSuccess: (result) => {
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message || "Could not reach the courier."),
  });

  const refreshMutation = useMutation({
    mutationFn: refresh,
    onSuccess: (result) => {
      toast.success(`Courier status: ${result.courierStatus}`);
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message || "Could not refresh the status."),
  });

  const alreadyBooked = Boolean(order.consignment_id);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide">Courier & delivery</h2>

      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Courier">{order.courier_name || "Not booked"}</Row>
        <Row label="Consignment">{order.consignment_id || "—"}</Row>
        <Row label="Tracking code">{order.courier_tracking_id || "—"}</Row>
        <Row label="Courier status">
          <StatusBadge value={order.courier_status} />
        </Row>
        <Row label="Cash to collect">{formatBDT(codAmount)}</Row>
      </dl>

      {order.tracking_url ? (
        <a
          href={order.tracking_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-primary underline"
        >
          Open tracking page
        </a>
      ) : null}

      {!alreadyBooked && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {active.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No courier is switched on yet. Turn one on in Couriers first.
            </p>
          ) : (
            <>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Choose courier
                <select
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  value={selected?.id ?? ""}
                  onChange={(event) => setCourierId(event.target.value)}
                >
                  {active.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.name}
                    </option>
                  ))}
                </select>
              </label>
              {selected && (
                <p className="text-xs text-muted-foreground">
                  Delivery charge {formatBDT(courierChargeForZone(selected, order.delivery_zone))} ·
                  COD fee about {formatBDT(codFee(selected, codAmount))}
                </p>
              )}
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Note for the rider (optional)
                <input
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  value={note}
                  maxLength={300}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
            </>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="red"
          size="touch"
          disabled={!canManage || alreadyBooked || !selected || bookMutation.isPending}
          onClick={() =>
            selected &&
            bookMutation.mutate({ data: { orderId: order.id, courierId: selected.id, note } })
          }
        >
          {alreadyBooked
            ? "Already booked"
            : bookMutation.isPending
              ? "Booking…"
              : `Book with ${selected?.name ?? "courier"}`}
        </Button>
        <Button
          variant="steel"
          size="touch"
          disabled={!alreadyBooked || refreshMutation.isPending}
          onClick={() => refreshMutation.mutate({ data: { orderId: order.id } })}
        >
          {refreshMutation.isPending ? "Checking…" : "Refresh courier status"}
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        An order can only be booked once, so a double click never creates two shipments.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}
