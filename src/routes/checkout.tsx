// ============================================================
// CHECKOUT — COMPLETED
// Purpose: Mobile-first checkout: customer details, admin-managed
//          city dropdown, admin-managed delivery zones/charges,
//          Cash on Delivery, order summary and WhatsApp support.
// Security: Display only — the server reprices every line and
//          resolves the delivery charge from the database.
// ============================================================
import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { checkoutConfigQuery } from "@/lib/checkout-config.queries";
import { whatsappHref } from "@/lib/checkout-config.shared";
import { formatBDT } from "@/lib/format";
import { placeOrder } from "@/lib/orders.functions";
import { checkoutSubmitInput, newIdempotencyKey } from "@/lib/orders.shared";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: `Checkout — ${site.name}` },
      {
        name: "description",
        content:
          "Confirm your motorcycle modification parts order with cash on delivery. Nationwide delivery across Bangladesh.",
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
  const config = useQuery(checkoutConfigQuery());
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    addressLine: "",
    city: "",
    deliveryZone: "",
    notes: "",
  });
  // One key per checkout attempt — a double tap or retry can never duplicate the order.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  const zones = config.data?.zones ?? [];
  const cities = config.data?.cities ?? [];
  const whatsappPhone = config.data?.whatsappPhone ?? site.phoneDisplay;
  const whatsappMessage =
    config.data?.whatsappMessage ?? "Having any problem with your order? Contact us on WhatsApp.";

  // Preselect the first active zone once the admin-managed list arrives.
  useEffect(() => {
    if (!form.deliveryZone && zones[0]) {
      setForm((current) => ({ ...current, deliveryZone: zones[0]!.slug }));
    }
  }, [zones, form.deliveryZone]);

  const selectedZone = zones.find((zone) => zone.slug === form.deliveryZone);
  const shipping = lines.length ? (selectedZone?.charge ?? 0) : 0;
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
    if (!form.city) {
      setErrors({ city: "Please select your city / district" });
      toast.error("Please select your city / district.");
      return;
    }
    if (!form.deliveryZone) {
      setErrors({ deliveryZone: "Please select a delivery zone" });
      toast.error("Please select a delivery zone.");
      return;
    }
    const parsed = checkoutSubmitInput.safeParse({
      ...form,
      paymentMethod: "cash_on_delivery",
      idempotencyKey,
      items: lines.map((line) => ({
        productId: line.productId,
        // Selected colour travels with the line so the order keeps the variation.
        ...(line.colorId ? { colorId: line.colorId } : {}),
        quantity: line.qty,
      })),
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
        <WhatsAppSupport phone={whatsappPhone} message={whatsappMessage} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl overflow-x-hidden px-4 py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl">
        Checkout
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cash on delivery across Bangladesh. Delivery charge depends on your zone.
      </p>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-secondary p-8 text-center">
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Button variant="red" size="touch" className="mt-4" asChild>
            <Link to="/shop">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="min-w-0 space-y-4">
            <Field
              id="customerName"
              label="Full name *"
              value={form.customerName}
              onChange={update("customerName")}
              error={errors["customerName"]}
              autoComplete="name"
            />
            <Field
              id="customerPhone"
              label="Mobile number *"
              value={form.customerPhone}
              onChange={update("customerPhone")}
              error={errors["customerPhone"]}
              placeholder="01XXXXXXXXX"
              inputMode="tel"
              autoComplete="tel"
            />

            {/* CITY & DELIVERY ZONES — COMPLETED */}
            <div>
              <Label htmlFor="city">City / District *</Label>
              <select
                id="city"
                value={form.city}
                onChange={(event) => update("city")(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-base sm:text-sm"
              >
                <option value="">
                  {config.isLoading ? "Loading cities…" : "Select your city / district"}
                </option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
              {errors["city"] && <p className="mt-1 text-xs text-destructive">{errors["city"]}</p>}
            </div>

            <div>
              <Label htmlFor="deliveryZone">Delivery zone *</Label>
              <select
                id="deliveryZone"
                value={form.deliveryZone}
                onChange={(event) => update("deliveryZone")(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-base sm:text-sm"
              >
                <option value="">
                  {config.isLoading ? "Loading zones…" : "Select a delivery zone"}
                </option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.slug}>
                    {zone.name} — {formatBDT(zone.charge)}
                  </option>
                ))}
              </select>
              {errors["deliveryZone"] && (
                <p className="mt-1 text-xs text-destructive">{errors["deliveryZone"]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="addressLine">Full delivery address *</Label>
              <Textarea
                id="addressLine"
                value={form.addressLine}
                onChange={(event) => update("addressLine")(event.target.value)}
                rows={3}
                className="mt-1.5 text-base sm:text-sm"
                autoComplete="street-address"
                placeholder="House, road, area and any landmark"
              />
              {errors["addressLine"] && (
                <p className="mt-1 text-xs text-destructive">{errors["addressLine"]}</p>
              )}
            </div>

            {/* COD PAYMENT — COMPLETED */}
            <div>
              <Label>Payment method</Label>
              <div className="mt-1.5 flex min-h-11 items-center rounded-md border border-border bg-secondary px-3 text-sm font-semibold">
                Cash on Delivery
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Order notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => update("notes")(event.target.value)}
                rows={2}
                className="mt-1.5 text-base sm:text-sm"
              />
            </div>
          </div>

          <aside className="h-fit min-w-0 rounded-xl border border-border bg-card p-4 shadow-card">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              Order Summary
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {lines.map((line) => (
                <li key={line.key} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate">
                      {line.name} <span className="text-muted-foreground">x{line.qty}</span>
                    </span>
                    {line.colorName ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        Color: {line.colorName} · {formatBDT(line.unitPrice)}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0">{formatBDT(line.unitPrice * line.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
              <Row label="Subtotal" value={formatBDT(subtotal)} />
              <Row
                label={selectedZone ? `Delivery — ${selectedZone.name}` : "Delivery charge"}
                value={formatBDT(shipping)}
              />
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
            <WhatsAppSupport phone={whatsappPhone} message={whatsappMessage} />
          </aside>
        </form>
      )}
    </section>
  );
}

// WHATSAPP SUPPORT — COMPLETED
function WhatsAppSupport({ phone, message }: { phone: string; message: string }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-secondary/60 p-3 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
      <a
        href={whatsappHref(phone, "Hi! I need help with my order on Customz Paradise BD.")}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-current">
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.13-.42-2.15-1.33-.8-.71-1.33-1.59-1.48-1.89-.15-.3-.02-.46.13-.61.15-.15.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.09 3.2 5.07 4.37.71.28 1.26.45 1.69.58.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.37 9.37 0 0 1-1.44-5.01c0-5.18 4.22-9.4 9.42-9.4 2.51 0 4.87.98 6.64 2.76a9.34 9.34 0 0 1 2.75 6.65c0 5.18-4.23 9.41-9.4 9.41zM20.5 3.49A11.3 11.3 0 0 0 12.04 0C5.79 0 .71 5.08.7 11.32c0 1.99.52 3.94 1.51 5.66L.6 24l7.18-1.88a11.3 11.3 0 0 0 4.25 1.08h.01c6.24 0 11.32-5.08 11.33-11.32 0-3.02-1.18-5.87-3.32-8.02z" />
        </svg>
        WhatsApp Support
      </a>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="min-w-0 truncate text-muted-foreground">{label}</dt>
      <dd className="shrink-0">{value}</dd>
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
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 text-base sm:text-sm"
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
