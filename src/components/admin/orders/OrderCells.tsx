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
  StickyNote,
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
  onShowNote,
  canManage,
}: {
  order: AdminOrderListRow;
  onActivity: () => void;
  onTogglePin: () => void;
  onShowNote?: (() => void) | undefined;
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
        {onShowNote && (
          <button
            type="button"
            title="View customer note"
            aria-label="View customer note"
            onClick={onShowNote}
            className="grid size-7 place-items-center rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-500 transition-colors hover:bg-blue-500/20 hover:border-blue-500/40 [&_svg]:size-3.5"
          >
            <StickyNote />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 pt-1">
        <Link
          to="/ad/orders/$id"
          params={{ id: order.id }}
          className="rounded bg-primary/10 px-2 py-0.5 font-mono text-sm font-black tracking-tighter text-primary ring-1 ring-primary/20 transition-all hover:bg-primary/20"
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
    <div className="space-y-1 text-[13px]">
      <p className="font-bold leading-tight">{order.customer_name}</p>
      <div className="flex items-center gap-1">
        <span className="font-mono text-primary">{order.customer_phone}</span>
        <button onClick={() => void copy(order.customer_phone, "Phone")} className="text-muted-foreground hover:text-primary">
          <Copy className="size-3" />
        </button>
        <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="text-[#25D366]">
          <MessageCircle className="size-3.5" />
        </a>
        <a href={`https://www.google.com/search?q=${encodeURIComponent(`${order.customer_phone} courier fraud check`)}`} target="_blank" rel="noreferrer" className="text-rose-500">
          <ShieldAlert className="size-3.5" />
        </a>
      </div>
      <p className="text-[11px] leading-tight text-muted-foreground">
        {order.address_line}, {order.city} · {deliveryZoneLabel(order.delivery_zone)}
      </p>
      <div className="pt-0.5">
        <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase">
          Total Orders ({order.customer_order_count})
        </span>
      </div>
    </div>
  );
}

/** PRODUCTS — thumbnail, name, quantity, variant and price. */
export function ProductsCell({ order }: { order: AdminOrderListRow }) {
  if (!order.order_items.length)
    return <span className="text-[11px] text-muted-foreground italic">No items</span>;
  return (
    <ul className="space-y-1">
      {order.order_items.map((item) => (
        <li key={item.id} className="flex items-start gap-1.5">
          <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded border border-border bg-secondary">
            {item.image_url ? (
              <img src={item.image_url} alt={item.product_name} className="size-full object-cover" />
            ) : (
              <span className="text-[8px] uppercase text-muted-foreground">No img</span>
            )}
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-[11px] font-bold">{item.product_name}</span>
            <span className="block text-[10px] text-muted-foreground">
              Qty: {item.quantity} {item.variant ? ` · ${item.variant}` : ""}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** PAYMENT INFO — method, status and transaction reference. */
export function PaymentCell({ order }: { order: AdminOrderListRow }) {
  return (
    <div className="flex flex-col items-center space-y-1 text-[11px] leading-tight">
      <p className="font-bold text-muted-foreground uppercase">{paymentMethodLabel(order.payment_method)}</p>
      <StatusBadge value={order.payment_status} />
      <p className="font-mono text-[10px] opacity-70">TrxID: {order.transaction_id || "—"}</p>
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
    <div className="flex flex-col items-center space-y-1 text-[11px] leading-tight">
      <StatusBadge value={order.courier_status} />
      {order.courier_name ? <p className="font-bold text-muted-foreground uppercase">{order.courier_name}</p> : <p className="text-muted-foreground italic">No Courier</p>}
      {order.consignment_id ? (
        <div className="flex items-center gap-1">
          <p className="font-mono text-[10px] opacity-70">CN: {order.consignment_id}</p>
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
    </div>
  );
}


/** AMOUNTS — full money breakdown for the order. */
export function AmountsCell({ order }: { order: AdminOrderListRow }) {
  const due = Math.max(Number(order.total) - Number(order.advance_paid ?? 0), 0);
  return (
    <dl className="space-y-0 text-[11px]">
      <Row label="Discount" value={`৳${Number(order.discount)}`} />
      <Row label="Subtotal" value={`৳${Number(order.subtotal)}`} />
      <Row label="Tax" value="৳0" />
      <Row label="Shipping" value={`৳${Number(order.shipping)}`} />
      <div className="mt-1 border-t border-dashed border-border pt-1">
        <Row label="Total" value={`৳${Number(order.total)}`} strong color="text-emerald-600 dark:text-emerald-500" />
      </div>
    </dl>
  );
}

function Row({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 whitespace-nowrap leading-tight">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className={`${strong ? "font-bold" : ""} ${color ?? ""}`}>{value}</dd>
    </div>
  );
}