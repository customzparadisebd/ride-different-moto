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
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  source: string;
  courier: string;
  deliveryZone: string;
  assignedTo: string;
  createdBy: string;
  productCategory: string;
  productId: string;
  steadfastStatus: "submitted" | "successful" | "failed" | "not_submitted" | "";
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
  orderId: "",
  status: "",
  paymentStatus: "",
  paymentMethod: "",
  source: "",
  courier: "",
  deliveryZone: "",
  assignedTo: "",
  createdBy: "",
  productCategory: "",
  productId: "",
  steadfastStatus: "",
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

/** Subtle, professional accent colours for each status pill (visual only). */
const STATUS_TABS: { value: string; label: string; accent: string }[] = [
  { value: "all", label: "All", accent: "" },
  {
    value: "confirmed",
    label: "Confirmed",
    accent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "pending",
    label: "Pending",
    accent: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    value: "processing",
    label: "Processing",
    accent: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    value: "shipped",
    label: "Shipped",
    accent: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    value: "delivered",
    label: "Delivered",
    accent: "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    value: "completed",
    label: "Completed",
    accent: "border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-400",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    accent: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    value: "returned",
    label: "Returned",
    accent: "border-orange-700/30 bg-orange-700/10 text-orange-700 dark:text-orange-400",
  },
  {
    value: "new",
    label: "New",
    accent: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    value: "duplicate",
    label: "Duplicate",
    accent: "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
];

/** Filter bar for the admin order list. Values are applied server-side. */
export function OrderFilterBar({
  value,
  onChange,
  onReset,
  onTabChange,
  activeTab,
  isLoading,
  staff = [],
  couriers = [],
  counts,
}: {
  value: OrderFilters;
  onChange: (next: OrderFilters) => void;
  onReset: () => void;
  onTabChange?: (tab: any) => void;
  activeTab?: string;
  isLoading?: boolean;
  staff?: { id: string; label: string }[];
  couriers?: string[];
  counts?: Record<string, number> | undefined;
}) {
  const [open, setOpen] = useState(false);
  const set = (field: keyof OrderFilters) => (next: string) =>
    onChange({ ...value, [field]: next });

  const QUICK_FILTERS = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last_7_days", label: "Last 7 Days" },
    { value: "this_month", label: "This Month" },
    { value: "today_shift", label: "Today 8AM - 8PM" },
  ];

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm">
      {/* STATUS TABS — modern pills with live counts */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Status Tabs:
        </span>
        {STATUS_TABS.map((tab) => {
          const active = activeTab === tab.value;
          const count = counts?.[tab.value] ?? 0;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange?.(tab.value as any)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : `${tab.accent || "border-border bg-muted/40 text-muted-foreground"} hover:brightness-110`
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-[1px] text-[10px] font-bold tabular-nums ${
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background/70"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* DATE FILTERS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Date Filters:
        </span>
        {QUICK_FILTERS.map((q) => (
          <button
            key={q.value}
            type="button"
            onClick={() => onTabChange?.(q.value as any)}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              activeTab === q.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {q.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onReset}
          className="ml-auto rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Reset All
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* SEARCH AREA */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.search}
            onChange={(e) => set("search")(e.target.value)}
            placeholder="Ex: name, number, invoice"
            className="h-10 rounded-full border-border/80 pl-9 text-sm shadow-sm transition-colors focus-visible:border-primary/60"
            aria-label="Search orders"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={value.sortDir}
            onChange={set("sortDir")}
            placeholder="Sort"
            allowEmpty={false}
            className="h-10 w-[130px] rounded-full px-4"
          >
            <option value="desc">Latest first</option>
            <option value="asc">Oldest first</option>
          </Select>

          <Button
            type="button"
            variant={open ? "red" : "secondary"}
            size="sm"
            className="h-10 rounded-full border border-border px-4"
            onClick={() => setOpen((current) => !current)}
          >
            <SlidersHorizontal className="mr-2 size-3.5" />
            {open ? "Hide Advanced" : "Advanced Filters"}
          </Button>
        </div>
      </div>



      {/* ADVANCED FILTERS */}
      {open ? (
        <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Invoice No">
            <Input
              value={value.invoiceNo}
              onChange={(e) => set("invoiceNo")(e.target.value)}
              placeholder="Ex: CZP-2601-0001"
              className="h-9"
            />
          </Field>
          <Field label="Order ID">
            <Input
              value={value.orderId}
              onChange={(e) => set("orderId")(e.target.value)}
              placeholder="UUID"
              className="h-9"
            />
          </Field>
          <Field label="Customer Name">
            <Input
              value={value.customerName}
              onChange={(e) => set("customerName")(e.target.value)}
              placeholder="Name"
              className="h-9"
            />
          </Field>
          <Field label="Phone Number">
            <Input
              value={value.customerPhone}
              onChange={(e) => set("customerPhone")(e.target.value)}
              placeholder="01XXXXXXXXX"
              inputMode="tel"
              className="h-9"
            />
          </Field>
          <Field label="Order Status">
            <Select value={value.status} onChange={set("status")} placeholder="All Statuses" className="h-9">
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment Status">
            <Select
              value={value.paymentStatus}
              onChange={set("paymentStatus")}
              placeholder="All Payments"
              className="h-9"
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment Method">
            <Select
              value={value.paymentMethod}
              onChange={set("paymentMethod")}
              placeholder="All Methods"
              className="h-9"
            >
              <option value="cash_on_delivery">Cash on Delivery</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="bank_transfer">Bank Transfer</option>
            </Select>
          </Field>
          <Field label="SteadFast Status">
            <Select
              value={value.steadfastStatus}
              onChange={(v) => set("steadfastStatus")(v as any)}
              placeholder="All Status"
              className="h-9"
            >
              <option value="submitted">Submitted</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
              <option value="not_submitted">Not Submitted</option>
            </Select>
          </Field>
          <Field label="Assigned Staff">
            <Select value={value.assignedTo} onChange={set("assignedTo")} placeholder="Anyone" className="h-9">
              <option value="none">Unassigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Created By">
            <Select value={value.createdBy} onChange={set("createdBy")} placeholder="Anyone" className="h-9">
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Order Source">
            <Select value={value.source} onChange={set("source")} placeholder="All Sources" className="h-9">
              {ORDER_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Courier Name">
            <Select value={value.courier} onChange={set("courier")} placeholder="All Couriers" className="h-9">
              {couriers.map((courier) => (
                <option key={courier} value={courier}>
                  {courier}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Delivery Zone">
            <Select
              value={value.deliveryZone}
              onChange={set("deliveryZone")}
              placeholder="All Zones"
              className="h-9"
            >
              {DELIVERY_ZONES.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Product Category">
             <Select value={value.productCategory} onChange={set("productCategory")} placeholder="All Categories" className="h-9">
               <option value="graphics">Graphics</option>
               <option value="lighting">Lighting</option>
               <option value="seat">Seat</option>
               <option value="exhaust">Exhaust</option>
               <option value="handlebar">Handlebar</option>
               <option value="body-kit">Body Kit</option>
               <option value="accessories">Accessories</option>
             </Select>
          </Field>
          <Field label="Date Range">
            <div className="flex gap-1 items-center">
              <Input
                type="date"
                value={value.dateFrom}
                onChange={(e) => set("dateFrom")(e.target.value)}
                className="h-9 text-xs"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={value.dateTo}
                onChange={(e) => set("dateTo")(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </Field>
          <Field label="Pinned State">
            <Select value={value.pinned} onChange={set("pinned")} placeholder="All Orders" className="h-9">
              <option value="pinned">Pinned Only</option>
              <option value="unpinned">Unpinned Only</option>
            </Select>
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
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  children: React.ReactNode;
  allowEmpty?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className ?? ""}`}
    >
      {allowEmpty ? <option value="">{placeholder}</option> : null}
      {children}
    </select>
  );
}
