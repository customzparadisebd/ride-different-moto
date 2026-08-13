// ============================================================
// PRINTABLE INVOICE
// Purpose: Clean A4 invoice for an order, printed or saved as PDF
//          from the browser. No admin chrome, no navigation.
// Status: COMPLETED
// Security: Same permission-checked getOrder server function as the
//          order detail page.
// ============================================================
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import { formatBDT } from "@/lib/format";
import { getOrder } from "@/lib/orders.functions";
import { deliveryZoneLabel, paymentMethodLabel, statusLabel } from "@/lib/orders.shared";

export const Route = createFileRoute("/_authenticated/ad/invoice/$id")({
  head: () => ({ meta: [{ title: "Invoice — CZP Ops" }, { property: "og:title", content: "Invoice — CZP Ops" }, { name: "description", content: "Customz Paradise BD Admin Panel" }] }),
  component: InvoicePage,
});

function InvoicePage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrder);
  const query = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => fetchOrder({ data: { orderId: id } }),
  });

  if (query.isLoading) {
    return <p className="p-10 text-center text-sm text-muted-foreground">Loading invoice…</p>;
  }
  if (query.isError || !query.data) {
    return <p className="p-10 text-center text-sm text-destructive">Invoice not found.</p>;
  }

  const { order, items } = query.data;
  const due = Math.max(Number(order.total) - Number(order.advance_paid), 0);

  return (
    <div className="mx-auto max-w-3xl bg-background p-6 print:p-0">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          to="/ad/orders/$id"
          params={{ id }}
          className="text-xs uppercase tracking-wider text-muted-foreground underline"
        >
          ← Back to order
        </Link>
        <Button variant="red" size="sm" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">{site.name}</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{site.tagline}</p>
          <p className="mt-1 text-xs text-muted-foreground">{site.phoneDisplay}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold">INVOICE</p>
          <p className="text-sm font-semibold">{order.invoice_no}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("en-GB")}
          </p>
          <p className="text-xs text-muted-foreground">
            Status: {statusLabel(order.status)} · {statusLabel(order.payment_status)}
          </p>
        </div>
      </header>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Billed to
          </h2>
          <p className="mt-1 font-semibold">{order.customer_name}</p>
          <p className="text-sm">{order.customer_phone}</p>
          {order.customer_email ? <p className="text-sm">{order.customer_email}</p> : null}
          <p className="mt-1 text-sm text-muted-foreground">
            {order.address_line}, {order.city}
          </p>
          <p className="text-sm text-muted-foreground">
            Zone: {deliveryZoneLabel(order.delivery_zone)}
          </p>
        </div>
        <div className="sm:text-right">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Payment
          </h2>
          <p className="mt-1 text-sm">{paymentMethodLabel(order.payment_method)}</p>
          {order.transaction_id ? (
            <p className="text-sm text-muted-foreground">TxID: {order.transaction_id}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">Source: {statusLabel(order.order_source)}</p>
          {order.courier_name ? (
            <p className="text-sm text-muted-foreground">
              Courier: {order.courier_name}
              {order.courier_tracking_id ? ` · ${order.courier_tracking_id}` : ""}
            </p>
          ) : null}
        </div>
      </section>

      <table className="mt-6 w-full text-sm">
        <thead className="border-y border-border text-left text-xs uppercase tracking-wider">
          <tr>
            <th className="py-2">Product</th>
            <th className="py-2 text-right">Unit price</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border">
              <td className="py-2">
                {item.product_name}
                {item.variant ? (
                  <span className="block text-xs text-muted-foreground">{item.variant}</span>
                ) : null}
              </td>
              <td className="py-2 text-right">{formatBDT(Number(item.unit_price))}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatBDT(Number(item.line_total))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
        <Row label="Subtotal" value={formatBDT(Number(order.subtotal))} />
        <Row label="Discount" value={`− ${formatBDT(Number(order.discount))}`} />
        <Row label="Delivery charge" value={formatBDT(Number(order.shipping))} />
        <div className="flex justify-between border-t border-border pt-1">
          <dt className="font-semibold">Total payable</dt>
          <dd className="font-display text-lg font-bold">{formatBDT(Number(order.total))}</dd>
        </div>
        <Row label="Advance paid" value={formatBDT(Number(order.advance_paid))} />
        <Row label="Due" value={formatBDT(due)} />
      </dl>

      {order.notes ? (
        <p className="mt-6 text-xs text-muted-foreground">Customer note: {order.notes}</p>
      ) : null}

      <footer className="mt-8 border-t border-border pt-3 text-center text-xs text-muted-foreground">
        Thank you for riding with {site.name}. {site.tagline}
      </footer>
    </div>
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
