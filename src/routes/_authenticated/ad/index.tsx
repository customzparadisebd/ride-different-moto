import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  AlertTriangle,
  Box,
  UserPlus,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { useState } from "react";

import { StatusBadge } from "@/components/admin/orders/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { getDashboardMetrics } from "@/lib/admin-data.functions";

export const Route = createFileRoute("/_authenticated/ad/")({
  head: () => ({
    meta: [
      { title: "Dashboard — CZP Ops" },
      { property: "og:title", content: "Dashboard — CZP Ops" },
      { name: "description", content: "Real-time overview of Customz Paradise BD." },
    ],
  }),
  component: AdminDashboard,
});

/**
 * Admin Dashboard Route
 * Provides a real-time overview of business metrics using Recharts.
 */
function AdminDashboard() {
  const { access } = Route.useRouteContext();
  const fetchMetrics = useServerFn(getDashboardMetrics);
  const [showSteadfastInfo, setShowSteadfastInfo] = useState(false);
  const query = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchMetrics(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds for "real-time" updates
  });

  if (query.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse font-medium">
          Initializing Dashboard...
        </p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-destructive font-medium">Failed to load system metrics.</p>
      </div>
    );
  }

  const data = query.data;

  // Map status counts for the chart
  const statusChartData = [
    { name: "Pending", value: data.statusCounts["pending"] || 0, color: "oklch(0.5 0.23 25)" },
    { name: "Done", value: data.statusCounts["delivered"] || 0, color: "oklch(0.7 0.05 150)" },
    { name: "Cancelled", value: data.statusCounts["cancelled"] || 0, color: "oklch(0.6 0.05 0)" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Real-time overview of Customz Paradise BD.
        </p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="TODAY'S SALES"
          value={`৳ ${data.today.revenue}`}
          subtitle="Live"
          icon={<DollarSign className="h-4 w-4 text-rose-500" />}
          gradient="bg-linear-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-background"
        />
        <StatCard
          title="MONTHLY SALES"
          value={`৳ ${data.month.revenue}`}
          subtitle="This month"
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          gradient="bg-linear-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background"
        />
        <StatCard
          title="ORDERS"
          value={data.totalOrders}
          subtitle={`${data.pendingOrders} pending`}
          icon={<ShoppingCart className="h-4 w-4 text-sky-500" />}
          gradient="bg-linear-to-br from-sky-50 to-white dark:from-sky-950/20 dark:to-background"
        />
        <div
          role={access.isSuperAdmin || access.primaryRole === "admin" ? "button" : undefined}
          tabIndex={access.isSuperAdmin || access.primaryRole === "admin" ? 0 : undefined}
          aria-label={
            access.isSuperAdmin || access.primaryRole === "admin"
              ? "View SteadFast integration details"
              : undefined
          }
          onClick={() => {
            if (access.isSuperAdmin || access.primaryRole === "admin") {
              setShowSteadfastInfo(true);
            }
          }}
          onKeyDown={(e) => {
            if (!(access.isSuperAdmin || access.primaryRole === "admin")) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowSteadfastInfo(true);
            }
          }}
          className={
            access.isSuperAdmin || access.primaryRole === "admin"
              ? "cursor-pointer group rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              : "cursor-default group"
          }
        >
          <StatCard
            title="STEADFAST SUCCESS"
            value={data.steadfastSuccessCount}
            subtitle="Successfully booked"
            icon={
              <TrendingUp className="h-4 w-4 text-brand-red group-hover:scale-110 transition-transform" />
            }
            gradient="bg-linear-to-br from-brand-red/5 to-white dark:from-brand-red/10 dark:to-background group-hover:from-brand-red/10 group-hover:to-brand-red/5 transition-all duration-300 ring-1 ring-transparent group-hover:ring-brand-red/20"
          />
        </div>

        <Dialog open={showSteadfastInfo} onOpenChange={setShowSteadfastInfo}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-red" />
                SteadFast Integration
              </DialogTitle>
              <DialogDescription>
                Summary of the latest successful API submission.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Success Count
                  </p>
                  <p className="text-2xl font-bold text-foreground">{data.steadfastSuccessCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </p>
                  <p className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    CONNECTED
                  </p>
                </div>
              </div>

              {data.steadfastLastSuccessAt ? (
                <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-tight">
                        Last Success
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      {new Date(data.steadfastLastSuccessAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Order Reference</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold font-mono text-brand-red">
                        {data.steadfastLastInvoiceNo || "CZP-2026-XXXX"}
                      </p>
                      {data.steadfastLastOrderId && (
                        <Link
                          to="/ad/orders/$id"
                          params={{ id: data.steadfastLastOrderId }}
                          className="flex items-center gap-1 text-[10px] font-bold text-sky-500 hover:text-sky-600 transition-colors uppercase tracking-widest"
                        >
                          View Order
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground/60 font-medium">
                    {new Date(data.steadfastLastSuccessAt).toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs font-medium">
                  No successful submissions recorded yet.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => setShowSteadfastInfo(false)}
              >
                Close
              </Button>
              <Link to="/ad/orders" search={{ courier: "SteadFast" } as any}>
                <Button
                  size="sm"
                  className="text-xs font-bold bg-brand-red hover:bg-brand-red/90 text-white"
                >
                  View All Shipments
                </Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MiniStatCard
          title="PENDING ORDERS"
          value={data.pendingOrders}
          subtitle="Awaiting Action"
          icon={<ShoppingCart className="h-4 w-4 text-amber-400" />}
        />
        <MiniStatCard
          title="COMPLETED ORDERS"
          value={data.completedOrders}
          subtitle="Successful"
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
        />
        <MiniStatCard
          title="CANCELLED ORDERS"
          value={data.cancelledOrders}
          subtitle="Total cancelled"
          icon={<Box className="h-4 w-4 text-rose-400" />}
        />
        <MiniStatCard
          title="TOTAL PRODUCTS"
          value={data.inventory.totalProducts}
          subtitle="In system"
          icon={<Package className="h-4 w-4 text-sky-400" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MiniStatCard
          title="CURRENT STOCK"
          value={data.inventory.totalStock}
          subtitle="Units available"
          icon={<Layers className="h-4 w-4 text-emerald-400" />}
        />
        <MiniStatCard
          title="LOW STOCK"
          value={data.inventory.lowStock}
          subtitle="Reorder soon"
          icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
        />
        <MiniStatCard
          title="OUT OF STOCK"
          value={data.inventory.outOfStock}
          subtitle="Critical"
          icon={<Box className="h-4 w-4 text-rose-400" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
        <Card className="col-span-full md:col-span-5 border border-border shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <CardTitle className="text-base font-bold">Revenue (last 14 days)</CardTitle>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              BDT
            </span>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueHistory ?? []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.5 0.23 25)" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="oklch(0.5 0.23 25)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg bg-onyx px-3 py-2 shadow-xl border border-border/50">
                            <p className="text-[10px] font-bold text-onyx-foreground/60 uppercase">
                              Revenue
                            </p>
                            <p className="text-sm font-bold text-brand-red">
                              {(payload as any[])[0].value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="oklch(0.5 0.23 25)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full md:col-span-2 border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis hide domain={[0, 1]} />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Alerts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Low Stock Products</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {data.inventory.lowStock === 0 ? (
              <p className="text-xs text-muted-foreground py-4 font-medium">
                No products are low on stock.
              </p>
            ) : (
              <div className="space-y-2 py-2">
                {data.inventory.lowStockItems?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-xs border-b border-border/40 pb-1"
                  >
                    <span className="font-medium truncate max-w-[150px]">
                      Product ID: {item.id.split("-")[0]}
                    </span>
                    <span className="text-amber-600 font-bold">{item.stock_qty} left</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Out of Stock Products</CardTitle>
            <Box className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            {data.inventory.outOfStock === 0 ? (
              <p className="text-xs text-muted-foreground py-4 font-medium">
                Everything's in stock — great job.
              </p>
            ) : (
              <div className="space-y-2 py-2">
                {data.inventory.outOfStockItems?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-xs border-b border-border/40 pb-1"
                  >
                    <span className="font-medium truncate max-w-[150px]">
                      Product ID: {item.id.split("-")[0]}
                    </span>
                    <span className="text-rose-600 font-bold">OUT</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">Recent Orders</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">ORDER</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-right">TOTAL</th>
                  <th className="px-6 py-4 text-right">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.recent.map((order: any) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-muted-foreground/80 group-hover:text-foreground">
                      {order.invoice_no || order.id.split("-")[0]}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        value={order.status}
                        className="h-5 text-[10px] font-bold rounded-full px-2"
                      />
                    </td>
                    <td className="px-6 py-4 text-right font-bold tabular-nums">
                      ৳ {formatBDT(Number(order.total)).replace("৳", "").trim()}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground font-medium">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: false,
                      })}
                    </td>
                  </tr>
                ))}
                {data.recent.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-muted-foreground font-medium"
                    >
                      No recent transactional activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <Card className={`border-none shadow-sm overflow-hidden ${gradient}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-bold text-muted-foreground tracking-widest">
          {title}
        </CardTitle>
        <div className="rounded-full bg-white dark:bg-card p-1.5 shadow-sm border border-border/20">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-[10px] font-medium text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function MiniStatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-bold text-muted-foreground tracking-widest">
          {title}
        </CardTitle>
        <div className="rounded-full bg-secondary/50 p-1.5 border border-border/20">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-[10px] font-medium text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
