// ============================================================
// RECYCLE BIN
// Purpose: Recover products, customers and orders that were deleted by
//          mistake, and let an Admin/Super Admin permanently destroy
//          records — one by one or in bulk with checkboxes.
// Status: COMPLETED
// Security: Restore needs the matching manage permission. Permanent
//          delete is Admin/Super Admin only and requires typing the
//          short word DELETE. Everything is audited.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBDT } from "@/lib/format";
import { getMyAccess, listOrders } from "@/lib/orders.functions";
import {
  bulkPurgeOrders,
  bulkRestoreOrders,
  purgeOrder,
  restoreOrder,
} from "@/lib/orders-recycle.functions";
import {
  bulkPurgeProducts,
  bulkRestoreProducts,
  listProducts,
  purgeProduct,
  restoreProduct,
} from "@/lib/products.functions";
import {
  bulkPurgeCustomers,
  bulkRestoreCustomers,
  listAdminCustomers,
  purgeCustomer,
  restoreCustomer,
} from "@/lib/customers.functions";

export const Route = createFileRoute("/_authenticated/ad/recycle-bin")({
  head: () => ({
    meta: [
      { title: "Recycle Bin — CZP Ops" },
      { property: "og:title", content: "Recycle Bin — CZP Ops" },
      { name: "description", content: "Customz Paradise BD Admin Panel" },
    ],
  }),
  component: RecycleBin,
});

type Tab = "products" | "orders" | "customers";

/** Asks for the short confirmation word. Returns null when cancelled. */
function askConfirm(label: string): string | null {
  const typed = window.prompt(`${label}\nType DELETE to confirm:`, "");
  if (typed === null) return null;
  const clean = typed.trim().toUpperCase();
  if (clean !== "DELETE" && clean !== "CONFIRM") {
    toast.error('Type "DELETE" to confirm.');
    return null;
  }
  return clean;
}

