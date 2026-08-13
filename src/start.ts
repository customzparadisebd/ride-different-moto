// ============= Full file contents =============

1: import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
2: 
3: import { renderErrorPage } from "./lib/error-page";
4: import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
5: 
6: const errorMiddleware = createMiddleware().server(async ({ next }) => {
7:   try {
8:     return await next();
9:   } catch (error) {
10:     if (error != null && typeof error === "object" && "statusCode" in error) {
11:       throw error;
12:     }
13:     console.error(error);
14:     return new Response(renderErrorPage(), {
15:       status: 500,
16:       headers: { "content-type": "text/html; charset=utf-8" },
17:     });
18:   }
19: });
20: 
21: // ============================================================
22: // SECURITY HEADERS
23: // Purpose: Baseline hardening for every response (MIME sniffing,
24: //          referrer leakage, cross-origin isolation of resources).
25: // Status: COMPLETED
26: // Security: Frame-ancestors are intentionally left to the host so
27: //          the development preview keeps working; HTTPS/HSTS is
28: //          terminated and enforced by the hosting platform.
29: // Future: None.
30: // ============================================================
31: const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
32:   const result = await next();
33:   const response = (result as { response?: Response }).response;
34:   if (response?.headers) {
35:     response.headers.set("x-content-type-options", "nosniff");
36:     response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
37:     response.headers.set("x-permitted-cross-domain-policies", "none");
38:     response.headers.set("permissions-policy", "geolocation=(), microphone=(), camera=()");
39:     response.headers.set("x-xss-protection", "1; mode=block");
40:     response.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
41:     // Standard CSP - allowing specific external assets while hardening
42:     response.headers.set(
43:       "content-security-policy",
44:       "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://www.google.com; connect-src 'self' https://*.supabase.co https://*.lovable.app wss://*.supabase.co https://api.dicebear.com;"
45:     );
46:   }
47:   return result;
48: });
49: 
50: // Start installs this automatically when src/start.ts is absent; defining the
51: // file opts out, so re-add it explicitly to keep server functions protected
52: // from cross-site requests.
53: const csrfMiddleware = createCsrfMiddleware({
54:   filter: (ctx) => ctx.handlerType === "serverFn",
55: });
56: 
57: export const startInstance = createStart(() => ({
58:   functionMiddleware: [attachSupabaseAuth],
59:   requestMiddleware: [errorMiddleware, csrfMiddleware, securityHeadersMiddleware],
60: }));