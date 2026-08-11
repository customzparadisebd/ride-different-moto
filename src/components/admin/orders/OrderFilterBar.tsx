import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELIVERY_ZONES, ORDER_STATUSES, PAYMENT_STATUSES, statusLabel } from "@/lib/orders.shared";

export type OrderFilters = {
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  deliveryZone: string;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_ORDER_FILTERS: OrderFilters = {
  invoiceNo: "",
  customerName: "",
  customerPhone: "",
  status: "",
  paymentStatus: "",
  deliveryZone: "",
  dateFrom: "",
  dateTo: "",
};

/** Filter bar for the admin order list. Values are applied server-side. */
export function OrderFilterBar({
  value,
  onChange,
  onReset,
  isLoading,
}: {
  value: OrderFilters;
  onChange: (next: OrderFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}) {
  const set = (field: keyof OrderFilters) => (next: string) =>
    onChange({ ...value, [field]: next });

  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Order ID / Invoice">
        <Input
          value={value.invoiceNo}
          onChange={(e) => set("invoiceNo")(e.target.value)}
          placeholder="CZP-2601-0001"
          className="h-11"
        />
      </Field>
      <Field label="Customer name">
        <Input
          value={value.customerName}
          onChange={(e) => set("customerName")(e.target.value)}
          placeholder="Name"
          className="h-11"
        />
      </Field>
      <Field label="Phone">
        <Input
          value={value.customerPhone}
          onChange={(e) => set("customerPhone")(e.target.value)}
          placeholder="01XXXXXXXXX"
          inputMode="tel"
          className="h-11"
        />
      </Field>
      <Field label="Delivery zone">
        <Select value={value.deliveryZone} onChange={set("deliveryZone")} placeholder="All zones">
          {DELIVERY_ZONES.map((zone) => (
            <option key={zone.value} value={zone.value}>
              {zone.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Order status">
        <Select value={value.status} onChange={set("status")} placeholder="All statuses">
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Payment status">
        <Select
          value={value.paymentStatus}
          onChange={set("paymentStatus")}
          placeholder="All payments"
        >
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="From date">
        <Input
          type="date"
          value={value.dateFrom}
          onChange={(e) => set("dateFrom")(e.target.value)}
          className="h-11"
        />
      </Field>
      <Field label="To date">
        <Input
          type="date"
          value={value.dateTo}
          onChange={(e) => set("dateTo")(e.target.value)}
          className="h-11"
        />
      </Field>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="button" variant="steel" size="touch" onClick={onReset} disabled={isLoading}>
          Reset filters
        </Button>
        {isLoading ? (
          <span className="self-center text-xs text-muted-foreground">Filtering…</span>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}
