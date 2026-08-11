// ============================================================
// SECURE COURIER INTEGRATION LAYER (server-only)
// Purpose: One place where courier API credentials are read and
//          where every outbound courier HTTP call is made. Provides
//          a small provider registry (SteadFast, Pathao, RedX and a
//          "custom" placeholder) so new couriers can be added
//          without touching the UI or the database.
// Status: COMPLETED
// Security: Blocked from client bundles by the `.server.ts` name.
//          Credentials live in `courier_credentials`, a table with
//          RLS on and NO policies/grants, so only the service-role
//          client can read them. Nothing here returns a secret to
//          the browser and no secret is written to logs/audit.
// Future: Provider adapters for further couriers, plus webhook
//          verification helpers (see /api/public/courier-webhook).
// ============================================================
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { mapCourierStatus, type ExtraField } from "./couriers.shared";

export type CourierRow = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  base_url: string;
  inside_charge: number | string;
  outside_charge: number | string;
  cod_percent: number | string;
  is_active: boolean;
  sort_order: number;
  extra_config: unknown;
};

export type CourierCredentials = {
  api_key: string | null;
  api_secret: string | null;
  username: string | null;
  password: string | null;
  token: string | null;
  extra: Record<string, string>;
};

export type CourierContext = {
  courier: CourierRow;
  credentials: CourierCredentials;
  baseUrl: string;
  extra: Record<string, string>;
};

const EMPTY_CREDENTIALS: CourierCredentials = {
  api_key: null,
  api_secret: null,
  username: null,
  password: null,
  token: null,
  extra: {},
};

export function extraFieldsToObject(fields: ExtraField[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, f.value]));
}

export function objectToExtraFields(value: unknown): ExtraField[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).map(([key, v]) => ({
    key,
    value: typeof v === "string" ? v : JSON.stringify(v ?? ""),
  }));
}

/** Loads a courier plus its credentials with the service-role client. */
export async function loadCourierContext(courierId: string): Promise<CourierContext | null> {
  const { data: courier } = await supabaseAdmin
    .from("couriers")
    .select(
      "id, slug, name, logo_url, phone, base_url, inside_charge, outside_charge, cod_percent, is_active, sort_order, extra_config",
    )
    .eq("id", courierId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!courier) return null;

  const { data: creds } = await supabaseAdmin
    .from("courier_credentials")
    .select("api_key, api_secret, username, password, token, extra")
    .eq("courier_id", courierId)
    .maybeSingle();

  const credentials: CourierCredentials = creds
    ? {
        api_key: creds.api_key,
        api_secret: creds.api_secret,
        username: creds.username,
        password: creds.password,
        token: creds.token,
        extra: (creds.extra ?? {}) as Record<string, string>,
      }
    : EMPTY_CREDENTIALS;

  return {
    courier: courier as CourierRow,
    credentials,
    baseUrl: (courier.base_url ?? "").replace(/\/+$/, ""),
    extra: (courier.extra_config ?? {}) as Record<string, string>,
  };
}

/** Which credential slots hold a value — safe to send to the panel. */
export async function credentialFlags(courierIds: string[]) {
  const map = new Map<string, Record<string, boolean>>();
  if (!courierIds.length) return map;
  const { data } = await supabaseAdmin
    .from("courier_credentials")
    .select("courier_id, api_key, api_secret, username, password, token")
    .in("courier_id", courierIds);
  for (const row of data ?? []) {
    map.set(row.courier_id, {
      apiKey: Boolean(row.api_key),
      apiSecret: Boolean(row.api_secret),
      username: Boolean(row.username),
      password: Boolean(row.password),
      token: Boolean(row.token),
    });
  }
  return map;
}

export async function logCourierApi(entry: {
  courierId: string | null;
  orderId?: string | null;
  action: string;
  success: boolean;
  statusCode?: string | null;
  message?: string | null;
  actorId?: string | null;
}) {
  await supabaseAdmin.from("courier_api_logs").insert({
    courier_id: entry.courierId,
    order_id: entry.orderId ?? null,
    action: entry.action,
    success: entry.success,
    status_code: entry.statusCode ?? null,
    // Truncated and free of credentials by construction.
    message: (entry.message ?? "").slice(0, 400) || null,
    actor_id: entry.actorId ?? null,
  });
}

