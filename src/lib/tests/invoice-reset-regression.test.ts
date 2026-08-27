import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/integrations/supabase/types";
import { readInvoiceSettingsState } from "@/lib/invoicing.server";

const backendUrl = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const hasBackend = Boolean(backendUrl && serviceKey);
const integrationDescribe = hasBackend ? describe : describe.skip;

type SettingsSnapshot = {
  prefix: string;
  start_number: number;
  current_number: number;
};

const runId = Date.now().toString(36).toUpperCase();
const testPrefix = `RST${runId}`;
let client: SupabaseClient<Database> | null = null;
let originalSettings: SettingsSnapshot | null = null;
const createdOrderIds: string[] = [];

function getClient(): SupabaseClient<Database> {
  if (!backendUrl || !serviceKey) throw new Error("Backend test environment is unavailable");
  client ??= createClient<Database>(backendUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

async function setNextInvoice(nextNumber: number) {
  const db = getClient();
  const { error } = await db
    .from("invoice_settings")
    .update({
      prefix: testPrefix,
      start_number: nextNumber,
      current_number: nextNumber - 1,
    })
    .eq("id", "default");
  if (error) throw error;
}

async function createTriggeredOrder(source: "website" | "admin") {
  const db = getClient();
  const { data, error } = await db
    .from("orders")
    .insert({
      invoice_no: "AUTO",
      idempotency_key: `invoice-reset-${runId}-${source}`,
      customer_name: "Invoice Regression",
      customer_phone: "01800000000",
      address_line: "Automated regression test address",
      city: "Dhaka",
      subtotal: 100,
      discount: 0,
      shipping: 0,
      total: 100,
      currency: "BDT",
      payment_method: "cash_on_delivery",
      payment_status: "unpaid",
      order_source: source,
      status: "pending",
      advance_paid: 0,
      courier_status: "not_booked",
      is_pinned: false,
      print_count: 0,
      is_duplicate: false,
      cod_amount: 100,
    })
    .select("id, invoice_no")
    .single();
  if (error) throw error;
  createdOrderIds.push(data.id);
  return data;
}

integrationDescribe.sequential("authoritative invoice reset", () => {
  beforeAll(async () => {
    const db = getClient();
    const { data, error } = await db
      .from("invoice_settings")
      .select("prefix, start_number, current_number")
      .eq("id", "default")
      .single();
    if (error) throw error;
    originalSettings = data;

    // Prove that an old display label does not block an intentional reset.
    const historical = await db
      .from("orders")
      .insert({
        invoice_no: `${testPrefix}-01`,
        idempotency_key: `invoice-reset-${runId}-history`,
        customer_name: "Historical Invoice Regression",
        customer_phone: "01800000000",
        address_line: "Automated regression test address",
        city: "Dhaka",
        subtotal: 100,
        discount: 0,
        shipping: 0,
        total: 100,
        currency: "BDT",
        payment_method: "cash_on_delivery",
        payment_status: "unpaid",
        order_source: "admin",
        status: "pending",
        advance_paid: 0,
        courier_status: "not_booked",
        is_pinned: false,
        print_count: 0,
        is_duplicate: false,
        cod_amount: 100,
      })
      .select("id")
      .single();
    if (historical.error) throw historical.error;
    createdOrderIds.push(historical.data.id);
  });

  afterAll(async () => {
    const db = getClient();
    if (createdOrderIds.length > 0) await db.from("orders").delete().in("id", createdOrderIds);
    if (originalSettings) {
      await db.from("invoice_settings").update(originalSettings).eq("id", "default");
    }
  });

  it("reset to 01 is visible immediately and is used by the next website order", async () => {
    await setNextInvoice(1);
    const savedState = await readInvoiceSettingsState(getClient());
    expect(savedState.nextInvoiceNo).toBe(`${testPrefix}-01`);

    const websiteOrder = await createTriggeredOrder("website");
    expect(websiteOrder.invoice_no).toBe(`${testPrefix}-01`);

    const advancedState = await readInvoiceSettingsState(getClient());
    expect(advancedState.nextInvoiceNo).toBe(`${testPrefix}-02`);
  });

  it("a manual number is used by the next admin order and advances once", async () => {
    await setNextInvoice(25);
    const savedState = await readInvoiceSettingsState(getClient());
    expect(savedState.nextInvoiceNo).toBe(`${testPrefix}-25`);

    const adminOrder = await createTriggeredOrder("admin");
    expect(adminOrder.invoice_no).toBe(`${testPrefix}-25`);

    const advancedState = await readInvoiceSettingsState(getClient());
    expect(advancedState.nextInvoiceNo).toBe(`${testPrefix}-26`);
  });
});