import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { type AdminOrderItem, OrderItemsTable } from "@/components/admin/orders/OrderItemsTable";
import { CourierPanel } from "@/components/admin/orders/CourierPanel";
import {
  OrderManagePanel,
  type OrderUpdatePayload,
} from "@/components/admin/orders/OrderManagePanel";
import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { getMyAccess, getOrder, updateOrderStatus } from "@/lib/orders.functions";
import { deliveryZoneLabel, paymentMethodLabel, statusLabel } from "@/lib/orders.shared";

export const Route = createFileRoute("/_authenticated/ad/orders/$id")({
  head: () => adminHead("Order — CZP Ops"),
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchOrder = useServerFn(getOrder);
  const access = useServerFn(getMyAccess);
  const update = useServerFn(updateOrderStatus);

  const query = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => fetchOrder({ data: { orderId: id } }),
  });
  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({}) });

  const mutation = useMutation({
    mutationFn: update,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order updated");
    },
    onError: (error: Error) => toast.error(error.message || "Could not update the order."),
  });

  if (query.isLoading) {
    return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading order…</p>;
  }
  if (query.isError || !query.data) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Button variant="steel" size="touch" className="mt-4" asChild>
          <Link to="/ad/orders">Back to orders</Link>
        </Button>
      </section>
    );
  }

  const { order, items, events } = query.data;
  const canManage = accessQuery.data?.permissions.includes("orders.manage") ?? false;
  const advancePaid = Number(order.advance_paid ?? 0);
  const due = Math.max(Number(order.total) - advancePaid, 0);

  const submitUpdate = (payload: OrderUpdatePayload) =>
    mutation.mutate({ data: { orderId: order.id, ...payload } as never });

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/ad/orders"
          className="text-xs uppercase tracking-wider text-muted-foreground underline"
        >
          ← All orders
        </Link>
        <Button variant="steel" size="sm" asChild>
          <Link to="/ad/invoice/$id" params={{ id: order.id }}>
            Print invoice
          </Link>
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          {order.invoice_no}
        </h1>
        <StatusBadge value={order.status} />
        <StatusBadge value={order.payment_status} />
        <StatusBadge value={order.courier_status} />
      </div>
      <p className="text-xs text-muted-foreground">
        {new Date(order.created_at).toLocaleString("en-GB")} · source{" "}
        {statusLabel(order.order_source)} · updated{" "}
        {new Date(order.updated_at).toLocaleString("en-GB")}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* ---- Customer information ---- */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-display text-lg font-bold uppercase">Customer information</h2>
          <p className="mt-2 text-sm">{order.customer_name}</p>
          <p className="text-sm text-muted-foreground">
            <a href={`tel:${order.customer_phone}`} className="underline">
              {order.customer_phone}
            </a>
          </p>
          {order.customer_email && (
            <p className="text-sm text-muted-foreground">{order.customer_email}</p>
          )}
          <p className="mt-2 text-sm">
            {order.address_line}, {order.city}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Zone: {deliveryZoneLabel(order.delivery_zone)}
          </p>
          {order.notes && <p className="mt-2 text-xs text-muted-foreground">Note: {order.notes}</p>}
        </div>

        {/* ---- Pricing summary + payment/transaction ---- */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-display text-lg font-bold uppercase">Pricing summary</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <Row label="Method" value={paymentMethodLabel(order.payment_method)} />
            <Row label="Payment status" value={statusLabel(order.payment_status)} />
            <Row label="Transaction ID" value={order.transaction_id || "—"} />
            <Row label="Subtotal" value={formatBDT(Number(order.subtotal))} />
            <Row label="Discount" value={formatBDT(Number(order.discount))} />
            <Row label="Delivery charge" value={formatBDT(Number(order.shipping))} />
            <Row label="Advance paid" value={formatBDT(advancePaid)} />
            <Row label="Due" value={formatBDT(due)} />
            <div className="flex justify-between border-t border-border pt-1">
              <dt className="font-semibold">Total payable</dt>
              <dd className="font-display text-lg font-bold text-primary">
                {formatBDT(Number(order.total))}
              </dd>
            </div>
          </dl>
          <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <Row label="Courier" value={order.courier_name || "—"} />
            <Row label="Tracking ID" value={order.courier_tracking_id || "—"} />
            <Row label="Courier status" value={statusLabel(order.courier_status)} />
          </dl>
        </div>
      </div>

      <h2 className="mt-6 font-display text-lg font-bold uppercase">Ordered items</h2>
      <div className="mt-2">
        <OrderItemsTable items={items as unknown as AdminOrderItem[]} />
      </div>

      <h2 className="mt-6 font-display text-lg font-bold uppercase">Manage order</h2>
      <div className="mt-2">
        <OrderManagePanel
          key={order.updated_at}
          order={order}
          onSubmit={submitUpdate}
          isPending={mutation.isPending}
          canManage={canManage}
        />
      </div>

      <h2 className="mt-6 font-display text-lg font-bold uppercase">Courier</h2>
      <div className="mt-2">
        <CourierPanel
          order={order}
          canManage={canManage}
          onChanged={() => {
            void queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
            void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
          }}
        />
      </div>

      {order.internal_notes ? (
        <p className="mt-4 whitespace-pre-line rounded-xl border border-border bg-card p-4 text-sm shadow-card">
          <span className="block text-xs uppercase tracking-wider text-muted-foreground">
            Saved internal notes
          </span>
          {order.internal_notes}
        </p>
      ) : null}

      <h2 className="mt-6 font-display text-lg font-bold uppercase">Order history</h2>
      <ol className="mt-2 space-y-2">
        {events.map((event) => (
          <li key={event.id} className="rounded-lg border border-border bg-card p-3 text-sm">
            <p className="font-semibold">{statusLabel(event.event_type)}</p>
            {event.message && <p className="text-muted-foreground">{event.message}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(event.created_at).toLocaleString("en-GB")} · {event.actor_label}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
