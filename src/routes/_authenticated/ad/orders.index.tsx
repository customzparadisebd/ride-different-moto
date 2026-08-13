// ============================================================
// ADMIN ORDER LIST (redesigned)
// Purpose: Operational order board — status tabs with live counts,
//          professional search/filter area, bulk actions (print,
//          assign, change status, courier), a dense desktop table and
//          stacked order cards on mobile.
// Status: COMPLETED
// Security: Filtering, paging and every write happen in permission
//          checked server functions; exports only contain rows the
//          signed-in account was already allowed to read.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileSpreadsheet, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { OrderActivityDialog } from "@/components/admin/orders/OrderActivityDialog";
import {
  AmountsCell,
  AssignmentCell,
  CourierCell,
  CustomerCell,
  InvoiceCell,
  PaymentCell,
  ProductsCell,
} from "@/components/admin/orders/OrderCells";
import {
  EMPTY_ORDER_FILTERS,
  OrderFilterBar,
  type OrderFilters,
} from "@/components/admin/orders/OrderFilterBar";
import { OrderStatusTabs } from "@/components/admin/orders/OrderStatusTabs";
import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { SteadfastBulkDialog } from "@/components/admin/orders/SteadfastBulkDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBDT } from "@/lib/format";
import { exportOrdersCsv, exportOrdersExcel, printOrders } from "@/lib/orders-export";
import {
  assignOrders,
  bulkUpdateOrderStatus,
  getMyAccess,
  getOrderTabCounts,
  listOrders,
  listOrderStaff,
  markOrdersPrinted,
  setOrderPinned,
  type AdminOrderListRow,
} from "@/lib/orders.functions";
import {
  ORDER_STATUSES,
  statusLabel,
  type OrderStatus,
  type OrderTab,
} from "@/lib/orders.shared";

type SortBy = "created_at" | "total" | "invoice_no";

export const Route = createFileRoute("/_authenticated/ad/orders/")({
  head: () => adminHead("Orders — CZP Ops"),
  validateSearch: (search: Record<string, unknown>): { status?: OrderStatus } => {
    const status = String(search["status"] ?? "");
    return ORDER_STATUSES.includes(status as OrderStatus) ? { status: status as OrderStatus } : {};
  },
  component: AdminOrderList,
});

