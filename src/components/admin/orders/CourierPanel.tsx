// ============================================================
// COURIER (STEADFAST) PANEL
// Purpose: Send a single order to Steadfast, show the consignment /
//          tracking info and refresh the delivery status.
// Status: COMPLETED
// Security: Both actions call audited server functions that require
//          the orders.manage permission; API credentials stay server-side.
// ============================================================
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { refreshCourierStatus, sendOrdersToCourier } from "@/lib/courier.functions";

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
    status: string;
  };
  canManage: boolean;
  onChanged: () => void;
}) {
  const send = useServerFn(sendOrdersToCourier);
  const refresh = useServerFn(refreshCourierStatus);

  const sendMutation = useMutation({
    mutationFn: send,
    onSuccess: (result) => {
      const first = result.results[0];
      if (first?.success) toast.success(first.message);
      else toast.error(first?.message ?? "Steadfast did not accept this order.");
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message || "Could not reach Steadfast."),
  });

  const refreshMutation = useMutation({
    mutationFn: refresh,
    onSuccess: (result) => {
      toast.success(`Courier status: ${result.courierStatus}`);
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message || "Could not refresh the status."),
  });

  const alreadySent = Boolean(order.consignment_id);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide">Steadfast courier</h2>

      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Courier">{order.courier_name || "Not booked"}</Row>
        <Row label="Consignment">{order.consignment_id || "—"}</Row>
        <Row label="Tracking code">{order.courier_tracking_id || "—"}</Row>
        <Row label="Courier status">
          <StatusBadge value={order.courier_status} />
        </Row>
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

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="red"
          size="touch"
          disabled={!canManage || alreadySent || sendMutation.isPending}
          onClick={() => sendMutation.mutate({ data: { orderIds: [order.id] } })}
        >
          {alreadySent ? "Already sent" : sendMutation.isPending ? "Sending…" : "Send to Steadfast"}
        </Button>
        <Button
          variant="steel"
          size="touch"
          disabled={!canManage || !alreadySent || refreshMutation.isPending}
          onClick={() => refreshMutation.mutate({ data: { orderId: order.id } })}
        >
          {refreshMutation.isPending ? "Checking…" : "Refresh courier status"}
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        An order can only be pushed once, so a double click never creates two shipments.
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