function RecycleBin() {
  const queryClient = useQueryClient();
  const fetchAccess = useServerFn(getMyAccess);
  const fetchProducts = useServerFn(listProducts);
  const fetchOrders = useServerFn(listOrders);
  const restoreProductFn = useServerFn(restoreProduct);
  const purgeProductFn = useServerFn(purgeProduct);
  const bulkRestoreProductsFn = useServerFn(bulkRestoreProducts);
  const bulkPurgeProductsFn = useServerFn(bulkPurgeProducts);
  const restoreOrderFn = useServerFn(restoreOrder);
  const purgeOrderFn = useServerFn(purgeOrder);
  const bulkPurgeOrdersFn = useServerFn(bulkPurgeOrders);
  const bulkRestoreOrdersFn = useServerFn(bulkRestoreOrders);
  const fetchCustomers = useServerFn(listAdminCustomers);
  const restoreCustomerFn = useServerFn(restoreCustomer);
  const purgeCustomerFn = useServerFn(purgeCustomer);
  const bulkRestoreCustomersFn = useServerFn(bulkRestoreCustomers);
  const bulkPurgeCustomersFn = useServerFn(bulkPurgeCustomers);

  const [tab, setTab] = useState<Tab>("products");
  const [selected, setSelected] = useState<Record<Tab, string[]>>({
    products: [],
    orders: [],
    customers: [],
  });

  const selectedIds = selected[tab];
  const clearSelection = (which: Tab = tab) =>
    setSelected((prev) => ({ ...prev, [which]: [] }));
  const toggleOne = (id: string) =>
    setSelected((prev) => ({
      ...prev,
      [tab]: prev[tab].includes(id) ? prev[tab].filter((x) => x !== id) : [...prev[tab], id],
    }));
  const toggleAll = (ids: string[]) =>
    setSelected((prev) => ({
      ...prev,
      [tab]: prev[tab].length === ids.length ? [] : ids,
    }));

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => fetchAccess({ data: undefined }) });
  const isSuperAdmin = accessQuery.data?.isSuperAdmin ?? false;
  // Permanent deletion is allowed for Admin and Super Admin only.
  const canPurge = isSuperAdmin || (accessQuery.data?.roles ?? []).includes("admin");
  const canManageProducts = accessQuery.data?.permissions.includes("products.manage") ?? false;
  const canManageOrders = accessQuery.data?.permissions.includes("orders.manage") ?? false;

  const productsQuery = useQuery({
    queryKey: ["admin-recycle-bin", "products"],
    queryFn: () => fetchProducts({ data: { deleted: true, pageSize: 500 } } as never),
  });
  const ordersQuery = useQuery({
    queryKey: ["admin-recycle-bin", "orders"],
    queryFn: () => fetchOrders({ data: { deleted: true, pageSize: 500 } } as never),
  });
  const customersQuery = useQuery({
    queryKey: ["admin-recycle-bin", "customers"],
    queryFn: () => fetchCustomers({ data: { deleted: true, pageSize: 100 } } as never),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-recycle-bin"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
  };
  const onError = (error: Error) => toast.error(error.message || "That action failed.");

  const restoreProductMutation = useMutation({
    mutationFn: restoreProductFn,
    onSuccess: () => {
      toast.success("Product restored");
      refresh();
    },
    onError,
  });
  const purgeProductMutation = useMutation({
    mutationFn: purgeProductFn,
    onSuccess: () => {
      toast.success("Product permanently deleted");
      refresh();
    },
    onError,
  });
  const bulkRestoreProductsMutation = useMutation({
    mutationFn: bulkRestoreProductsFn,
    onSuccess: (result: { restored: number }) => {
      toast.success(`${result.restored} product(s) restored`);
      clearSelection("products");
      refresh();
    },
    onError,
  });
  const bulkPurgeProductsMutation = useMutation({
    mutationFn: bulkPurgeProductsFn,
    onSuccess: (result: { purged: number }) => {
      toast.success(`${result.purged} product(s) permanently deleted`);
      clearSelection("products");
      refresh();
    },
    onError,
  });
  const restoreOrderMutation = useMutation({
    mutationFn: restoreOrderFn,
    onSuccess: () => {
      toast.success("Order restored");
      refresh();
    },
    onError,
  });
  const purgeOrderMutation = useMutation({
    mutationFn: purgeOrderFn,
    onSuccess: () => {
      toast.success("Order permanently deleted");
      refresh();
    },
    onError,
  });
  const bulkRestoreOrdersMutation = useMutation({
    mutationFn: bulkRestoreOrdersFn,
    onSuccess: (result: { restored: number }) => {
      toast.success(`${result.restored} order(s) restored`);
      clearSelection("orders");
      refresh();
    },
    onError,
  });
  const bulkPurgeOrdersMutation = useMutation({
    mutationFn: bulkPurgeOrdersFn,
    onSuccess: (result) => {
      toast.success(`${result.purged} order(s) permanently deleted`);
      clearSelection("orders");
      refresh();
    },
    onError,
  });
  const restoreCustomerMutation = useMutation({
    mutationFn: restoreCustomerFn,
    onSuccess: () => {
      toast.success("Customer restored");
      refresh();
    },
    onError,
  });
  const purgeCustomerMutation = useMutation({
    mutationFn: purgeCustomerFn,
    onSuccess: () => {
      toast.success("Customer permanently deleted");
      refresh();
    },
    onError,
  });
  const bulkRestoreCustomersMutation = useMutation({
    mutationFn: bulkRestoreCustomersFn,
    onSuccess: (result: { restored: number }) => {
      toast.success(`${result.restored} customer(s) restored`);
      clearSelection("customers");
      refresh();
    },
    onError,
  });
  const bulkPurgeCustomersMutation = useMutation({
    mutationFn: bulkPurgeCustomersFn,
    onSuccess: (result: { purged: number }) => {
      toast.success(`${result.purged} customer(s) permanently deleted`);
      clearSelection("customers");
      refresh();
    },
    onError,
  });

  const productRows = (productsQuery.data?.rows ?? []) as unknown as Array<{
    id: string;
    name: string;
    sku: string;
    price: number | string;
    deleted_at: string | null;
    delete_reason: string | null;
  }>;
  const orderRows = ordersQuery.data?.rows ?? [];
  const customerRows = (customersQuery.data?.rows ?? []) as any[];

  const currentIds =
    tab === "products"
      ? productRows.map((row) => row.id)
      : tab === "orders"
        ? orderRows.map((row) => row.id)
        : customerRows.map((row) => row.id);

  const canRestoreCurrent = tab === "products" ? canManageProducts : canManageOrders;
  const bulkBusy =
    bulkRestoreProductsMutation.isPending ||
    bulkPurgeProductsMutation.isPending ||
    bulkRestoreOrdersMutation.isPending ||
    bulkPurgeOrdersMutation.isPending ||
    bulkRestoreCustomersMutation.isPending ||
    bulkPurgeCustomersMutation.isPending;

  const runBulkRestore = () => {
    if (selectedIds.length === 0) return;
    if (tab === "products") bulkRestoreProductsMutation.mutate({ data: { ids: selectedIds } });
    else if (tab === "orders") bulkRestoreOrdersMutation.mutate({ data: { orderIds: selectedIds } });
    else bulkRestoreCustomersMutation.mutate({ data: { ids: selectedIds } });
  };
  const runBulkPurge = () => {
    if (selectedIds.length === 0) return;
    const confirm = askConfirm(
      `Permanently delete ${selectedIds.length} selected record(s)? This cannot be undone.`,
    );
    if (!confirm) return;
    if (tab === "products")
      bulkPurgeProductsMutation.mutate({ data: { ids: selectedIds, confirm } });
    else if (tab === "orders")
      bulkPurgeOrdersMutation.mutate({ data: { orderIds: selectedIds, confirm } });
    else bulkPurgeCustomersMutation.mutate({ data: { ids: selectedIds, confirm } });
  };

  const selectAllChecked = currentIds.length > 0 && selectedIds.length === currentIds.length;

  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Recycle Bin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Deleted records stay here so nothing is lost by accident. Tick the rows to restore or
        permanently delete them in bulk — permanent delete only asks for the word DELETE.
      </p>

      <div className="mt-4 flex gap-2">
        <Button
          variant={tab === "products" ? "red" : "steel"}
          size="sm"
          onClick={() => setTab("products")}
        >
          Products ({productRows.length})
        </Button>
        <Button
          variant={tab === "customers" ? "red" : "steel"}
          size="sm"
          onClick={() => setTab("customers")}
        >
          Customers ({customerRows.length})
        </Button>
        <Button
          variant={tab === "orders" ? "red" : "steel"}
          size="sm"
          onClick={() => setTab("orders")}
        >
          Orders ({orderRows.length})
        </Button>
      </div>

      {/* Bulk action bar — works for every tab */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
        <span className="text-sm text-muted-foreground">
          {selectedIds.length > 0
            ? `${selectedIds.length} selected`
            : currentIds.length > 0
              ? "Select rows to restore or delete in bulk"
              : "Nothing in this bin"}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="steel"
            size="sm"
            disabled={currentIds.length === 0}
            onClick={() => toggleAll(currentIds)}
          >
            {selectAllChecked ? "Clear selection" : "Select all"}
          </Button>
          <Button
            variant="steel"
            size="sm"
            disabled={selectedIds.length === 0 || !canRestoreCurrent || bulkBusy}
            onClick={runBulkRestore}
          >
            Restore selected
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedIds.length === 0 || !canPurge || bulkBusy}
            onClick={runBulkPurge}
          >
            Delete selected forever
          </Button>
        </div>
      </div>

      {tab === "products" ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3">
                  <Checkbox
                    checked={selectAllChecked}
                    onCheckedChange={() => toggleAll(currentIds)}
                    aria-label="Select all deleted products"
                  />
                </th>
                <th className="p-3">Product</th>
                <th className="p-3">SKU</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3">Deleted</th>
                <th className="p-3">Reason</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!productsQuery.isLoading && productRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No deleted products.
                  </td>
                </tr>
              )}
              {productRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onCheckedChange={() => toggleOne(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <td className="p-3 font-semibold">{row.name}</td>
                  <td className="p-3 text-muted-foreground">{row.sku}</td>
                  <td className="p-3 text-right">{formatBDT(Number(row.price))}</td>
                  <td className="p-3 text-muted-foreground">
                    {row.deleted_at ? new Date(row.deleted_at).toLocaleString("en-GB") : "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">{row.delete_reason || "—"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="steel"
                        size="sm"
                        disabled={!canManageProducts || restoreProductMutation.isPending}
                        onClick={() => restoreProductMutation.mutate({ data: { id: row.id } })}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!canPurge || purgeProductMutation.isPending}
                        onClick={() => {
                          const confirm = askConfirm(
                            `Permanently delete "${row.name}"? This cannot be undone.`,
                          );
                          if (!confirm) return;
                          purgeProductMutation.mutate({ data: { id: row.id, confirm } });
                        }}
                      >
                        Delete forever
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "orders" ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3">
                  <Checkbox
                    checked={selectAllChecked}
                    onCheckedChange={() => toggleAll(currentIds)}
                    aria-label="Select all deleted orders"
                  />
                </th>
                <th className="p-3">Invoice</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Phone</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Placed</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!ordersQuery.isLoading && orderRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No deleted orders.
                  </td>
                </tr>
              )}
              {orderRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onCheckedChange={() => toggleOne(row.id)}
                      aria-label={`Select ${row.invoice_no}`}
                    />
                  </td>
                  <td className="p-3 font-mono text-xs font-semibold">{row.invoice_no}</td>
                  <td className="p-3">{row.customer_name}</td>
                  <td className="p-3 text-muted-foreground">{row.customer_phone}</td>
                  <td className="p-3 text-right">{formatBDT(Number(row.total))}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(row.created_at).toLocaleString("en-GB")}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="steel"
                        size="sm"
                        disabled={!canManageOrders || restoreOrderMutation.isPending}
                        onClick={() => restoreOrderMutation.mutate({ data: { id: row.id } })}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!canPurge || purgeOrderMutation.isPending}
                        onClick={() => {
                          const confirm = askConfirm(
                            `Permanently delete order ${row.invoice_no}? This cannot be undone.`,
                          );
                          if (!confirm) return;
                          purgeOrderMutation.mutate({ data: { id: row.id, confirm } });
                        }}
                      >
                        Delete forever
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3">
                  <Checkbox
                    checked={selectAllChecked}
                    onCheckedChange={() => toggleAll(currentIds)}
                    aria-label="Select all deleted customers"
                  />
                </th>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">City</th>
                <th className="p-3 text-right">Orders</th>
                <th className="p-3 text-right">Spent</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customersQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!customersQuery.isLoading && customerRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No deleted customers.
                  </td>
                </tr>
              )}
              {customerRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onCheckedChange={() => toggleOne(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <td className="p-3 font-semibold">{row.name}</td>
                  <td className="p-3 text-muted-foreground">{row.phone}</td>
                  <td className="p-3 text-muted-foreground">{row.city || "—"}</td>
                  <td className="p-3 text-right">{row.total_orders || 0}</td>
                  <td className="p-3 text-right font-semibold">
                    {formatBDT(Number(row.lifetime_value || 0))}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="steel"
                        size="sm"
                        disabled={!canManageOrders || restoreCustomerMutation.isPending}
                        onClick={() => restoreCustomerMutation.mutate({ data: { id: row.id } })}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!isSuperAdmin || purgeCustomerMutation.isPending}
                        onClick={() => {
                          const confirm = askConfirm(
                            `Permanently delete customer ${row.name}? This cannot be undone.`,
                          );
                          if (!confirm) return;
                          purgeCustomerMutation.mutate({ data: { id: row.id, confirm } });
                        }}
                      >
                        Delete forever
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {canPurge
          ? "You are an Admin/Super Admin: permanent deletion is available and every action is written to the audit log."
          : "Permanent deletion is limited to Admin and Super Admin accounts."}
      </p>
    </section>
  );
}
