/**
 * Environment Detection Utility
 *
 * Determines if the current environment is Staging or Production based on the hostname.
 * - Staging: localhost, *.lovable.app, or internal preview domains.
 * - Production: Custom domain (customzparadisebd.com) or explicit PROD flag.
 */

export type Environment = "staging" | "production";

export function getEnvironment(): Environment {
  // If we are on a browser
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // Production domains
    if (
      hostname === "customzparadisebd.com" ||
      hostname === "www.customzparadisebd.com" ||
      import.meta.env["VITE_APP_ENV"] === "production"
    ) {
      return "production";
    }

    // Everything else (localhost, lovable.app, etc.) is staging
    return "staging";
  }

  // Default for SSR (will be refined by client-side hydration)
  return "staging";
}

export const isProduction = () => getEnvironment() === "production";
export const isStaging = () => getEnvironment() === "staging";
