// ============================================================
// CUSTOMERS
// Purpose: Every customer who has ordered, grouped by mobile
//          number, with lifetime value and a drill-down into their
//          order history.
// Status: COMPLETED
// Security: Derived server-side from orders the signed-in account
//          is already permitted to read.
// ============================================================
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAdminCustomers, softDeleteCustomer } from "@/lib/customers.functions";
import { formatBDT } from "@/lib/format";
import { listOrders, getMyAccess } from "@/lib/orders.functions";
import { deliveryZoneLabel } from "@/lib/orders.shared";
import { FraudMarkBadge } from "@/components/admin/customers/FraudMarkBadge";

export const Route = createFileRoute("/_authenticated/ad/customers")({
  head: () => ({ meta: [{ title: "Customers — CZP Ops" }, { property: "og:title", content: "Customers — CZP Ops" }, { name: "description", content: "Customz Paradise BD Admin Panel" }] }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const fetchCustomers = useServerFn(listAdminCustomers);
  const access = useServerFn(getMyAccess);
  const [search, setSearch] = useState("");
  const [openPhone, setOpenPhone] = useState<string | null>(null);

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({}) });
  const canManage = accessQuery.data?.permissions.includes("customers.manage") ?? false;

  const query = useQuery({
    queryKey: ["admin-customers", search],
    queryFn: () => fetchCustomers({ data: { search } }),
    placeholderData: (previous) => previous,
  });

  const customers = query.data?.rows ?? [];

  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Customers</h1>
      <p className="text-xs text-muted-foreground">
        {query.data?.total ?? 0} customer(s) · grouped by mobile number
      </p>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name, phone or city"
        className="mt-4 h-11 max-w-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">City / Zone</th>
              <th className="p-3 text-right">Orders</th>
              <th className="p-3 text-right">Cancelled</th>
              <th className="p-3 text-right">Total spent</th>
              <th className="p-3">Last order</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {query.isLoading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Loading customers…
                </td>
              </tr>
            )}
            {!query.isLoading && customers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No customers found.
                </td>
              </tr>
            )}
            {customers.map((customer) => (
              <>
                <tr key={customer.phone} className="border-b border-border">
                  <td className="p-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold">{customer.name}</span>
                      <FraudMarkBadge 
                        phoneNumber={customer.phone} 
                        customerName={customer.name} 
                        canManage={canManage}
                      />
                    </div>
                    <span className="block text-xs text-muted-foreground">
                      <a href={`tel:${customer.phone}`} className="underline">
                        {customer.phone}
                      </a>
                      {customer.email ? ` · ${customer.email}` : ""}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {customer.city} · {deliveryZoneLabel(customer.zone)}
                  </td>
                  <td className="p-3 text-right font-semibold">{customer.total_orders || 0}</td>
                  <td className="p-3 text-right text-muted-foreground">{customer.cancelled}</td>
                  <td className="p-3 text-right font-semibold">{formatBDT(Number(customer.lifetime_value || 0))}</td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(customer.lastOrderAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="steel"
                        size="sm"
                        onClick={() =>
                          setOpenPhone(openPhone === customer.phone ? null : customer.phone)
                        }
                      >
                        {openPhone === customer.phone ? "Hide orders" : "View orders"}
                      </Button>
                      <CustomerDeleteButton 
                        customer={customer} 
                        canManage={canManage} 
                      />
                    </div>
                  </td>
                </tr>
                {openPhone === customer.phone ? (
                  <tr
                    key={`${customer.phone}-orders`}
                    className="border-b border-border bg-secondary/40"
                  >
                    <td colSpan={7} className="p-3">
                      <CustomerOrders phone={customer.phone} />
                    </td>
                  </tr>
                ) : null}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CustomerDeleteButton({ 
  customer, 
  canManage 
}: { 
  customer: any; 
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const deleteCustomerFn = useServerFn(softDeleteCustomer);
  
  const mutation = useMutation({
    mutationFn: deleteCustomerFn,
    onSuccess: () => {
      toast.success("Customer moved to Recycle Bin");
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (err: any) => toast.error(err.message || "Could not delete customer"),
  });

  if (!canManage) return null;

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={mutation.isPending}
      onClick={() => {
        const reason = window.prompt("Reason for deletion (optional):", "");
        if (reason === null) return;
        mutation.mutate({ data: { id: customer.id, reason } as any });
      }}
    >
      Delete
    </Button>
  );
}

function CustomerOrders({ phone }: { phone: string }) {
  const fetchOrders = useServerFn(listOrders);
  const query = useQuery({
    queryKey: ["admin-customer-orders", phone],
    queryFn: () => fetchOrders({ data: { customerPhone: phone, pageSize: 50 } as never }),
  });

  if (query.isLoading) {
    return <p className="text-xs text-muted-foreground">Loading order history…</p>;
  }
  const rows = query.data?.rows ?? [];
  if (!rows.length) return <p className="text-xs text-muted-foreground">No orders found.</p>;

  return (
    <ul className="space-y-2">
      {rows.map((order) => (
        <li key={order.id} className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            to="/ad/orders/$id"
            params={{ id: order.id }}
            className="font-semibold text-primary underline"
          >
            {order.invoice_no}
          </Link>
          <span className="text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("en-GB")}
          </span>
          <span className="font-semibold">{formatBDT(Number(order.total))}</span>
          <StatusBadge value={order.status} />
          <StatusBadge value={order.payment_status} />
        </li>
      ))}
    </ul>
  );
}
