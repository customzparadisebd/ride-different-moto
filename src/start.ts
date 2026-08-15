import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// ============================================================
// SECURITY HEADERS
// Purpose: Baseline hardening for every response (MIME sniffing,
//          referrer leakage, cross-origin isolation of resources).
// Status: COMPLETED
// Security: Frame-ancestors are intentionally left to the host so
//          the development preview keeps working; HTTPS/HSTS is
//          terminated and enforced by the hosting platform.
// Future: None.
// ============================================================
const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const response = (result as { response?: Response }).response;
  if (response?.headers) {
    response.headers.set("x-content-type-options", "nosniff");
    response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
    response.headers.set("x-permitted-cross-domain-policies", "none");
    response.headers.set("permissions-policy", "geolocation=(), microphone=(), camera=()");
    response.headers.set("x-xss-protection", "1; mode=block");
    response.headers.set(
      "strict-transport-security",
      "max-age=31536000; includeSubDomains; preload",
    );
    // Standard CSP - allowing specific external assets while hardening
    response.headers.set(
      "content-security-policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://www.google.com; connect-src 'self' https://*.supabase.co https://*.lovable.app wss://*.supabase.co https://api.dicebear.com;",
    );
  }
  return result;
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

import { rateLimitMiddleware } from "./lib/rate-limit.middleware";

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [
    errorMiddleware,
    csrfMiddleware,
    securityHeadersMiddleware,
    rateLimitMiddleware,
  ],
}));
