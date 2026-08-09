import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EMPTY_ORDER_FILTERS,
  OrderFilterBar,
  type OrderFilters,
} from "@/components/admin/orders/OrderFilterBar";
import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/format";
import { createManualOrder, getMyAccess, listOrders } from "@/lib/orders.functions";
import {
  DELIVERY_ZONES,
  deliveryZoneLabel,
  newIdempotencyKey,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  paymentMethodLabel,
  statusLabel,
} from "@/lib/orders.shared";

export const Route = createFileRoute("/_authenticated/czp-ops-9f2c/")({
  head: () => ({ meta: [{ title: "Orders — Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminOrders,
});

function AdminOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const access = useServerFn(getMyAccess);
  const fetchOrders = useServerFn(listOrders);
  const [filters, setFilters] = useState<OrderFilters>(EMPTY_ORDER_FILTERS);

  // Only non-empty filters are sent, so the server-side Zod schema keeps its defaults.
  const activeFilters = useMemo(
    () =>
      Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "")) as Record<
        string,
        string
      >,
    [filters],
  );

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({}) });
  const ordersQuery = useQuery({
    queryKey: ["admin-orders", activeFilters],
    queryFn: () => fetchOrders({ data: activeFilters }),
    enabled: accessQuery.data?.isStaff === true,
    placeholderData: (previous) => previous,
  });

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/czp-ops-9f2c/access", replace: true });
  };

  if (accessQuery.isLoading) {
    return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (!accessQuery.data?.isStaff) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold uppercase">No admin access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {accessQuery.data?.email} is signed in but has no staff role.
        </p>
        <Button variant="steel" size="touch" className="mt-4" onClick={handleSignOut}>
          Sign out
        </Button>
      </section>
    );
  }

  const orders = ordersQuery.data ?? [];
  const totalValue = orders.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Orders</h1>
          <p className="text-xs text-muted-foreground">
            {accessQuery.data.primaryRole ?? "staff"} access · {orders.length} order(s) ·{" "}
            {formatBDT(totalValue)} value
          </p>
        </div>
      </div>

      {/* Manual order entry requires the orders.create permission (also enforced server-side). */}
      {accessQuery.data.permissions.includes("orders.create") ? <ManualOrderForm /> : null}

      <OrderFilterBar
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_ORDER_FILTERS)}
        isLoading={ordersQuery.isFetching}
      />

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3">Invoice</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Zone</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Due</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Courier</th>
              <th className="p-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {ordersQuery.isLoading && (
              <tr>
                <td colSpan={10} className="p-6 text-center text-muted-foreground">
                  Loading orders…
                </td>
              </tr>
            )}
            {!ordersQuery.isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={10} className="p-6 text-center text-muted-foreground">
                  No orders match these filters.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <Link
                    to="/czp-ops-9f2c/orders/$id"
                    params={{ id: order.id }}
                    className="font-semibold text-primary underline"
                  >
                    {order.invoice_no}
                  </Link>
                </td>
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("en-GB")}
                </td>
                <td className="p-3">
                  {order.customer_name}
                  <span className="block text-xs text-muted-foreground">
                    {order.customer_phone} · {order.city}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {deliveryZoneLabel(order.delivery_zone)}
                </td>
                <td className="p-3 text-right font-semibold">{formatBDT(Number(order.total))}</td>
                <td className="p-3 text-right text-muted-foreground">
                  {formatBDT(Math.max(Number(order.total) - Number(order.advance_paid ?? 0), 0))}
                </td>
                <td className="p-3">
                  {paymentMethodLabel(order.payment_method)}
                  <span className="mt-1 block">
                    <StatusBadge value={order.payment_status} />
                  </span>
                </td>
                <td className="p-3">
                  <StatusBadge value={order.status} />
                </td>
                <td className="p-3">
                  <StatusBadge value={order.courier_status} />
                </td>
                <td className="p-3 text-muted-foreground">{statusLabel(order.order_source)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ManualOrderForm() {
  const queryClient = useQueryClient();
  const submit = useServerFn(createManualOrder);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(newIdempotencyKey);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    addressLine: "",
    city: "",
    deliveryZone: "inside_dhaka",
    productName: "",
    variant: "",
    unitPrice: "",
    quantity: "1",
    discount: "0",
    shipping: "0",
    advancePaid: "0",
    transactionId: "",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "unpaid",
    status: "pending",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: submit,
    onSuccess: (result) => {
      toast.success(`Order ${result.invoiceNo} created`);
      setKey(newIdempotencyKey());
      setForm((f) => ({ ...f, productName: "", unitPrice: "", quantity: "1" }));
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || "Could not create the order."),
  });

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  if (!open) {
    return (
      <Button variant="red" size="touch" className="mt-4" onClick={() => setOpen(true)}>
        New manual order
      </Button>
    );
  }

  return (
    <form
      className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate({
          data: {
            customerName: form.customerName,
            customerPhone: form.customerPhone,
            addressLine: form.addressLine,
            city: form.city,
            deliveryZone: form.deliveryZone as "inside_dhaka",
            notes: form.notes,
            paymentMethod: form.paymentMethod as "cash_on_delivery",
            discount: Number(form.discount) || 0,
            shipping: Number(form.shipping) || 0,
            advancePaid: Number(form.advancePaid) || 0,
            transactionId: form.transactionId,
            paymentStatus: form.paymentStatus as "unpaid",
            status: form.status as "pending",
            idempotencyKey: key,
            items: [
              {
                productName: form.productName,
                variant: form.variant,
                unitPrice: Number(form.unitPrice) || 0,
                quantity: Number(form.quantity) || 1,
              },
            ],
          },
        });
      }}
    >
      <h2 className="font-display text-lg font-bold uppercase sm:col-span-2">Manual order</h2>
      <TextField label="Customer name" value={form.customerName} onChange={set("customerName")} />
      <TextField label="Mobile" value={form.customerPhone} onChange={set("customerPhone")} />
      <TextField label="City" value={form.city} onChange={set("city")} />
      <SelectField
        label="Delivery zone"
        value={form.deliveryZone}
        onChange={set("deliveryZone")}
        options={DELIVERY_ZONES.map((z) => [z.value, z.label] as const)}
      />
      <TextField label="Address" value={form.addressLine} onChange={set("addressLine")} />
      <TextField label="Product" value={form.productName} onChange={set("productName")} />
      <TextField label="Variant / attributes" value={form.variant} onChange={set("variant")} />
      <TextField label="Unit price (৳)" value={form.unitPrice} onChange={set("unitPrice")} />
      <TextField label="Quantity" value={form.quantity} onChange={set("quantity")} />
      <TextField label="Discount (৳)" value={form.discount} onChange={set("discount")} />
      <TextField label="Shipping (৳)" value={form.shipping} onChange={set("shipping")} />
      <TextField label="Advance paid (৳)" value={form.advancePaid} onChange={set("advancePaid")} />
      <TextField label="Transaction ID" value={form.transactionId} onChange={set("transactionId")} />
      <TextField label="Internal note" value={form.notes} onChange={set("notes")} />
      <SelectField
        label="Payment method"
        value={form.paymentMethod}
        onChange={set("paymentMethod")}
        options={PAYMENT_METHODS.map((m) => [m.value, m.label])}
      />
      <SelectField
        label="Payment status"
        value={form.paymentStatus}
        onChange={set("paymentStatus")}
        options={PAYMENT_STATUSES.map((s) => [s, statusLabel(s)])}
      />
      <SelectField
        label="Order status"
        value={form.status}
        onChange={set("status")}
        options={ORDER_STATUSES.map((s) => [s, statusLabel(s)])}
      />
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" variant="red" size="touch" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Create order"}
        </Button>
        <Button type="button" variant="steel" size="touch" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 h-11" />
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
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <Label>{label}</Label>
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