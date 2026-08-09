// ============================================================
// ADMIN DASHBOARD + CUSTOMER DATA
// Purpose: Aggregated reads for the admin dashboard and the
//          customers screen. Customers are derived from orders
//          (grouped by phone number) — there is no separate table.
// Status: COMPLETED
// Security: Both endpoints require the signed-in account to hold
//          the matching permission, resolved server-side.
// ============================================================
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

    const since = startOfDayISO(29);
    const [window, recent] = await Promise.all([
      context.supabase
        .from("orders")
        .select("created_at, total, advance_paid, status, payment_status")
        .gte("created_at", since)
        .returns<MetricRow[]>(),
      context.supabase
        .from("orders")
        .select("id, invoice_no, customer_name, total, status, payment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const rows = window.data ?? [];
    const todayStart = startOfDayISO(0);
    const weekStart = startOfDayISO(6);

    const bucket = (from: string) => {
      const slice = rows.filter((row) => row.created_at >= from);
      return {
        orders: slice.length,
        revenue: slice.reduce((sum, row) => sum + Number(row.total), 0),
      };
    };

    const statusCounts: Record<string, number> = {};
    let dueAmount = 0;
    let unpaidOrders = 0;
    for (const row of rows) {
      statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
      const due = Math.max(Number(row.total) - Number(row.advance_paid ?? 0), 0);
      if (row.payment_status !== "paid" && row.payment_status !== "refunded") {
        dueAmount += due;
        if (due > 0) unpaidOrders += 1;
      }
    }

    return {
      today: bucket(todayStart),
      week: bucket(weekStart),
      month: bucket(since),
      statusCounts,
      dueAmount,
      unpaidOrders,
      recent: recent.data ?? [],
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
