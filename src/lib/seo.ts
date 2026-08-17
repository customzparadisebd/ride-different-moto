import { site as hardcodedSite } from "@/data/site";
import { getSiteSettings } from "./site-settings.functions";

/**
 * SEO utilities for the Customz Paradise BD platform.
 * Dynamically resolves production vs development URLs for canonicals and OG tags.
 */

/**
 * Returns the absolute base URL for the site.
 * Defaults to the production domain in site settings if available, 
 * otherwise uses the current origin.
 */
export async function getBaseUrl() {
  try {
    const settings = await getSiteSettings();
    if (settings?.productionDomain) {
      return `https://${settings.productionDomain}`;
    }
  } catch (e) {
    // Fallback to hardcoded site URL if DB fetch fails
  }
  return hardcodedSite.url;
}

/**
 * Generates a canonical URL for a given path.
 */
export async function getCanonicalUrl(path: string = "/") {
  const baseUrl = await getBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Helper to resolve metadata titles with the brand name.
 */
export function formatMetaTitle(pageTitle?: string, siteName: string = hardcodedSite.name) {
  if (!pageTitle) return siteName;
  return `${pageTitle} — ${siteName}`;
}
