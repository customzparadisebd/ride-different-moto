// ============================================================
// ADMIN ORDER LIST
// Purpose: Filterable, sortable, paginated order list with bulk
//          status updates and CSV export of the filtered result.
// Status: COMPLETED
// Security: Filtering, paging and every write happen in permission
//          checked server functions; the export only contains rows
//          the signed-in account was already allowed to read.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { adminHead } from "@/components/admin/AdminShell";
import {
  EMPTY_ORDER_FILTERS,
  OrderFilterBar,
  type OrderFilters,
} from "@/components/admin/orders/OrderFilterBar";
import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBDT } from "@/lib/format";
import { bulkUpdateOrderStatus, getMyAccess, listOrders } from "@/lib/orders.functions";
import {
  deliveryZoneLabel,
  ORDER_STATUSES,
  paymentMethodLabel,
  statusLabel,
  type OrderStatus,
} from "@/lib/orders.shared";

type SortBy = "created_at" | "total" | "invoice_no";

export const Route = createFileRoute("/_authenticated/czp-ops-9f2c/orders/")({
  head: () => adminHead("Orders — CZP Ops"),
  validateSearch: (search: Record<string, unknown>): { status?: OrderStatus } => {
    const status = String(search["status"] ?? "");
    return ORDER_STATUSES.includes(status as OrderStatus)
      ? { status: status as OrderStatus }
      : {};
  },
  component: AdminOrderList,
});

function AdminOrderList() {
  const { status: initialStatus } = Route.useSearch();
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(listOrders);
  const access = useServerFn(getMyAccess);
  const bulkUpdate = useServerFn(bulkUpdateOrderStatus);

  const [filters, setFilters] = useState<OrderFilters>({
    ...EMPTY_ORDER_FILTERS,
    status: initialStatus ?? "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("processing");

  // Only non-empty filters are sent, so the server-side Zod schema keeps defaults.
  const activeFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "")),
    [filters],
  );

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({}) });
  const ordersQuery = useQuery({
    queryKey: ["admin-orders", activeFilters, page, pageSize, sortBy, sortDir],
    queryFn: () =>
      fetchOrders({ data: { ...activeFilters, page, pageSize, sortBy, sortDir } as never }),
    placeholderData: (previous) => previous,
  });

  const bulkMutation = useMutation({
    mutationFn: bulkUpdate,
    onSuccess: (result) => {
      toast.success(`${result.updated} order(s) updated`);
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not update the orders."),
  });

  const rows = ordersQuery.data?.rows ?? [];
  const totalCount = ordersQuery.data?.count ?? 0;
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
  const canManage = accessQuery.data?.permissions.includes("orders.manage") ?? false;
  const canCreate = accessQuery.data?.permissions.includes("orders.create") ?? false;
  const pageValue = rows.reduce((sum, row) => sum + Number(row.total), 0);

  const applyFilters = (next: OrderFilters) => {
    setFilters(next);
    setPage(1);
    setSelected([]);
  };

  const toggleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
    setPage(1);
  };

  const allOnPageSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id));

  const exportCsv = () => {
    const header = [
      "Invoice",
      "Date",
      "Customer",
      "Phone",
      "City",
      "Zone",
      "Subtotal",
      "Discount",
      "Shipping",
      "Advance paid",
      "Total",
      "Payment method",
      "Payment status",
      "Order status",
      "Courier status",
      "Source",
    ];
    const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const body = rows.map((row) =>
      [
        row.invoice_no,
        new Date(row.created_at).toLocaleString("en-GB"),
        row.customer_name,
        row.customer_phone,
        row.city,
        deliveryZoneLabel(row.delivery_zone),
        row.subtotal,
        row.discount,
        row.shipping,
        row.advance_paid ?? 0,
        row.total,
        paymentMethodLabel(row.payment_method),
        row.payment_status,
        row.status,
        row.courier_status,
        row.order_source,
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob([[header.map(csvCell).join(","), ...body].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `czp-orders-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Orders</h1>
          <p className="text-xs text-muted-foreground">
            {totalCount} order(s) match · {formatBDT(pageValue)} on this page
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="steel" size="touch" onClick={exportCsv} disabled={!rows.length}>
            Export CSV
          </Button>
          {canCreate ? (
            <Button variant="red" size="touch" asChild>
              <Link to="/czp-ops-9f2c/orders/new">New manual order</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <OrderFilterBar
        value={filters}
        onChange={applyFilters}
        onReset={() => applyFilters(EMPTY_ORDER_FILTERS)}
        isLoading={ordersQuery.isFetching}
      />

      {canManage && selected.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-card p-3 shadow-card">
          <span className="text-sm font-semibold">{selected.length} selected</span>
          <select
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value as OrderStatus)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
          <Button
            variant="red"
            size="sm"
            disabled={bulkMutation.isPending}
            onClick={() => bulkMutation.mutate({ data: { orderIds: selected, status: bulkStatus } })}
          >
            {bulkMutation.isPending ? "Updating…" : "Apply status"}
          </Button>
          <Button variant="steel" size="sm" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
            <tr>
              {canManage ? (
                <th className="p-3">
                  <Checkbox
                    checked={allOnPageSelected}
                    onCheckedChange={(checked) =>
                      setSelected(checked ? rows.map((row) => row.id) : [])
                    }
                    aria-label="Select all orders on this page"
                  />
                </th>
              ) : null}
              <SortHeader label="Invoice" column="invoice_no" active={sortBy} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Date" column="created_at" active={sortBy} dir={sortDir} onSort={toggleSort} />
              <th className="p-3">Customer</th>
              <th className="p-3">Zone</th>
              <SortHeader label="Total" column="total" active={sortBy} dir={sortDir} onSort={toggleSort} align="right" />
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
                <td colSpan={12} className="p-6 text-center text-muted-foreground">
                  Loading orders…
                </td>
              </tr>
            )}
            {!ordersQuery.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={12} className="p-6 text-center text-muted-foreground">
                  No orders match these filters.
                </td>
              </tr>
            )}
            {rows.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                {canManage ? (
                  <td className="p-3">
                    <Checkbox
                      checked={selected.includes(order.id)}
                      onCheckedChange={(checked) =>
                        setSelected((current) =>
                          checked
                            ? [...current, order.id]
                            : current.filter((id) => id !== order.id),
                        )
                      }
                      aria-label={`Select order ${order.invoice_no}`}
                    />
                  </td>
                ) : null}
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="steel"
            size="sm"
            disabled={page <= 1 || ordersQuery.isFetching}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="steel"
            size="sm"
            disabled={page >= totalPages || ordersQuery.isFetching}
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

function SortHeader({
  label,
  column,
  active,
  dir,
  onSort,
  align,
}: {
  label: string;
  column: SortBy;
  active: SortBy;
  dir: "asc" | "desc";
  onSort: (column: SortBy) => void;
  align?: "right";
}) {
  return (
    <th className={`p-3 ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="uppercase tracking-wider hover:text-primary"
      >
        {label}
        {active === column ? (dir === "asc" ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
}
