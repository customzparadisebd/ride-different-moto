import { useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatBDT } from "@/lib/format";
import {
  COURIER_STATUSES,
  DELIVERY_ZONES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  statusLabel,
} from "@/lib/orders.shared";

export type OrderUpdatePayload = {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionId?: string;
  advancePaid?: number;
  discount?: number;
  shipping?: number;
  deliveryZone?: string;
  courierName?: string;
  courierTrackingId?: string;
  courierStatus?: string;
  internalNotes?: string;
  note?: string;
};

type OrderForPanel = {
  status: string;
  payment_status: string;
  payment_method: string;
  transaction_id: string | null;
  advance_paid: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  delivery_zone: string | null;
  courier_name: string | null;
  courier_tracking_id: string | null;
  courier_status: string;
  internal_notes: string | null;
};

/**
 * Order status updater, payment/transaction details, courier tracking,
 * pricing adjustments and admin-only internal notes. Every save goes through
 * the audited server function.
 */
export function OrderManagePanel({
  order,
  onSubmit,
  isPending,
  canManage,
  userRoles = [],
}: {
  order: OrderForPanel;
  onSubmit: (payload: OrderUpdatePayload) => void;
  isPending: boolean;
  canManage: boolean;
  userRoles?: string[];
}) {
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const isAdmin = userRoles.some((r) => r === "admin" || r === "super_admin");

  const [payment, setPayment] = useState({
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    transactionId: order.transaction_id ?? "",
    advancePaid: String(Number(order.advance_paid ?? 0)),
    discount: String(Number(order.discount ?? 0)),
    shipping: String(Number(order.shipping ?? 0)),
  });
  const [courier, setCourier] = useState({
    courierName: order.courier_name ?? "",
    courierTrackingId: order.courier_tracking_id ?? "",
    courierStatus: order.courier_status ?? "not_booked",
    deliveryZone: order.delivery_zone ?? "inside_dhaka",
  });
  const [internalNotes, setInternalNotes] = useState(order.internal_notes ?? "");
  const [note, setNote] = useState("");

  if (!canManage) {
    return (
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-card">
        You have view-only access to orders. Ask a Super Admin for the orders.manage permission to
        update status, payment or courier details.
      </p>
    );
  }

  const due = Math.max(Number(order.total) - Number(order.advance_paid ?? 0), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ---- Order status updater ---- */}
      <Card title="Order status">
        <div className="flex items-center gap-2">
          <StatusBadge value={order.status} />
          <span className="text-xs text-muted-foreground">current</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ORDER_STATUSES.map((status) => (
            <Button
              key={status}
              type="button"
              size="touch"
              variant={status === order.status ? "red" : "steel"}
              disabled={isPending || status === order.status}
              onClick={() => onSubmit({ status })}
            >
              {statusLabel(status)}
            </Button>
          ))}
        </div>
      </Card>

      {/* ---- Payment + transaction ---- */}
      <Card title="Payment & transaction">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Payment method"
            value={payment.paymentMethod}
            onChange={(v) => setPayment((p) => ({ ...p, paymentMethod: v }))}
            options={PAYMENT_METHODS.map((m) => [m.value, m.label] as const)}
          />
          <SelectField
            label="Payment status"
            value={payment.paymentStatus}
            onChange={(v) => setPayment((p) => ({ ...p, paymentStatus: v }))}
            options={PAYMENT_STATUSES.map((s) => [s, statusLabel(s)] as const)}
          />
          <TextField
            label="Transaction ID (bKash / Nagad / bank)"
            value={payment.transactionId}
            onChange={(v) => setPayment((p) => ({ ...p, transactionId: v }))}
          />
          <TextField
            label="Advance paid (৳)"
            value={payment.advancePaid}
            onChange={(v) => setPayment((p) => ({ ...p, advancePaid: v }))}
            numeric
          />
          <TextField
            label="Discount (৳)"
            value={payment.discount}
            onChange={(v) => setPayment((p) => ({ ...p, discount: v }))}
            numeric
          />
          <TextField
            label="Delivery charge (৳)"
            value={payment.shipping}
            onChange={(v) => setPayment((p) => ({ ...p, shipping: v }))}
            numeric
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Total {formatBDT(Number(order.total))} · Due {formatBDT(due)}
        </p>
        <Button
          type="button"
          variant="red"
          size="touch"
          className="mt-3"
          disabled={isPending}
          onClick={() =>
            onSubmit({
              paymentStatus: payment.paymentStatus,
              paymentMethod: payment.paymentMethod,
              transactionId: payment.transactionId.trim(),
              advancePaid: Number(payment.advancePaid) || 0,
              discount: Number(payment.discount) || 0,
              shipping: Number(payment.shipping) || 0,
            })
          }
        >
          {isPending ? "Saving…" : "Save payment details"}
        </Button>
      </Card>

      {/* ---- Courier / delivery ---- */}
      <Card title="Delivery & courier">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Delivery zone"
            value={courier.deliveryZone}
            onChange={(v) => setCourier((c) => ({ ...c, deliveryZone: v }))}
            options={DELIVERY_ZONES.map((z) => [z.value, z.label] as const)}
          />
          <SelectField
            label="Courier status"
            value={courier.courierStatus}
            onChange={(v) => setCourier((c) => ({ ...c, courierStatus: v }))}
            options={COURIER_STATUSES.map((s) => [s, statusLabel(s)] as const)}
          />
          <TextField
            label="Courier name"
            value={courier.courierName}
            onChange={(v) => setCourier((c) => ({ ...c, courierName: v }))}
          />
          <TextField
            label="Tracking ID"
            value={courier.courierTrackingId}
            onChange={(v) => setCourier((c) => ({ ...c, courierTrackingId: v }))}
          />
        </div>
        <Button
          type="button"
          variant="red"
          size="touch"
          className="mt-3"
          disabled={isPending}
          onClick={() =>
            onSubmit({
              deliveryZone: courier.deliveryZone,
              courierStatus: courier.courierStatus,
              courierName: courier.courierName.trim(),
              courierTrackingId: courier.courierTrackingId.trim(),
            })
          }
        >
          {isPending ? "Saving…" : "Save delivery details"}
        </Button>
      </Card>

      {/* ---- Internal notes + history note ---- */}
      <Card title="Admin internal notes">
        <Label htmlFor="internal-notes" className="sr-only">
          Internal notes
        </Label>
        <textarea
          id="internal-notes"
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={5}
          maxLength={4000}
          placeholder="Visible to staff only — never shown to the customer."
          className="w-full rounded-md border border-input bg-background p-3 text-sm"
        />
        <Button
          type="button"
          variant="red"
          size="touch"
          className="mt-2"
          disabled={isPending}
          onClick={() => onSubmit({ internalNotes })}
        >
          {isPending ? "Saving…" : "Save internal notes"}
        </Button>

        <div className="mt-4 border-t border-border pt-3">
          <Label htmlFor="history-note">Add a note to the order history</Label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="history-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11"
              maxLength={500}
            />
            <Button
              type="button"
              variant="steel"
              size="touch"
              disabled={!note.trim() || isPending}
              onClick={() => {
                onSubmit({ note: note.trim() });
                setNote("");
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  numeric?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        value={value}
        inputMode={numeric ? "decimal" : "text"}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
