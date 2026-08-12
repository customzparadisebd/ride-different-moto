// ============================================================
// ORDER SEARCH + FILTER BAR
// Purpose: Professional search/filter area for the admin order list.
//          Search covers customer name, phone and invoice number; the
//          advanced row adds assignment, source, courier, zone, dates,
//          pinned state and sort direction. Everything is applied
//          server-side by listOrders.
// ============================================================
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELIVERY_ZONES, ORDER_STATUSES, PAYMENT_STATUSES, statusLabel } from "@/lib/orders.shared";

export type OrderFilters = {
  search: string;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  source: string;
  courier: string;
  deliveryZone: string;
  assignedTo: string;
  createdBy: string;
  pinned: string;
  dateFrom: string;
  dateTo: string;
  sortDir: string;
};

export const EMPTY_ORDER_FILTERS: OrderFilters = {
  search: "",
  invoiceNo: "",
  customerName: "",
  customerPhone: "",
  status: "",
  paymentStatus: "",
  source: "",
  courier: "",
  deliveryZone: "",
  assignedTo: "",
  createdBy: "",
  pinned: "",
  dateFrom: "",
  dateTo: "",
  sortDir: "desc",
};

/** Order sources currently written by the app. */
const ORDER_SOURCES = [
  { value: "website", label: "Website" },
  { value: "admin", label: "Admin / Manual" },
  // TODO: "page" (Facebook page) orders are not created by any flow yet.
  { value: "page", label: "Page" },
];

/** Filter bar for the admin order list. Values are applied server-side. */
export function OrderFilterBar({
  value,
  onChange,
  onReset,
  isLoading,
  staff = [],
  couriers = [],
}: {
  value: OrderFilters;
  onChange: (next: OrderFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
  staff?: { id: string; label: string }[];
  couriers?: string[];
}) {
  const [open, setOpen] = useState(false);
  const set = (field: keyof OrderFilters) => (next: string) =>
    onChange({ ...value, [field]: next });

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-card">
      {/* SEARCH ROW — always visible */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex">
        <div className="relative min-w-0 sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.search}
            onChange={(e) => set("search")(e.target.value)}
            placeholder="Search customer name, phone or invoice no…"
            className="h-11 pl-9"
            aria-label="Search orders"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            value={value.sortDir}
            onChange={set("sortDir")}
            placeholder="Sort"
            allowEmpty={false}
          >
            <option value="desc">Latest first</option>
            <option value="asc">Oldest first</option>
          </Select>
          <Button
            type="button"
            variant="steel"
            size="touch"
            onClick={() => setOpen((current) => !current)}
          >
            <SlidersHorizontal />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>

      {/* ADVANCED FILTERS */}
      {open ? (
        <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <Field label="Assigned user">
            <Select value={value.assignedTo} onChange={set("assignedTo")} placeholder="Anyone">
              <option value="none">Unassigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Created by">
            <Select value={value.createdBy} onChange={set("createdBy")} placeholder="Anyone">
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
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
          <Field label="Source">
            <Select value={value.source} onChange={set("source")} placeholder="All sources">
              {ORDER_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Courier">
            <Select value={value.courier} onChange={set("courier")} placeholder="All couriers">
              {couriers.map((courier) => (
                <option key={courier} value={courier}>
                  {courier}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Delivery zone">
            <Select
              value={value.deliveryZone}
              onChange={set("deliveryZone")}
              placeholder="All zones"
            >
              {DELIVERY_ZONES.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pinned">
            <Select value={value.pinned} onChange={set("pinned")} placeholder="All orders">
              <option value="pinned">Pinned only</option>
              <option value="unpinned">Unpinned only</option>
            </Select>
          </Field>
          <Field label="Start date">
            <Input
              type="date"
              value={value.dateFrom}
              onChange={(e) => set("dateFrom")(e.target.value)}
              className="h-11"
            />
          </Field>
          <Field label="End date">
            <Input
              type="date"
              value={value.dateTo}
              onChange={(e) => set("dateTo")(e.target.value)}
              className="h-11"
            />
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button
              type="button"
              variant="steel"
              size="touch"
              onClick={onReset}
              disabled={isLoading}
            >
              Reset filters
            </Button>
            {isLoading ? (
              <span className="self-center text-xs text-muted-foreground">Filtering…</span>
            ) : null}
          </div>
        </div>
      ) : null}
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
  allowEmpty = true,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  children: React.ReactNode;
  allowEmpty?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
    >
      {allowEmpty ? <option value="">{placeholder}</option> : null}
      {children}
    </select>
  );
}
