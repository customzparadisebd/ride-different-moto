import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/format";
import { placeOrder } from "@/lib/orders.functions";
import {
  checkoutSubmitInput,
  DELIVERY_ZONES,
  newIdempotencyKey,
  PAYMENT_METHODS,
  SHIPPING_FLAT_BDT,
} from "@/lib/orders.shared";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: `Checkout — ${site.name}` },
      {
        name: "description",
        content:
          "Confirm your motorcycle modification parts order with cash on delivery or mobile payment. Nationwide delivery across Bangladesh.",
      },
      { property: "og:title", content: `Checkout — ${site.name}` },
      {
        property: "og:description",
        content: "Place your order for premium motorcycle modification parts in Bangladesh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Placed = { invoiceNo: string; total: number };

function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const router = useRouter();
  const submitOrder = useServerFn(placeOrder);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    addressLine: "",
    city: "",
    deliveryZone: "inside_dhaka",
    notes: "",
    paymentMethod: "cash_on_delivery",
  });
  // One key per checkout attempt — a double tap or retry can never duplicate the order.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  const shipping = lines.length ? SHIPPING_FLAT_BDT : 0;
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

  const mutation = useMutation({
    mutationFn: submitOrder,
    onSuccess: (result) => {
      setPlaced({ invoiceNo: result.invoiceNo, total: result.total });
      clear();
      setIdempotencyKey(newIdempotencyKey());
      router.invalidate();
    },
    onError: (error: Error) => toast.error(error.message || "Could not place your order."),
  });

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = checkoutSubmitInput.safeParse({
      ...form,
      idempotencyKey,
      items: lines.map((line) => ({ productId: line.id, quantity: line.qty })),
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error(fieldErrors["items"] ?? "Please check the highlighted fields.");
      return;
    }
    setErrors({});
    mutation.mutate({ data: parsed.data });
  };

  if (placed) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-wide">
          Order Confirmed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you! Our team will call you shortly to confirm delivery details.
        </p>
        <div className="mt-6 rounded-xl border border-border bg-card p-5 text-left shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Invoice ID</p>
          <p className="font-display text-2xl font-bold text-primary">{placed.invoiceNo}</p>
          <p className="mt-3 text-sm">
            Amount payable: <strong>{formatBDT(placed.total)}</strong>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep this invoice ID for tracking. Support: {site.phoneDisplay}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="red" size="touch" asChild>
            <Link to="/shop">Continue Shopping</Link>
          </Button>
          <Button variant="steel" size="touch" asChild>
            <Link to="/">Back Home</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl">
        Checkout
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cash on delivery and mobile payments supported. Delivery across Bangladesh.
      </p>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-secondary p-8 text-center">
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Button variant="red" size="touch" className="mt-4" asChild>
            <Link to="/shop">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Field
              id="customerName"
              label="Full name"
              value={form.customerName}
              onChange={update("customerName")}
              error={errors["customerName"]}
              autoComplete="name"
            />
            <Field
              id="customerPhone"
              label="Mobile number"
              value={form.customerPhone}
              onChange={update("customerPhone")}
              error={errors["customerPhone"]}
              placeholder="01XXXXXXXXX"
              inputMode="tel"
              autoComplete="tel"
            />
            <Field
              id="customerEmail"
              label="Email (optional)"
              value={form.customerEmail}
              onChange={update("customerEmail")}
              error={errors["customerEmail"]}
              type="email"
              autoComplete="email"
            />
            <Field
              id="city"
              label="City / District"
              value={form.city}
              onChange={update("city")}
              error={errors["city"]}
              autoComplete="address-level2"
            />
            <div>
              <Label htmlFor="deliveryZone">Delivery zone</Label>
              <select
                id="deliveryZone"
                value={form.deliveryZone}
                onChange={(e) => update("deliveryZone")(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {DELIVERY_ZONES.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="addressLine">Full delivery address</Label>
              <Textarea
                id="addressLine"
                value={form.addressLine}
                onChange={(e) => update("addressLine")(e.target.value)}
                rows={3}
                className="mt-1.5"
                autoComplete="street-address"
              />
              {errors["addressLine"] && (
                <p className="mt-1 text-xs text-destructive">{errors["addressLine"]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment method</Label>
              <select
                id="paymentMethod"
                value={form.paymentMethod}
                onChange={(e) => update("paymentMethod")(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="notes">Order notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update("notes")(e.target.value)}
                rows={2}
                className="mt-1.5"
              />
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-border bg-card p-4 shadow-card">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">Order Summary</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {lines.map((line) => (
                <li key={line.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {line.name} <span className="text-muted-foreground">x{line.qty}</span>
                  </span>
                  <span className="shrink-0">{formatBDT(line.unitPrice * line.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
              <Row label="Subtotal" value={formatBDT(subtotal)} />
              <Row label="Shipping" value={formatBDT(shipping)} />
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-lg font-bold text-primary">{formatBDT(total)}</dd>
              </div>
            </dl>
            <Button
              type="submit"
              variant="red"
              size="touch"
              className="mt-4 w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Placing order…" : "Place Order"}
            </Button>
          </aside>
        </form>
      )}
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

function Field({
  id,
  label,
  value,
  onChange,
  error,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id"> & {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11"
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}