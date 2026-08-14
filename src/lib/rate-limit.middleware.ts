import { createMiddleware } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// rate limit keys are stored in a simple in-memory map for the worker's life
// in a multi-region deployment this is per-isolate, but usually sufficient
// for baseline throttling. For global strictness, we use the database.
const memoryLimits = new Map<string, { count: number; expires: number }>();

/**
 * Generic Rate Limiter Middleware
 * 
 * Prevents abuse by limiting requests per IP within a window.
 * Configuration can be tuned via environment variables:
 * - RATE_LIMIT_MAX: Default 100
 * - RATE_LIMIT_WINDOW_MS: Default 60000 (1 minute)
 */
export const rateLimitMiddleware = createMiddleware().server(async ({ next }) => {
  const MAX_REQUESTS = Number(process.env["RATE_LIMIT_MAX"] || 100);
  const WINDOW_MS = Number(process.env["RATE_LIMIT_WINDOW_MS"] || 60000);
  
  const ip = getRequestIP({ xForwardedFor: true }) || "unknown";
  const key = `rl:${ip}`;
  const now = Date.now();
  
  const record = memoryLimits.get(key);
  
  if (record && record.expires > now) {
    if (record.count >= MAX_REQUESTS) {
      // Alert/Log spike for abnormal traffic (10x limit)
      if (record.count === MAX_REQUESTS * 10) {
        console.warn(`[SECURITY ALERT] Massive traffic spike from IP: ${ip}`);
      }
      
      return new Response("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((record.expires - now) / 1000).toString(),
        },
      });
    }
    record.count++;
  } else {
    memoryLimits.set(key, { count: 1, expires: now + WINDOW_MS });
  }

  // Cleanup old records occasionally (1% of requests)
  if (Math.random() < 0.01) {
    for (const [k, v] of memoryLimits.entries()) {
      if (v.expires < now) memoryLimits.delete(k);
    }
  }

  return next();
});

/**
 * Throttles login attempts specifically to prevent brute-force attacks.
 * Uses the database-backed loginLockState from admin.server.ts.
 */
export const loginThrottleMiddleware = createMiddleware().server(async ({ next, data }) => {
  // We only throttle if this is a login-related function
  // In TanStack Start, we identify this by the input data or function name if available
  // For now, this is intended to be used manually in specific server functions
  
  const { loginLockState } = await import("./admin.server");
  
  // The login function should pass email in data
  const email = (data as any)?.email;
  
  if (email) {
    const lock = await loginLockState(email);
    if (lock.locked) {
      throw new Error(`Account temporarily locked. Please try again in ${lock.retryInSeconds} seconds.`);
    }
  }

  return next();
});
