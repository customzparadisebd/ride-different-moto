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
import { FraudMarkBadge } from "@/components/admin/customers/FraudMarkBadge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { getMyAccess, getOrder, updateOrderStatus } from "@/lib/orders.functions";
import { getSteadfastTracking } from "@/lib/steadfast.functions";
import { deliveryZoneLabel, paymentMethodLabel, statusLabel } from "@/lib/orders.shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Truck, AlertCircle, Pin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ad/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order — CZP Ops" },
      { property: "og:title", content: "Order — CZP Ops" },
      { name: "description", content: "Customz Paradise BD Admin Panel" },
    ],
  }),
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchOrder = useServerFn(getOrder);
  const access = useServerFn(getMyAccess);
  const update = useServerFn(updateOrderStatus);
  const fetchTracking = useServerFn(getSteadfastTracking);

  const query = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => fetchOrder({ data: { orderId: id } }),
  });
  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({}) });

  const trackingQuery = useQuery({
    queryKey: ["admin-order-tracking", id],
    queryFn: () => fetchTracking({ data: { orderId: id } }),
    enabled: !!query.data?.order.consignment_id,
  });

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
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    // If the error is a 404 (handled by TanStack Router notFoundComponent), this won't even render.
    // This block handles cases where the order row is missing or there's a database fetch error.
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-6 flex justify-center text-destructive">
          <AlertCircle className="h-12 w-12 opacity-20" />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight">Order Record Unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't retrieve this order record. It may have been permanently removed.
        </p>
        <Button variant="steel" size="touch" className="mt-8" asChild>
          <Link to="/ad/orders">Return to Order List</Link>
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
            Preview / Print Invoice
          </Link>
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="rounded-lg bg-primary/10 px-3 py-1 font-mono text-4xl font-black tracking-tighter text-primary ring-2 ring-primary/20 dark:bg-primary/10 dark:text-primary dark:ring-primary/20">
          {order.invoice_no}
        </h1>
        {order.is_pinned && (
          <div className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 ring-1 ring-primary/40 dark:bg-primary/20 dark:ring-primary/40">
            <Pin className="size-3 text-primary fill-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Pinned</span>
          </div>
        )}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold uppercase">Customer information</h2>
            <FraudMarkBadge
              phoneNumber={order.customer_phone}
              customerName={order.customer_name}
              canManage={canManage}
            />
          </div>
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
          userRoles={accessQuery.data?.roles ?? []}
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

      <h2 className="mt-6 font-display text-lg font-bold uppercase">
        Shipment Timeline (SteadFast)
      </h2>
      <div className="mt-2">
        <Card className="border-border bg-card shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Truck className="h-4 w-4" />
              Real-time Status Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trackingQuery.isLoading ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Fetching latest tracking...
              </p>
            ) : trackingQuery.data?.events.length || trackingQuery.data?.latest ? (
              <div className="space-y-4">
                {trackingQuery.data.latest && (
                  <div className="relative flex gap-3 pb-4">
                    <div className="absolute left-[7px] top-6 h-full w-[2px] bg-border" />
                    <div className="z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-background">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    </div>
                    <div className="flex-1 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-primary">
                          Live: {statusLabel(trackingQuery.data.latest.status)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(trackingQuery.data.latest.time).toLocaleTimeString("en-BD", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium">
                        {trackingQuery.data.latest.message}
                      </p>
                      <div className="mt-2 rounded bg-muted/50 p-2 font-mono text-[10px] text-muted-foreground">
                        Raw: {JSON.stringify(trackingQuery.data.latest.raw)}
                      </div>
                    </div>
                  </div>
                )}

                {trackingQuery.data?.events.map((event: any, idx: number) => (
                  <div key={event.id} className="relative flex gap-3">
                    {idx < trackingQuery.data.events.length - 1 && (
                      <div className="absolute left-[7px] top-6 h-full w-[2px] bg-border" />
                    )}
                    <div className="z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-muted ring-4 ring-background">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase">
                          {statusLabel(event.courier_status)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(event.created_at).toLocaleString("en-GB", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{event.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <AlertCircle className="mb-2 h-8 w-8 opacity-20" />
                <p className="text-sm italic">No shipment tracking data available yet.</p>
                {!order.consignment_id && (
                  <p className="text-[10px]">Order not yet booked with courier.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