// ------------------------------------------------------------
// HTTP helper
// ------------------------------------------------------------
type ApiResponse = { ok: boolean; status: number; payload: Record<string, unknown> };

async function request(
  url: string,
  init: { method: "GET" | "POST"; headers: Record<string, string>; body?: unknown },
): Promise<ApiResponse> {
  try {
    const response = await fetch(url, {
      method: init.method,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers },
      ...(init.body ? { body: JSON.stringify(init.body) } : {}),
    });
    const text = await response.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      payload = { raw: text.slice(0, 300) };
    }
    return { ok: response.ok, status: response.status, payload };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      payload: { message: error instanceof Error ? error.message : "Network error" },
    };
  }
}

// ------------------------------------------------------------
// Provider adapters
// ------------------------------------------------------------
export type BookingRequest = {
  invoice: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  city: string;
  codAmount: number;
  note: string;
};

export type BookingResult = {
  success: boolean;
  message: string;
  status: string;
  consignmentId: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  courierStatus: string;
};

export type ProviderAdapter = {
  /** Human-readable list of the credentials this provider needs. */
  requires: string[];
  ping: (ctx: CourierContext) => Promise<{ ok: boolean; message: string; status: string }>;
  book: (ctx: CourierContext, order: BookingRequest) => Promise<BookingResult>;
  track: (
    ctx: CourierContext,
    ref: { consignmentId: string | null; trackingCode: string | null },
  ) => Promise<{ ok: boolean; courierStatus: string; raw: string | null; message: string }>;
};

const notConfigured = (message: string): BookingResult => ({
  success: false,
  message,
  status: "config",
  consignmentId: null,
  trackingCode: null,
  trackingUrl: null,
  courierStatus: "not_booked",
});

const steadfast: ProviderAdapter = {
  requires: ["API key", "API secret", "Base URL"],
  async ping(ctx) {
    if (!ctx.credentials.api_key || !ctx.credentials.api_secret || !ctx.baseUrl) {
      return {
        ok: false,
        message: "Add the base URL, API key and API secret first.",
        status: "config",
      };
    }
    const res = await request(`${ctx.baseUrl}/get_balance`, {
      method: "GET",
      headers: { "Api-Key": ctx.credentials.api_key, "Secret-Key": ctx.credentials.api_secret },
    });
    return {
      ok: res.ok,
      status: String(res.status),
      message: res.ok
        ? "Connected successfully."
        : `Connection failed (HTTP ${res.status || "network"}).`,
    };
  },
  async book(ctx, order) {
    if (!ctx.credentials.api_key || !ctx.credentials.api_secret || !ctx.baseUrl) {
      return notConfigured("Courier API is not configured.");
    }
    const res = await request(`${ctx.baseUrl}/create_order`, {
      method: "POST",
      headers: { "Api-Key": ctx.credentials.api_key, "Secret-Key": ctx.credentials.api_secret },
      body: {
        invoice: order.invoice,
        recipient_name: order.recipientName,
        recipient_phone: order.recipientPhone,
        recipient_address: `${order.recipientAddress}, ${order.city}`,
        cod_amount: order.codAmount,
        note: order.note,
      },
    });
    const consignment = (res.payload["consignment"] ?? {}) as Record<string, unknown>;
    const consignmentId = consignment["consignment_id"]
      ? String(consignment["consignment_id"])
      : null;
    const trackingCode = (consignment["tracking_code"] as string) ?? null;
    const success = res.ok && Boolean(consignmentId);
    return {
      success,
      status: String(res.status),
      message: success
        ? `Shipment created · consignment ${consignmentId}`
        : String(
            res.payload["message"] ?? `Courier returned HTTP ${res.status || "network error"}.`,
          ),
      consignmentId,
      trackingCode,
      trackingUrl: trackingCode ? `https://steadfast.com.bd/t/${trackingCode}` : null,
      courierStatus: success ? mapCourierStatus(consignment["status"] as string) : "failed",
    };
  },
  async track(ctx, ref) {
    if (!ref.consignmentId)
      return { ok: false, courierStatus: "not_booked", raw: null, message: "No consignment yet." };
    const res = await request(
      `${ctx.baseUrl}/status_by_cid/${encodeURIComponent(ref.consignmentId)}`,
      {
        method: "GET",
        headers: {
          "Api-Key": ctx.credentials.api_key ?? "",
          "Secret-Key": ctx.credentials.api_secret ?? "",
        },
      },
    );
    const raw = (res.payload["delivery_status"] as string) ?? null;
    return {
      ok: res.ok,
      courierStatus: mapCourierStatus(raw),
      raw,
      message: res.ok
        ? "Tracking updated."
        : `Courier returned HTTP ${res.status || "network error"}.`,
    };
  },
};

