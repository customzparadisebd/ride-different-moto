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
import { listAdminCustomers, softDeleteCustomer, getCustomerAuditTrail, updateAdminCustomer } from "@/lib/customers.functions";
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
  const [status, setStatus] = useState<"all" | "active" | "fraud">("all");
  const [page, setPage] = useState(1);
  const [openPhone, setOpenPhone] = useState<string | null>(null);

  const accessQuery = useQuery({ queryKey: ["admin-access"], queryFn: () => access({}) });
  const canManage = accessQuery.data?.permissions.includes("customers.manage") ?? false;

  const query = useQuery({
    queryKey: ["admin-customers", search, status, page],
    queryFn: () => fetchCustomers({ data: { search, status, page } }),
    placeholderData: (previous) => previous,
  });

  const customers = query.data?.rows ?? [];

  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Customers</h1>
      <p className="text-xs text-muted-foreground">
        {query.data?.total ?? 0} customer(s) · grouped by mobile number
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name, phone, email, city..."
          className="h-11 max-w-sm"
        />
        
        <div className="flex rounded-lg border border-border bg-card p-1 shadow-sm">
          {(["all", "active", "fraud"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded-md ${
                status === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

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
                    {customer.district || "—"} · {customer.area || "—"}
                  </td>
                  <td className="p-3 text-right font-semibold">{customer.total_orders || 0}</td>
                  <td className="p-3 text-right text-muted-foreground">—</td>
                  <td className="p-3 text-right font-semibold">{formatBDT(Number(customer.lifetime_value || 0))}</td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(customer.updated_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <CustomerEditButton 
                        customer={customer}
                        canManage={canManage}
                      />
                      <CustomerAuditTrailButton 
                        customerId={customer.id} 
                        customerName={customer.name}
                        canView={canManage} 
                      />
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
      <Pagination
        currentPage={page}
        totalCount={query.data?.total ?? 0}
        pageSize={query.data?.pageSize ?? 25}
        onPageChange={setPage}
      />
    </section>
  );
}

function Pagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
      <div className="text-xs text-muted-foreground">
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{" "}
        {Math.min(currentPage * pageSize, totalCount)} of {totalCount} customers
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="steel"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1 text-sm font-medium">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            {currentPage}
          </span>
          <span className="px-2 text-muted-foreground">of</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card">
            {totalPages}
          </span>
        </div>
        <Button
          variant="steel"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function CustomerAuditTrailButton({ 
  customerId, 
  customerName,
  canView 
}: { 
  customerId: string; 
  customerName: string;
  canView: boolean;
}) {
  const fetchAudit = useServerFn(getCustomerAuditTrail);
  const [isOpen, setIsOpen] = useState(false);
  
  const query = useQuery({
    queryKey: ["admin-customer-audit", customerId],
    queryFn: () => fetchAudit({ data: { customerId } }),
    enabled: isOpen,
  });

  if (!canView) return null;

  return (
    <>
      <Button variant="steel" size="sm" onClick={() => setIsOpen(true)}>
        Audit Trail
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-display text-lg font-bold uppercase tracking-tight">
                Audit Trail: {customerName}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {query.isLoading ? (
                <p className="text-center text-sm text-muted-foreground">Loading audit logs...</p>
              ) : !query.data?.length ? (
                <p className="text-center text-sm text-muted-foreground">No audit logs found for this customer.</p>
              ) : (
                <div className="space-y-4">
                  {query.data.map((log: any) => (
                    <div key={log.id} className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2 mb-2">
                        <span className="font-bold text-primary">{log.action.replace("customer.", "").toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("en-GB")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Actor</p>
                          <p>{log.actor_email} ({log.actor_role})</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">IP Address</p>
                          <p>{log.ip_address || "—"}</p>
                        </div>
                      </div>
                      {log.metadata?.reason && (
                        <div className="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-400 border border-red-500/20">
                          <p className="font-semibold uppercase text-[10px] opacity-70">Delete Reason</p>
                          <p>{log.metadata.reason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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
