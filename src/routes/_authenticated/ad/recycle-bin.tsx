// ============================================================
// RECYCLE BIN
// Purpose: Recover products and orders that were deleted by mistake,
//          and let a Super Admin permanently destroy a record.
// Status: COMPLETED
// Security: Restore needs orders.manage / products.manage. Permanent
//          delete is Super Admin only and requires typing the exact
//          product name or invoice number. Everything is audited.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { getMyAccess, listOrders } from "@/lib/orders.functions";
import { purgeOrder, restoreOrder } from "@/lib/orders-recycle.functions";
import { listProducts, purgeProduct, restoreProduct } from "@/lib/products.functions";
import { listAdminCustomers, restoreCustomer, purgeCustomer } from "@/lib/customers.functions";

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

function RecycleBin() {
  const queryClient = useQueryClient();
  const fetchAccess = useServerFn(getMyAccess);
  const fetchProducts = useServerFn(listProducts);
  const fetchOrders = useServerFn(listOrders);
  const restoreProductFn = useServerFn(restoreProduct);
  const purgeProductFn = useServerFn(purgeProduct);
  const restoreOrderFn = useServerFn(restoreOrder);
  const purgeOrderFn = useServerFn(purgeOrder);
  const fetchCustomers = useServerFn(listAdminCustomers);
  const restoreCustomerFn = useServerFn(restoreCustomer);
  const purgeCustomerFn = useServerFn(purgeCustomer);

  const [tab, setTab] = useState<Tab>("products");

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => fetchAccess({}) });
  const isSuperAdmin = accessQuery.data?.isSuperAdmin ?? false;
  const canManageProducts = accessQuery.data?.permissions.includes("products.manage") ?? false;
  const canManageOrders = accessQuery.data?.permissions.includes("orders.manage") ?? false;

  const productsQuery = useQuery({
    queryKey: ["admin-recycle-bin", "products"],
    queryFn: () => fetchProducts({ data: { deleted: true, pageSize: 500 } as never }),
  });
  const ordersQuery = useQuery({
    queryKey: ["admin-recycle-bin", "orders"],
    queryFn: () => fetchOrders({ data: { deleted: true, pageSize: 500 } as never }),
  });
  const customersQuery = useQuery({
    queryKey: ["admin-recycle-bin", "customers"],
    queryFn: () => fetchCustomers({ data: { deleted: true, pageSize: 500 } as any }),
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

  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Recycle Bin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Deleted records stay here so nothing is lost by accident. Restore anytime; only a Super
        Admin can delete permanently.
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

      {tab === "products" ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
              <tr>
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
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!productsQuery.isLoading && productRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No deleted products.
                  </td>
                </tr>
              )}
              {productRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
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
                        disabled={!isSuperAdmin || purgeProductMutation.isPending}
                        onClick={() => {
                          const typed = window.prompt(
                            `Permanent delete cannot be undone. Type the product name to confirm:\n${row.name}`,
                            "",
                          );
                          if (!typed) return;
                          purgeProductMutation.mutate({ data: { id: row.id, confirmName: typed } });
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
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
              <tr>
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
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!ordersQuery.isLoading && orderRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No deleted orders.
                  </td>
                </tr>
              )}
              {orderRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
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
                        disabled={!isSuperAdmin || purgeOrderMutation.isPending}
                        onClick={() => {
                          const typed = window.prompt(
                            `Permanent delete cannot be undone. Type the invoice number to confirm:\n${row.invoice_no}`,
                            "",
                          );
                          if (!typed) return;
                          purgeOrderMutation.mutate({
                            data: { id: row.id, confirmInvoiceNo: typed },
                          });
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
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
              <tr>
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
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!customersQuery.isLoading && customerRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No deleted customers.
                  </td>
                </tr>
              )}
              {customerRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
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
                          const typed = window.prompt(
                            `Permanent delete cannot be undone. Type the customer phone to confirm:\n${row.phone}`,
                            "",
                          );
                          if (!typed) return;
                          purgeCustomerMutation.mutate({
                            data: { id: row.id, confirmPhone: typed },
                          });
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

      {!isSuperAdmin ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Permanent deletion is limited to the Super Admin account.
        </p>
      ) : null}
    </section>
  );
}