/** Pathao issues a short-lived bearer token from client credentials. */
async function pathaoToken(ctx: CourierContext) {
  if (ctx.credentials.token) return ctx.credentials.token;
  const res = await request(`${ctx.baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: {},
    body: {
      client_id: ctx.credentials.api_key,
      client_secret: ctx.credentials.api_secret,
      username: ctx.credentials.username,
      password: ctx.credentials.password,
      grant_type: "password",
    },
  });
  return (res.payload["access_token"] as string) ?? null;
}

const pathao: ProviderAdapter = {
  requires: [
    "Base URL",
    "Client ID (API key)",
    "Client secret",
    "Username",
    "Password",
    "store_id extra field",
  ],
  async ping(ctx) {
    if (!ctx.baseUrl) return { ok: false, message: "Add the base URL first.", status: "config" };
    const token = await pathaoToken(ctx);
    if (!token)
      return {
        ok: false,
        message: "Could not get a token — check the credentials.",
        status: "auth",
      };
    const res = await request(`${ctx.baseUrl}/aladdin/api/v1/city-list`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return {
      ok: res.ok,
      status: String(res.status),
      message: res.ok
        ? "Connected successfully."
        : `Connection failed (HTTP ${res.status || "network"}).`,
    };
  },
  async book(ctx, order) {
    const storeId = ctx.extra["store_id"] ?? ctx.credentials.extra["store_id"];
    if (!ctx.baseUrl || !storeId)
      return notConfigured("Add the base URL and a store_id extra field.");
    const token = await pathaoToken(ctx);
    if (!token) return notConfigured("Courier authentication failed.");
    const res = await request(`${ctx.baseUrl}/aladdin/api/v1/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: {
        store_id: storeId,
        merchant_order_id: order.invoice,
        recipient_name: order.recipientName,
        recipient_phone: order.recipientPhone,
        recipient_address: `${order.recipientAddress}, ${order.city}`,
        delivery_type: 48,
        item_type: 2,
        item_quantity: 1,
        item_weight: ctx.extra["item_weight"] ?? "0.5",
        amount_to_collect: order.codAmount,
        item_description: order.note || order.invoice,
      },
    });
    const payload = (res.payload["data"] ?? res.payload) as Record<string, unknown>;
    const consignmentId = payload["consignment_id"] ? String(payload["consignment_id"]) : null;
    const success = res.ok && Boolean(consignmentId);
    return {
      success,
      status: String(res.status),
      message: success
        ? `Shipment created · consignment ${consignmentId}`
        : String(
            res.payload["message"] ?? `Courier returned HTTP ${res.status || "network error"}.`,
          ),
      consignmentId,
      trackingCode: consignmentId,
      trackingUrl: consignmentId
        ? `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}`
        : null,
      courierStatus: success ? "booked" : "failed",
    };
  },
  async track(ctx, ref) {
    if (!ref.consignmentId)
      return { ok: false, courierStatus: "not_booked", raw: null, message: "No consignment yet." };
    const token = await pathaoToken(ctx);
    if (!token)
      return {
        ok: false,
        courierStatus: "booked",
        raw: null,
        message: "Courier authentication failed.",
      };
    const res = await request(
      `${ctx.baseUrl}/aladdin/api/v1/orders/${encodeURIComponent(ref.consignmentId)}/info`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } },
    );
    const payload = (res.payload["data"] ?? {}) as Record<string, unknown>;
    const raw = (payload["order_status"] as string) ?? null;
    return {
      ok: res.ok,
      courierStatus: mapCourierStatus(raw),
      raw,
      message: res.ok
        ? "Tracking updated."
        : `Courier returned HTTP ${res.status || "network error"}.`,
    };
  },
};

