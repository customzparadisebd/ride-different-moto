import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBDT } from "@/lib/format";
import { getOrder, updateOrderStatus } from "@/lib/orders.functions";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  paymentMethodLabel,
  statusLabel,
} from "@/lib/orders.shared";

export const Route = createFileRoute("/_authenticated/czp-ops-9f2c/orders/$id")({
  head: () => ({ meta: [{ title: "Order — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchOrder = useServerFn(getOrder);
  const update = useServerFn(updateOrderStatus);
  const [note, setNote] = useState("");

  const query = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => fetchOrder({ data: { orderId: id } }),
  });

  const mutation = useMutation({
    mutationFn: update,
    onSuccess: () => {
      setNote("");
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
          <Link to="/czp-ops-9f2c">Back to orders</Link>
        </Button>
      </section>
    );
  }

  const { order, items, events } = query.data;

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/czp-ops-9f2c" className="text-xs uppercase tracking-wider text-muted-foreground underline">
        ← All orders
      </Link>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide">
        {order.invoice_no}
      </h1>
      <p className="text-xs text-muted-foreground">
        {new Date(order.created_at).toLocaleString("en-GB")} · {statusLabel(order.order_source)}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-display text-lg font-bold uppercase">Customer</h2>
          <p className="mt-2 text-sm">{order.customer_name}</p>
          <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
          {order.customer_email && (
            <p className="text-sm text-muted-foreground">{order.customer_email}</p>
          )}
          <p className="mt-2 text-sm">
            {order.address_line}, {order.city}
          </p>
          {order.notes && <p className="mt-2 text-xs text-muted-foreground">Note: {order.notes}</p>}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-display text-lg font-bold uppercase">Payment</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <Row label="Method" value={paymentMethodLabel(order.payment_method)} />
            <Row label="Payment status" value={statusLabel(order.payment_status)} />
            <Row label="Subtotal" value={formatBDT(Number(order.subtotal))} />
            <Row label="Discount" value={formatBDT(Number(order.discount))} />
            <Row label="Shipping" value={formatBDT(Number(order.shipping))} />
            <div className="flex justify-between border-t border-border pt-1">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-lg font-bold text-primary">
                {formatBDT(Number(order.total))}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Line total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="p-3">{item.product_name}</td>
                <td className="p-3">{formatBDT(Number(item.unit_price))}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">{formatBDT(Number(item.line_total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-2">
        <div>
          <Label>Order status</Label>
          <select
            value={order.status}
            onChange={(e) => mutation.mutate({ data: { orderId: order.id, status: e.target.value as "pending" } })}
            className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Payment status</Label>
          <select
            value={order.payment_status}
            onChange={(e) =>
              mutation.mutate({ data: { orderId: order.id, paymentStatus: e.target.value as "unpaid" } })
            }
            className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="note">Add a note to the order history</Label>
          <div className="mt-1.5 flex gap-2">
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} className="h-11" />
            <Button
              variant="steel"
              size="touch"
              disabled={!note.trim() || mutation.isPending}
              onClick={() => mutation.mutate({ data: { orderId: order.id, note: note.trim() } })}
            >
              Save note
            </Button>
          </div>
        </div>
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