function AdminOrderList() {
  const { status: initialStatus } = Route.useSearch();
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(listOrders);
  const access = useServerFn(getMyAccess);
  const bulkUpdate = useServerFn(bulkUpdateOrderStatus);
  const fetchCounts = useServerFn(getOrderTabCounts);
  const fetchStaff = useServerFn(listOrderStaff);
  const assign = useServerFn(assignOrders);
  const markPrinted = useServerFn(markOrdersPrinted);
  const pinOrder = useServerFn(setOrderPinned);

  const [filters, setFilters] = useState<OrderFilters>({
    ...EMPTY_ORDER_FILTERS,
    status: initialStatus ?? "",
  });
  const [tab, setTab] = useState<OrderTab>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("processing");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [activityOrder, setActivityOrder] = useState<AdminOrderListRow | null>(null);
  // SEND TO STEADFAST — confirmation modal state
  const [steadfastOpen, setSteadfastOpen] = useState(false);

  const sortDir = filters.sortDir === "asc" ? "asc" : "desc";

  // Only non-empty filters are sent, so the server-side Zod schema keeps defaults.
  const activeFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "")),
    [filters],
  );

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({}) });
  const countsQuery = useQuery({ queryKey: ["admin-order-tab-counts"], queryFn: () => fetchCounts({}) });
  const staffQuery = useQuery({ queryKey: ["admin-order-staff"], queryFn: () => fetchStaff({}) });
  const ordersQuery = useQuery({
    queryKey: ["admin-orders", activeFilters, tab, page, pageSize, sortBy, sortDir],
    queryFn: () =>
      fetchOrders({ data: { ...activeFilters, tab, page, pageSize, sortBy, sortDir } as never }),
    placeholderData: (previous) => previous,
  });

  const refreshOrders = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-order-tab-counts"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  const bulkMutation = useMutation({
    mutationFn: bulkUpdate,
    onSuccess: (result) => {
      toast.success(`${result.updated} order(s) updated`);
      setSelected([]);
      refreshOrders();
    },
    onError: (error: Error) => toast.error(error.message || "Could not update the orders."),
  });

  // BULK ASSIGN USER
  const assignMutation = useMutation({
    mutationFn: assign,
    onSuccess: (result) => {
      toast.success(`${result.updated} order(s) assigned`);
      setSelected([]);
      refreshOrders();
    },
    onError: (error: Error) => toast.error(error.message || "Could not assign the orders."),
  });

  // PIN / UNPIN a single order
  const pinMutation = useMutation({
    mutationFn: pinOrder,
    onSuccess: () => refreshOrders(),
    onError: (error: Error) => toast.error(error.message || "Could not update the pin state."),
  });

  const printMutation = useMutation({ mutationFn: markPrinted, onSuccess: () => refreshOrders() });

  const rows = ordersQuery.data?.rows ?? [];
  const totalCount = ordersQuery.data?.count ?? 0;
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
  const canManage = accessQuery.data?.permissions.includes("orders.manage") ?? false;
  const canCreate = accessQuery.data?.permissions.includes("orders.create") ?? false;
  const canShip = accessQuery.data?.permissions.includes("shipments.create") ?? false;
  const canDelete = accessQuery.data?.permissions.includes("orders.manage") ?? false; // or staffManage
  const canSelect = canManage || canShip;
  const pageValue = rows.reduce((sum, row) => sum + Number(row.total), 0);
  const courierOptions = useMemo(
    () => [...new Set(rows.map((row) => row.courier_name).filter(Boolean) as string[])],
    [rows],
  );
  const selectedRows = rows.filter((row) => selected.includes(row.id));

  const applyFilters = (next: OrderFilters) => {
    setFilters(next);
    setPage(1);
    setSelected([]);
  };

  const applyTab = (next: OrderTab) => {
    setTab(next);
    setPage(1);
    setSelected([]);
  };

  const toggleSort = (column: SortBy) => {
    if (sortBy === column) {
      applyFilters({ ...filters, sortDir: sortDir === "asc" ? "desc" : "asc" });
      return;
    }
    setSortBy(column);
    setPage(1);
  };

  const allOnPageSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id));
  // Only orders without a consignment can be sent (duplicate protection).
  const sendableSelected = selected.filter((id) => {
    const row = rows.find((order) => order.id === id);
    return !row || !row.consignment_id;
  });

  const exportName = `czp-orders-page-${page}`;

  return (
    <section className="mx-auto max-w-[1600px]">
      {/* HEADER — title + top actions (Export, Order Status, Create Order) */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">
            Orders
          </h1>
          <p className="text-xs text-muted-foreground">
            {totalCount} order(s) match · {formatBDT(pageValue)} on this page
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* EXPORT — CSV / Excel / PDF / Print */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="steel" size="touch" disabled={!rows.length}>
                <FileSpreadsheet />
                Export Excel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportOrdersExcel(rows, exportName)}>
                Excel (.xls)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportOrdersCsv(rows, exportName)}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => printOrders(rows, "Orders (PDF)")}>
                PDF (save from print)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => printOrders(rows, "Orders")}>Print</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* ORDER STATUS — jump straight to a status tab */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="steel" size="touch">
                Order Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ORDER_STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => applyFilters({ ...filters, status })}
                >
                  {statusLabel(status)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => applyFilters({ ...filters, status: "" })}>
                All statuses
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canCreate ? (
            <Button variant="red" size="touch" asChild>
              <Link to="/ad/orders/new">
                <Plus />
                Create Order
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {/* STATUS TABS with live counts */}
      <OrderStatusTabs value={tab} counts={countsQuery.data} onChange={applyTab} />

      <OrderFilterBar
        value={filters}
        onChange={applyFilters}
        onReset={() => applyFilters(EMPTY_ORDER_FILTERS)}
        isLoading={ordersQuery.isFetching}
        staff={staffQuery.data ?? []}
        couriers={courierOptions}
      />

      {canSelect && selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-card p-3 shadow-card">
          <span className="text-sm font-semibold">{selected.length} selected</span>
          {/* BULK DELETE / RECYCLE BIN */}
          {canDelete ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={bulkMutation.isPending}
              onClick={() => {
                if (confirm(`Are you sure you want to move ${selected.length} order(s) to the Recycle Bin?`)) {
                  bulkMutation.mutate({ data: { orderIds: selected, status: "cancelled" } });
                }
              }}
            >
              Recycle Bin
            </Button>
          ) : null}
          {/* BULK PRINT */}
          <Button
            variant="steel"
            size="sm"
            onClick={() => {
              printOrders(selectedRows, "Selected orders");
              if (canManage) printMutation.mutate({ data: { orderIds: selected } });
            }}
          >
            Print
          </Button>
          {/* BULK ASSIGN USER */}
          {canManage ? (
            <>
              <select
                value={bulkAssignee}
                onChange={(event) => setBulkAssignee(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Assign to"
              >
                <option value="">Unassign</option>
                {(staffQuery.data ?? []).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.label}
                  </option>
                ))}
              </select>
              <Button
                variant="steel"
                size="sm"
                disabled={assignMutation.isPending}
                onClick={() =>
                  assignMutation.mutate({
                    data: { orderIds: selected, assignedTo: bulkAssignee || null },
                  })
                }
              >
                {assignMutation.isPending ? "Assigning…" : "Assign User"}
              </Button>
            </>
          ) : null}
          {canManage ? (
            <>
          <select
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value as OrderStatus)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Change status to"
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
            onClick={() =>
              bulkMutation.mutate({ data: { orderIds: selected, status: bulkStatus } })
            }
          >
            {bulkMutation.isPending ? "Updating…" : "Change Status"}
          </Button>
            </>
          ) : null}
          {/* SEND TO STEADFAST — bulk action */}
          {canShip ? (
            <Button
              variant="steel"
              size="sm"
              onClick={() => {
                if (sendableSelected.length === 0) {
                  toast.error("All selected orders already have a SteadFast consignment.");
                  return;
                }
                setSteadfastOpen(true);
              }}
            >
              Send to SteadFast ({sendableSelected.length})
            </Button>
          ) : null}
          <Button variant="steel" size="sm" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      ) : null}

      <SteadfastBulkDialog
        open={steadfastOpen}
        orderIds={sendableSelected}
        onOpenChange={setSteadfastOpen}
        onFinished={(successIds) =>
          // Failed orders stay selected so they can be retried.
          setSelected((current) => current.filter((id) => !successIds.includes(id)))
        }
      />

      <OrderActivityDialog
        order={activityOrder}
        onOpenChange={(open) => (open ? null : setActivityOrder(null))}
      />

      {/* DESKTOP TABLE — full column layout */}
      <div className="mt-3 hidden overflow-x-auto rounded-xl border border-border bg-card shadow-card lg:block">
        <table className="w-full min-w-[1500px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
            <tr>
              {canSelect ? (
                <th className="p-2.5">
                  <Checkbox
                    checked={allOnPageSelected}
                    onCheckedChange={(checked) =>
                      setSelected(checked ? rows.map((row) => row.id) : [])
                    }
                    aria-label="Select all orders on this page"
                  />
                </th>
              ) : null}
              <th className="p-2.5">SL</th>
              <SortHeader
                label="Invoice No"
                column="invoice_no"
                active={sortBy}
                dir={sortDir}
                onSort={toggleSort}
              />
              <th className="p-2.5">Placed &amp; Assigned</th>
              <SortHeader
                label="Date & Time"
                column="created_at"
                active={sortBy}
                dir={sortDir}
                onSort={toggleSort}
              />
              <th className="p-2.5">Customer</th>
              <th className="p-2.5">Products</th>
              <th className="p-2.5">Payment Info</th>
              <th className="p-2.5">Courier</th>
              <SortHeader
                label="Amounts"
                column="total"
                active={sortBy}
                dir={sortDir}
                onSort={toggleSort}
              />
              <th className="p-2.5">Status</th>
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
            {rows.map((order, index) => (
              <tr
                key={order.id}
                className={`border-b border-border align-top last:border-0 ${
                  order.is_pinned ? "bg-primary/5" : ""
                }`}
              >
                {canSelect ? (
                  <td className="p-2.5">
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
                <td className="p-2.5 text-xs text-muted-foreground">
                  {(page - 1) * pageSize + index + 1}
                </td>
                <td className="p-2.5">
                  <InvoiceCell
                    order={order}
                    canManage={canManage}
                    onActivity={() => setActivityOrder(order)}
                    onTogglePin={() =>
                      pinMutation.mutate({
                        data: { orderId: order.id, pinned: !order.is_pinned },
                      })
                    }
                  />
                </td>
                <td className="p-2.5">
                  <AssignmentCell order={order} />
                </td>
                <td className="whitespace-nowrap p-2.5 text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("en-GB")}
                </td>
                <td className="min-w-[240px] p-2.5">
                  <CustomerCell order={order} />
                </td>
                <td className="min-w-[220px] p-2.5">
                  <ProductsCell order={order} />
                </td>
                <td className="p-2.5">
                  <PaymentCell order={order} />
                </td>
                <td className="p-2.5">
                  <CourierCell order={order} />
                </td>
                <td className="min-w-[170px] p-2.5">
                  <AmountsCell order={order} />
                </td>
                <td className="p-2.5">
                  <StatusBadge value={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE / TABLET — stacked order cards with the same information */}
      <div className="mt-3 space-y-3 lg:hidden">
        {ordersQuery.isLoading ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Loading orders…
          </p>
        ) : null}
        {!ordersQuery.isLoading && rows.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No orders match these filters.
          </p>
        ) : null}
        {rows.map((order, index) => (
          <article
            key={order.id}
            className={`rounded-xl border border-border bg-card p-3 shadow-card ${
              order.is_pinned ? "border-primary/50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                {canSelect ? (
                  <Checkbox
                    className="mt-1 shrink-0"
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
                ) : null}
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    #{(page - 1) * pageSize + index + 1}
                  </span>
                  <InvoiceCell
                    order={order}
                    canManage={canManage}
                    onActivity={() => setActivityOrder(order)}
                    onTogglePin={() =>
                      pinMutation.mutate({
                        data: { orderId: order.id, pinned: !order.is_pinned },
                      })
                    }
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <StatusBadge value={order.status} />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("en-GB")}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <CustomerCell order={order} />
              <ProductsCell order={order} />
              <PaymentCell order={order} />
              <CourierCell order={order} />
              <AmountsCell order={order} />
              <AssignmentCell order={order} />
            </div>
          </article>
        ))}
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
