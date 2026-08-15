import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PERMISSIONS } from "./admin.shared";

type MetricRow = {
  created_at: string;
  total: number;
  advance_paid: number;
  status: string;
  payment_status: string;
};

const startOfDayISO = (daysAgo: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

export const getDashboardMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthISO = monthStart.toISOString();

    const historyStart = startOfDayISO(13); // Last 14 days

    const [orders, recent, inventory, statusCountsRaw, steadfastStats] = await Promise.all([
      context.supabase
        .from("orders")
        .select("created_at, total, status")
        .gte("created_at", monthISO)
        .is("deleted_at", null),
      context.supabase
        .from("orders")
        .select("id, invoice_no, customer_name, total, status, payment_status, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10),
      context.supabase
        .from("products")
        .select("id, stock_qty, low_stock_threshold, is_active")
        .is("deleted_at", null),
      context.supabase
        .from("orders")
        .select("status")
        .is("deleted_at", null),
      context.supabase
        .from("steadfast_stats" as any)
        .select("successful_submissions_count")
        .maybeSingle(),
    ]);

    const orderRows = (orders.data as any[]) ?? [];
    const todayRows = orderRows.filter(r => r.created_at >= todayISO);
    
    // Revenue logic: typically excludes cancelled/returned in BDT context unless asked otherwise.
    // Here we include everything that isn't deleted, but filter by status for "Sales" usually implies non-cancelled.
    const getRevenue = (rows: any[]) => rows
      .filter(r => r.status !== 'cancelled' && r.status !== 'returned')
      .reduce((sum, r) => sum + Number(r.total), 0);

    const productRows = (inventory.data as any[]) ?? [];
    const activeProducts = productRows.filter(p => p.is_active);
    const totalStock = productRows.reduce((sum, p) => sum + (p.stock_qty || 0), 0);
    const lowStock = productRows.filter(p => p.stock_qty > 0 && p.stock_qty <= (p.low_stock_threshold || 5));
    const outOfStock = productRows.filter(p => (p.stock_qty || 0) <= 0);

    const statusCounts: Record<string, number> = {};
    const countsArr = Array.isArray(statusCountsRaw.data) ? statusCountsRaw.data : [];
    countsArr.forEach((r: any) => {
      statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
    });

    // Unique customers based on phone (from all-time orders)
    const { data: customerData } = await context.supabase
      .from("orders")
      .select("customer_phone")
      .is("deleted_at", null);
    const uniqueCustomers = new Set(((customerData as any[]) ?? []).map(c => c.customer_phone)).size;

    // Revenue History (last 14 days)
    const historyRows = await context.supabase
      .from("orders")
      .select("created_at, total, status")
      .gte("created_at", historyStart)
      .is("deleted_at", null);
    
    const revenueByDay: Record<string, number> = {};
    ((historyRows.data as any[]) ?? []).forEach(r => {
      if (r.status === 'cancelled' || r.status === 'returned') return;
      const day = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      revenueByDay[day] = (revenueByDay[day] ?? 0) + Number(r.total);
    });

    const revenueHistory = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { date: day, revenue: revenueByDay[day] || 0 };
    });

    return {
      today: {
        orders: todayRows.length,
        revenue: getRevenue(todayRows)
      },
      month: {
        orders: orderRows.length,
        revenue: getRevenue(orderRows)
      },
      totalOrders: ((statusCountsRaw.data as any[]) ?? []).length,
      pendingOrders: statusCounts['pending'] || 0,
      completedOrders: (statusCounts['delivered'] || 0) + (statusCounts['completed'] || 0),
      cancelledOrders: (statusCounts['cancelled'] || 0) + (statusCounts['returned'] || 0),
      uniqueCustomers,
      statusCounts,
      recent: (recent.data as any[]) ?? [],
      inventory: {
        totalProducts: activeProducts.length,
        totalStock,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        lowStockItems: lowStock.slice(0, 5),
        outOfStockItems: outOfStock.slice(0, 5)
      },
      revenueHistory,
      steadfastSuccessCount: (steadfastStats.data as any)?.successful_submissions_count ?? 0,
    };
  });

type CustomerRow = {
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  city: string;
  delivery_zone: string | null;
  total: number;
  status: string;
  created_at: string;
};

export const listCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ search: z.string().trim().max(120).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { resolveActor, assertAccess } = await import("./admin.server");
    assertAccess(
      await resolveActor(context.userId, context.claims as never),
      PERMISSIONS.ordersView,
    );

    const { data: rows, error } = await context.supabase
      .from("orders")
      .select(
        "customer_name, customer_phone, customer_email, city, delivery_zone, total, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(2000)
      .returns<CustomerRow[]>();
    if (error) throw new Error("Could not load customers.");

    const map = new Map<
      string,
      {
        phone: string;
        name: string;
        email: string | null;
        city: string;
        zone: string | null;
        orders: number;
        cancelled: number;
        spent: number;
        lastOrderAt: string;
      }
    >();

    for (const row of rows ?? []) {
      const key = row.customer_phone;
      const entry = map.get(key);
      const cancelled = row.status === "cancelled" || row.status === "returned" ? 1 : 0;
      if (!entry) {
        map.set(key, {
          phone: row.customer_phone,
          name: row.customer_name,
          email: row.customer_email,
          city: row.city,
          zone: row.delivery_zone,
          orders: 1,
          cancelled,
          spent: cancelled ? 0 : Number(row.total),
          lastOrderAt: row.created_at,
        });
        continue;
      }
      entry.orders += 1;
      entry.cancelled += cancelled;
      if (!cancelled) entry.spent += Number(row.total);
      if (!entry.email && row.customer_email) entry.email = row.customer_email;
    }

    const term = (data.search ?? "").trim().toLowerCase();
    const customers = [...map.values()]
      .filter(
        (customer) =>
          !term ||
          customer.name.toLowerCase().includes(term) ||
          customer.phone.toLowerCase().includes(term) ||
          customer.city.toLowerCase().includes(term),
      )
      .sort((a, b) => (a.lastOrderAt < b.lastOrderAt ? 1 : -1));

    return { customers, totalCustomers: map.size };
  });