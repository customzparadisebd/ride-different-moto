// ============================================================
// ORDER ROW CELLS
// Purpose: Shared presentation blocks for the redesigned order list.
//          The desktop table and the mobile order cards render the
//          exact same blocks so no information is lost on small screens.
// Security: Presentation only — every action is gated by the caller
//          through server-resolved permissions.
// ============================================================
import { Link } from "@tanstack/react-router";
import {
  Copy,
  ExternalLink,
  History,
  MessageCircle,
  Pencil,
  Pin,
  Printer,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { toast } from "sonner";

import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { formatBDT } from "@/lib/format";
import type { AdminOrderListRow } from "@/lib/orders.functions";
import { deliveryZoneLabel, paymentMethodLabel, statusLabel } from "@/lib/orders.shared";

const copy = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy to clipboard.");
  }
};

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}

const iconLinkClass =
  "grid size-7 place-items-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary [&_svg]:size-3.5";

/** INVOICE — number, quick actions, source badge and print state. */
export function InvoiceCell({
  order,
  onActivity,
  onTogglePin,
  canManage,
}: {
  order: AdminOrderListRow;
  onActivity: () => void;
  onTogglePin: () => void;
  canManage: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1">
        <IconAction label="Copy invoice" onClick={() => void copy(order.invoice_no, "Invoice")}>
          <Copy />
        </IconAction>
        <Link
          to="/ad/invoice/$id"
          params={{ id: order.id }}
          target="_blank"
          title="Print invoice"
          aria-label="Print invoice"
          className={iconLinkClass}
        >
          <Printer />
        </Link>
        <Link
          to="/ad/orders/$id"
          params={{ id: order.id }}
          title="Edit order"
          aria-label="Edit order"
          className={iconLinkClass}
        >
          <Pencil />
        </Link>
        <IconAction label="Activity log" onClick={onActivity}>
          <History />
        </IconAction>
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          to="/ad/orders/$id"
          params={{ id: order.id }}
          className="font-mono text-[13px] font-bold text-primary underline decoration-primary/30 underline-offset-2"
        >
          {order.invoice_no}
        </Link>
        {order.is_pinned ? <Pin className="size-3 shrink-0 text-primary" /> : null}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight ${
            order.print_count > 0
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-rose-500/10 text-rose-600"
          }`}
        >
          {order.print_count > 0 ? "Printed" : "Un-Printed"}
        </span>
      </div>
    </div>
  );
}

/** PLACED & ASSIGNED — who created the order and who owns it now. */
export function AssignmentCell({ order }: { order: AdminOrderListRow }) {
  return (
    <div className="space-y-0.5 text-xs">
      <p>
        <span className="text-muted-foreground">Created by: </span>
        <span className="font-semibold">{order.created_by_label ?? "Customer"}</span>
      </p>
      <p>
        <span className="text-muted-foreground">Assigned: </span>
        <span className={order.assigned_to_label ? "font-semibold" : "text-muted-foreground"}>
          {order.assigned_to_label ?? "N/A"}
        </span>
      </p>
    </div>
  );
}

/** CUSTOMER — contact, quick actions, address and repeat-order count. */
export function CustomerCell({ order }: { order: AdminOrderListRow }) {
  const waPhone = order.customer_phone.replace(/\D/g, "").replace(/^0/, "880");
  return (
    <div className="space-y-1.5">
      <p className="font-semibold">{order.customer_name}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
        <IconAction label="Copy phone" onClick={() => void copy(order.customer_phone, "Phone")}>
          <Copy />
        </IconAction>
        <a
          href={`https://wa.me/${waPhone}`}
          target="_blank"
          rel="noreferrer"
          title="WhatsApp customer"
          aria-label="WhatsApp customer"
          className={iconLinkClass}
        >
          <MessageCircle className="text-[color:var(--brand-whatsapp,currentColor)]" />
        </a>
        {/* FRAUD CHECK — opens the courier fraud lookup for this number.
            TODO: replace with an in-app courier fraud API check once available. */}
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(`${order.customer_phone} courier fraud check`)}`}
          target="_blank"
          rel="noreferrer"
          title="Fraud check"
          aria-label="Fraud check"
          className={iconLinkClass}
        >
          <ShieldAlert />
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        {order.address_line}, {order.city} · {deliveryZoneLabel(order.delivery_zone)}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-wide">
        Total orders:{" "}
        <span className={order.customer_order_count > 1 ? "text-primary" : ""}>
          {order.customer_order_count}
        </span>
      </p>
    </div>
  );
}

/** PRODUCTS — thumbnail, name, quantity, variant and price. */
export function ProductsCell({ order }: { order: AdminOrderListRow }) {
  if (!order.order_items.length)
    return <span className="text-xs text-muted-foreground">No items recorded</span>;
  return (
    <ul className="space-y-1.5">
      {order.order_items.map((item) => (
        <li key={item.id} className="flex items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-secondary">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.product_name}
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <span className="text-[9px] uppercase text-muted-foreground">No img</span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold">{item.product_name}</span>
            <span className="block text-[11px] text-muted-foreground">
              x{item.quantity}
              {item.variant ? ` · ${item.variant}` : ""} · {formatBDT(Number(item.unit_price))}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** PAYMENT INFO — method, status and transaction reference. */
export function PaymentCell({ order }: { order: AdminOrderListRow }) {
  return (
    <div className="space-y-1 text-xs">
      <p className="font-semibold">{paymentMethodLabel(order.payment_method)}</p>
      <StatusBadge value={order.payment_status} />
      <p className="text-muted-foreground">TrxID: {order.transaction_id || "—"}</p>
    </div>
  );
}

/** COURIER — status, courier name, consignment, tracking link and charge. */
export function CourierCell({ 
  order, 
  onCancelShipment 
}: { 
  order: AdminOrderListRow;
  onCancelShipment?: () => void;
}) {
  return (
    <div className="space-y-1 text-xs">
      <StatusBadge value={order.courier_status} />
      {order.courier_name ? <p className="font-semibold">{order.courier_name}</p> : null}
      {order.consignment_id ? (
        <div className="flex items-center gap-1.5">
          <p className="text-muted-foreground">CN: {order.consignment_id}</p>
          {onCancelShipment && (
            <button
              type="button"
              onClick={onCancelShipment}
              className="text-rose-500 hover:text-rose-600"
              title="Cancel Shipment"
            >
              <XCircle className="size-3" />
            </button>
          )}
        </div>
      ) : null}
      {order.tracking_url ? (
        <a
          href={order.tracking_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary underline"
        >
          Track <ExternalLink className="size-3" />
        </a>
      ) : null}
      <p className="text-muted-foreground">Charge: {formatBDT(Number(order.shipping))}</p>
      {order.shipment_at ? (
        <p className="text-muted-foreground">
          {new Date(order.shipment_at).toLocaleString("en-GB")}
        </p>
      ) : null}
    </div>
  );
}


/** AMOUNTS — full money breakdown for the order. */
export function AmountsCell({ order }: { order: AdminOrderListRow }) {
  const due = Math.max(Number(order.total) - Number(order.advance_paid ?? 0), 0);
  return (
    <dl className="space-y-0.5 text-xs">
      <Row label="Subtotal" value={formatBDT(Number(order.subtotal))} />
      <Row label="Discount" value={`- ${formatBDT(Number(order.discount))}`} />
      {/* TODO: no tax column exists on orders yet — shown as 0 until VAT is configured. */}
      <Row label="Tax" value={formatBDT(0)} />
      <Row label="Shipping" value={formatBDT(Number(order.shipping))} />
      <Row label="Advance" value={formatBDT(Number(order.advance_paid ?? 0))} />
      <Row label="Due" value={formatBDT(due)} strong />
      <Row label="Total" value={formatBDT(Number(order.total))} strong />
    </dl>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 whitespace-nowrap">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-bold" : ""}>{value}</dd>
    </div>
  );
}