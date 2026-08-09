// ============================================================
// MANUAL ORDER FORM (admin)
// Purpose: Take a phone/walk-in order with the same invoice series
//          and database as the website checkout.
// Status: COMPLETED
// Security: The submit key prevents duplicate orders, and the
//          server re-validates every field and recomputes totals.
// Future: Courier booking can be triggered from here later.
// ============================================================
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProducts } from "@/data/catalog";
import { formatBDT } from "@/lib/format";
import {
  DELIVERY_ZONES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  statusLabel,
  type AdminOrderInput,
} from "@/lib/orders.shared";

type LineItem = {
  key: string;
  productId: string;
  productSlug: string;
  productName: string;
  variant: string;
  imageUrl: string;
  unitPrice: string;
  quantity: string;
};

const emptyLine = (): LineItem => ({
  key: `line-${Math.random().toString(36).slice(2, 9)}`,
  productId: "",
  productSlug: "",
  productName: "",
  variant: "",
  imageUrl: "",
  unitPrice: "",
  quantity: "1",
});

export function ManualOrderForm({
  idempotencyKey,
  isPending,
  onSubmit,
}: {
  idempotencyKey: string;
  isPending: boolean;
  onSubmit: (input: AdminOrderInput) => void;
}) {
  const catalog = useMemo(() => getProducts(), []);
  const [items, setItems] = useState<LineItem[]>([emptyLine()]);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    addressLine: "",
    city: "",
    deliveryZone: "inside_dhaka",
    discount: "0",
    shipping: "120",
    advancePaid: "0",
    transactionId: "",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "unpaid",
    status: "pending",
    notes: "",
    internalNote: "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const updateLine = (key: string, patch: Partial<LineItem>) =>
    setItems((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const pickProduct = (key: string, productId: string) => {
    const product = catalog.find((entry) => entry.id === productId);
    if (!product) {
      updateLine(key, { productId: "", productSlug: "", imageUrl: "" });
      return;
    }
    updateLine(key, {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variant: product.category,
      imageUrl: product.image,
      unitPrice: String(product.offerPrice ?? product.price),
    });
  };

  const subtotal = items.reduce(
    (sum, line) => sum + (Number(line.unitPrice) || 0) * (Number(line.quantity) || 0),
    0,
  );
  const discount = Math.min(Number(form.discount) || 0, subtotal);
  const shipping = Number(form.shipping) || 0;
  const total = Math.max(subtotal - discount + shipping, 0);
  const advancePaid = Math.min(Number(form.advancePaid) || 0, total);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleanItems = items
      .filter((line) => line.productName.trim() && Number(line.unitPrice) > 0)
      .map((line) => ({
        productId: line.productId || undefined,
        productSlug: line.productSlug || undefined,
        productName: line.productName.trim(),
        variant: line.variant.trim(),
        imageUrl: line.imageUrl,
        unitPrice: Number(line.unitPrice),
        quantity: Math.max(Number(line.quantity) || 1, 1),
      }));

    if (!cleanItems.length) {
      setError("Add at least one product with a name and a unit price.");
      return;
    }
    if (form.customerName.trim().length < 2) {
      setError("Enter the customer's name.");
      return;
    }
    if (!/^(?:\+?880|0)1[3-9]\d{8}$/.test(form.customerPhone.trim())) {
      setError("Enter a valid Bangladeshi mobile number (e.g. 01712345678).");
      return;
    }
    if (form.addressLine.trim().length < 6) {
      setError("Enter the full delivery address.");
      return;
    }
    if (form.city.trim().length < 2) {
      setError("Enter the city.");
      return;
    }

    onSubmit({
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim(),
      addressLine: form.addressLine.trim(),
      city: form.city.trim(),
      deliveryZone: form.deliveryZone as "inside_dhaka",
      notes: form.notes.trim(),
      paymentMethod: form.paymentMethod as "cash_on_delivery",
      paymentStatus: form.paymentStatus as "unpaid",
      status: form.status as "pending",
      discount,
      shipping,
      advancePaid,
      transactionId: form.transactionId.trim(),
      idempotencyKey,
      items: cleanItems,
    });
  };

  return (
    <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
      {/* ---- Customer ---- */}
      <fieldset className="rounded-xl border border-border bg-card p-4 shadow-card">
        <legend className="px-1 font-display text-sm font-bold uppercase">Customer</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={form.customerName} onChange={(e) => set("customerName")(e.target.value)} className="h-11" />
          </Field>
          <Field label="Mobile number">
            <Input
              value={form.customerPhone}
              onChange={(e) => set("customerPhone")(e.target.value)}
              inputMode="tel"
              placeholder="01712345678"
              className="h-11"
            />
          </Field>
          <Field label="Email (optional)">
            <Input
              value={form.customerEmail}
              onChange={(e) => set("customerEmail")(e.target.value)}
              inputMode="email"
              className="h-11"
            />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => set("city")(e.target.value)} className="h-11" />
          </Field>
          <Field label="Delivery zone">
            <SelectInput value={form.deliveryZone} onChange={set("deliveryZone")}>
              {DELIVERY_ZONES.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Full address">
            <Input value={form.addressLine} onChange={(e) => set("addressLine")(e.target.value)} className="h-11" />
          </Field>
        </div>
      </fieldset>

      {/* ---- Items ---- */}
      <fieldset className="rounded-xl border border-border bg-card p-4 shadow-card">
        <legend className="px-1 font-display text-sm font-bold uppercase">Products</legend>
        <div className="space-y-3">
          {items.map((line, index) => (
            <div key={line.key} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Pick from catalog
                </Label>
                <SelectInput value={line.productId} onChange={(value) => pickProduct(line.key, value)}>
                  <option value="">Custom item…</option>
                  {catalog.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — {formatBDT(product.offerPrice ?? product.price)}
                    </option>
                  ))}
                </SelectInput>
              </div>
              <Field label="Product name" className="sm:col-span-2">
                <Input
                  value={line.productName}
                  onChange={(e) => updateLine(line.key, { productName: e.target.value })}
                  className="h-11"
                />
              </Field>
              <Field label="Variant">
                <Input
                  value={line.variant}
                  onChange={(e) => updateLine(line.key, { variant: e.target.value })}
                  className="h-11"
                />
              </Field>
              <Field label="Unit price (৳)">
                <Input
                  value={line.unitPrice}
                  onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                  inputMode="numeric"
                  className="h-11"
                />
              </Field>
              <Field label="Quantity">
                <Input
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                  inputMode="numeric"
                  className="h-11"
                />
              </Field>
              <div className="flex items-end justify-between gap-2 sm:col-span-5">
                <p className="text-sm text-muted-foreground">
                  Line total:{" "}
                  <span className="font-semibold text-foreground">
                    {formatBDT((Number(line.unitPrice) || 0) * (Number(line.quantity) || 0))}
                  </span>
                </p>
                {items.length > 1 ? (
                  <Button
                    type="button"
                    variant="steel"
                    size="sm"
                    onClick={() => setItems((current) => current.filter((entry) => entry.key !== line.key))}
                  >
                    Remove item {index + 1}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="steel"
          size="sm"
          className="mt-3"
          onClick={() => setItems((current) => [...current, emptyLine()])}
        >
          Add another product
        </Button>
      </fieldset>

      {/* ---- Payment & pricing ---- */}
      <fieldset className="rounded-xl border border-border bg-card p-4 shadow-card">
        <legend className="px-1 font-display text-sm font-bold uppercase">Payment & pricing</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Discount (৳)">
            <Input value={form.discount} onChange={(e) => set("discount")(e.target.value)} inputMode="numeric" className="h-11" />
          </Field>
          <Field label="Delivery charge (৳)">
            <Input value={form.shipping} onChange={(e) => set("shipping")(e.target.value)} inputMode="numeric" className="h-11" />
          </Field>
          <Field label="Advance paid (৳)">
            <Input value={form.advancePaid} onChange={(e) => set("advancePaid")(e.target.value)} inputMode="numeric" className="h-11" />
          </Field>
          <Field label="Payment method">
            <SelectInput value={form.paymentMethod} onChange={set("paymentMethod")}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Payment status">
            <SelectInput value={form.paymentStatus} onChange={set("paymentStatus")}>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Transaction ID (bKash/Nagad)">
            <Input value={form.transactionId} onChange={(e) => set("transactionId")(e.target.value)} className="h-11" />
          </Field>
          <Field label="Order status">
            <SelectInput value={form.status} onChange={set("status")}>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Customer note" className="sm:col-span-2">
            <Textarea value={form.notes} onChange={(e) => set("notes")(e.target.value)} rows={2} />
          </Field>
        </div>

        <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <SummaryRow label="Subtotal" value={formatBDT(subtotal)} />
          <SummaryRow label="Discount" value={`− ${formatBDT(discount)}`} />
          <SummaryRow label="Delivery charge" value={formatBDT(shipping)} />
          <SummaryRow label="Advance paid" value={formatBDT(advancePaid)} />
          <SummaryRow label="Due" value={formatBDT(Math.max(total - advancePaid, 0))} />
          <div className="flex justify-between border-t border-border pt-1">
            <dt className="font-semibold">Total payable</dt>
            <dd className="font-display text-lg font-bold text-primary">{formatBDT(total)}</dd>
          </div>
        </dl>
      </fieldset>

      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

      <Button type="submit" variant="red" size="touch" disabled={isPending}>
        {isPending ? "Saving order…" : "Create order"}
      </Button>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
    >
      {children}
    </select>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
