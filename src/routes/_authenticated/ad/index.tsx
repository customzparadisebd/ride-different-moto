// ============================================================
// ADMIN DASHBOARD
// Purpose: Operations overview — today/7-day/30-day sales, order
//          status mix, money still due and the latest orders.
// Status: COMPLETED
// Security: All numbers come from one permission-checked server
//          function; nothing is computed from client-supplied data.
// ============================================================
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { adminHead } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { getDashboardMetrics } from "@/lib/admin-data.functions";
import { ORDER_STATUSES, statusLabel } from "@/lib/orders.shared";

export const Route = createFileRoute("/_authenticated/czp-ops-9f2c/")({
  head: () => adminHead("Dashboard — CZP Ops"),
  component: AdminDashboard,
});

function AdminDashboard() {
  const fetchMetrics = useServerFn(getDashboardMetrics);
  const query = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => fetchMetrics({}) });

  if (query.isLoading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Loading dashboard…</p>;
  }
  if (query.isError || !query.data) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Could not load the dashboard right now.
      </p>
    );
  }

  const data = query.data;

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Last 30 days of order activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="steel" size="touch" asChild>
            <Link to="/czp-ops-9f2c/orders">All orders</Link>
          </Button>
          <Button variant="red" size="touch" asChild>
            <Link to="/czp-ops-9f2c/orders/new">New manual order</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Today" orders={data.today.orders} revenue={data.today.revenue} />
        <MetricCard label="Last 7 days" orders={data.week.orders} revenue={data.week.revenue} />
        <MetricCard label="Last 30 days" orders={data.month.orders} revenue={data.month.revenue} />
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Money due</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">
            {formatBDT(data.dueAmount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.unpaidOrders} order(s) not fully paid
          </p>
        </div>
      </div>

      <h2 className="mt-8 font-display text-lg font-bold uppercase">Orders by status</h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {ORDER_STATUSES.map((status) => (
          <Link
            key={status}
            to="/czp-ops-9f2c/orders"
            search={{ status }}
            className="rounded-lg border border-border bg-card p-3 text-center shadow-card transition hover:border-primary"
          >
            <p className="font-display text-xl font-bold">{data.statusCounts[status] ?? 0}</p>
            <p className="text-xs text-muted-foreground">{statusLabel(status)}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-bold uppercase">Latest orders</h2>
      <div className="mt-2 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3">Invoice</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No orders yet.
                </td>
              </tr>
            )}
            {data.recent.map((order) => (
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
                <td className="p-3">{order.customer_name}</td>
                <td className="p-3 text-right font-semibold">{formatBDT(Number(order.total))}</td>
                <td className="p-3">
                  <StatusBadge value={order.status} />
                </td>
                <td className="p-3">
                  <StatusBadge value={order.payment_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  orders,
  revenue,
}: {
  label: string;
  orders: number;
  revenue: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{formatBDT(revenue)}</p>
      <p className="text-xs text-muted-foreground">{orders} order(s)</p>
    </div>
  );
}
