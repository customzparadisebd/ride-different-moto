import { z } from "zod";

export const LOGO_CATEGORIES = [
  "main",
  "header",
  "footer",
  "mobile",
  "admin_login",
  "admin_sidebar",
  "invoice",
  "favicon",
  "og_image",
] as const;

export type LogoCategory = (typeof LOGO_CATEGORIES)[number];

export const LOGO_CATEGORY_LABELS: Record<LogoCategory, string> = {
  main: "Main Brand Logo",
  header: "Header Logo",
  footer: "Footer Logo",
  mobile: "Mobile Navigation Logo",
  admin_login: "Admin Login Logo",
  admin_sidebar: "Admin Sidebar Logo",
  invoice: "Invoice Logo",
  favicon: "Site Favicon",
  og_image: "Social Sharing (OG) Image",
};

export const logoUpdateInput = z.object({
  category: z.enum(LOGO_CATEGORIES),
  url: z.string().url().nullable().optional(),
  storagePath: z.string().nullable().optional(),
  settings: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

export type LogoUpdateInput = z.infer<typeof logoUpdateInput>;

export interface SiteLogo {
  id: string;
  category: LogoCategory;
  label: string;
  description: string | null;
  url: string | null;
  storage_path: string | null;
  is_active: boolean;
  settings: {
    recommended_width?: number;
    recommended_height?: number;
    recommended_format?: string[];
    recommended_size_kb?: number;
    transparency_required?: boolean;
    aspect_ratio?: string;
    alt_text?: string;
  };
  updated_at: string;
}

export const LOGO_RECOMMENDATIONS: Record<LogoCategory, SiteLogo["settings"]> = {
  main: {
    recommended_width: 512,
    recommended_height: 512,
    recommended_format: ["PNG", "WebP", "SVG"],
    transparency_required: true,
    aspect_ratio: "1:1",
  },
  header: {
    recommended_height: 80,
    recommended_format: ["PNG", "WebP", "SVG"],
    transparency_required: true,
  },
  footer: {
    recommended_height: 80,
    recommended_format: ["PNG", "WebP", "SVG"],
    transparency_required: true,
  },
  mobile: {
    recommended_height: 60,
    recommended_format: ["PNG", "WebP", "SVG"],
    transparency_required: true,
  },
  admin_login: {
    recommended_width: 800,
    recommended_height: 800,
    recommended_format: ["PNG", "WebP"],
    transparency_required: true,
    aspect_ratio: "1:1",
  },
  admin_sidebar: {
    recommended_height: 48,
    recommended_format: ["PNG", "WebP", "SVG"],
    transparency_required: true,
  },
  invoice: {
    recommended_height: 120,
    recommended_format: ["PNG", "JPG"],
    recommended_size_kb: 200,
  },
  favicon: {
    recommended_width: 32,
    recommended_height: 32,
    recommended_format: ["ICO", "PNG"],
    aspect_ratio: "1:1",
  },
  og_image: {
    recommended_width: 1200,
    recommended_height: 630,
    recommended_format: ["JPG", "PNG"],
    aspect_ratio: "1.91:1",
    recommended_size_kb: 500,
  },
};