const redx: ProviderAdapter = {
  requires: ["Base URL", "Access token", "pickup_store_id extra field"],
  async ping(ctx) {
    if (!ctx.baseUrl || !ctx.credentials.token) {
      return { ok: false, message: "Add the base URL and access token first.", status: "config" };
    }
    const res = await request(`${ctx.baseUrl}/areas`, {
      method: "GET",
      headers: { "API-ACCESS-TOKEN": `Bearer ${ctx.credentials.token}` },
    });
    return {
      ok: res.ok,
      status: String(res.status),
      message: res.ok
        ? "Connected successfully."
        : `Connection failed (HTTP ${res.status || "network"}).`,
    };
  },
  async book(ctx, order) {
    const storeId = ctx.extra["pickup_store_id"];
    if (!ctx.baseUrl || !ctx.credentials.token || !storeId) {
      return notConfigured("Add the base URL, access token and a pickup_store_id extra field.");
    }
    const res = await request(`${ctx.baseUrl}/parcel`, {
      method: "POST",
      headers: { "API-ACCESS-TOKEN": `Bearer ${ctx.credentials.token}` },
      body: {
        customer_name: order.recipientName,
        customer_phone: order.recipientPhone,
        delivery_area: order.city,
        customer_address: order.recipientAddress,
        merchant_invoice_id: order.invoice,
        cash_collection_amount: String(order.codAmount),
        parcel_weight: Number(ctx.extra["parcel_weight"] ?? 500),
        instruction: order.note,
        value: order.codAmount,
        pickup_store_id: Number(storeId),
      },
    });
    const trackingId = (res.payload["tracking_id"] as string) ?? null;
    const success = res.ok && Boolean(trackingId);
    return {
      success,
      status: String(res.status),
      message: success
        ? `Shipment created · tracking ${trackingId}`
        : String(
            res.payload["message"] ?? `Courier returned HTTP ${res.status || "network error"}.`,
          ),
      consignmentId: trackingId,
      trackingCode: trackingId,
      trackingUrl: trackingId
        ? `https://redx.com.bd/track-a-parcel/?trackingId=${trackingId}`
        : null,
      courierStatus: success ? "booked" : "failed",
    };
  },
  async track(ctx, ref) {
    const id = ref.trackingCode ?? ref.consignmentId;
    if (!id)
      return { ok: false, courierStatus: "not_booked", raw: null, message: "No tracking id yet." };
    const res = await request(`${ctx.baseUrl}/parcel/track/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { "API-ACCESS-TOKEN": `Bearer ${ctx.credentials.token ?? ""}` },
    });
    const tracking = (res.payload["tracking"] ?? []) as Record<string, unknown>[];
    const raw = (tracking.at(-1)?.["message_en"] as string) ?? null;
    return {
      ok: res.ok,
      courierStatus: mapCourierStatus(raw),
      raw,
      message: res.ok
        ? "Tracking updated."
        : `Courier returned HTTP ${res.status || "network error"}.`,
    };
  },
};

/** Placeholder adapter so a courier can be configured before its API is wired. */
const custom: ProviderAdapter = {
  requires: ["Base URL and credentials for the provider"],
  ping: async () => ({
    ok: false,
    status: "unsupported",
    message:
      "No API adapter for this provider yet — configuration is saved and charges still apply.",
  }),
  book: async () => notConfigured("No API adapter for this provider yet. Book manually for now."),
  track: async () => ({
    ok: false,
    courierStatus: "booked",
    raw: null,
    message: "No API adapter for this provider yet.",
  }),
};

/** PROVIDER REGISTRY — add a new courier by adding an adapter here. */
const ADAPTERS: Record<string, ProviderAdapter> = { steadfast, pathao, redx };

export function adapterFor(slug: string): ProviderAdapter {
  return ADAPTERS[slug] ?? custom;
}
