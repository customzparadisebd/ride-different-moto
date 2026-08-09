// ============================================================
// STEADFAST COURIER CLIENT (server-only)
// Purpose: Thin HTTP client for the Steadfast Courier API.
// Status: COMPLETED
// Security: Credentials are read from server secrets at call time
//          and never logged, returned or exposed to the browser.
//          Only the base URL is configurable from the panel.
// ============================================================
type SteadfastConfig = { baseUrl: string; apiKey: string; secretKey: string };

export function courierConfig(baseUrl: string): SteadfastConfig | null {
  const apiKey = process.env["STEADFAST_API_KEY"];
  const secretKey = process.env["STEADFAST_SECRET_KEY"];
  if (!apiKey || !secretKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey, secretKey };
}

async function call(
  config: SteadfastConfig,
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: init.method,
    headers: {
      "Api-Key": config.apiKey,
      "Secret-Key": config.secretKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text.slice(0, 400) };
  }
  return { ok: response.ok, status: response.status, payload };
}

/** Reads the account balance — the cheapest way to prove credentials work. */
export function courierPing(config: SteadfastConfig) {
  return call(config, "/get_balance", { method: "GET" });
}

export function courierCreateOrder(
  config: SteadfastConfig,
  order: {
    invoice: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    codAmount: number;
    note?: string;
  },
) {
  return call(config, "/create_order", {
    method: "POST",
    body: {
      invoice: order.invoice,
      recipient_name: order.recipientName,
      recipient_phone: order.recipientPhone,
      recipient_address: order.recipientAddress,
      cod_amount: order.codAmount,
      note: order.note ?? "",
    },
  });
}

export function courierStatusByConsignment(config: SteadfastConfig, consignmentId: string) {
  return call(config, `/status_by_cid/${encodeURIComponent(consignmentId)}`, { method: "GET" });
}

// ============================================================
// COURIER SETTINGS LOOKUP (server-only)
// Purpose: Reads the panel-configurable Steadfast base URL and the
//          on/off switch from store settings.
// Status: COMPLETED
// ============================================================
export async function courierSettings(supabase: {
  from: (table: "store_settings") => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
    };
  };
}) {
  const { data } = await supabase
    .from("store_settings")
    .select("steadfast_base_url, steadfast_enabled")
    .eq("id", "default")
    .maybeSingle();
  return {
    url: (data?.["steadfast_base_url"] as string) || "https://portal.packzy.com/api/v1",
    enabled: Boolean(data?.["steadfast_enabled"]),
  };
}
