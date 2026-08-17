# Plan: Complete SEO, GEO, AEO, and Local SEO Implementation

Implement a centralized, admin-controlled SEO and Business Identity system to enhance search engine visibility and accurately represent the brand relationship while preserving the existing website structure.

## Technical Details

### 1. Database & Backend
- Create `public.site_settings` table to store centralized business info and SEO defaults.
  - Columns: `id` (PK, default 'default'), `production_domain`, `business_name`, `business_description`, `tagline`, `address`, `city`, `country`, `phone`, `whatsapp`, `email`, `social_links` (JSONB), `business_hours` (JSONB), `main_branch_info` (text), `branch_relationship` (text), `default_meta_title`, `default_meta_description`, `organization_schema` (JSONB), `local_business_schema` (JSONB).
- Enable RLS on `public.site_settings` (public read, authenticated update for admins).
- Create `src/lib/site-settings.functions.ts` for server-side read/write operations.
- Update `src/lib/settings.shared.ts` with Zod schemas for site settings.

### 2. Admin Panel Enhancements
- Create `src/components/admin/settings/SiteSettingsPanel.tsx` to provide a dedicated UI for managing business identity and SEO.
- Integrate the panel into `src/routes/_authenticated/ad/settings.tsx`.
- Ensure sensitive infrastructure secrets remain hidden as per requirements.

### 3. SEO & Structured Data Architecture
- Create `src/lib/seo.ts` (or extend `site.ts`) to provide utility functions for generating canonical URLs and metadata, dynamically choosing between the production domain and the current environment origin.
- Refactor `src/routes/__root.tsx` to fetch site settings in a loader and inject global metadata and JSON-LD (`Organization`, `LocalBusiness`).
- Update page-specific routes (`index.tsx`, `products.$slug.tsx`, `bike-models.$slug.tsx`) to use dynamic settings and inject specific structured data (`Product`, `BreadcrumbList`).
- Update `src/routes/api/public/sitemap.xml.tsx` and `robots.txt.tsx` to use the dynamic production domain.

### 4. UI Consistency & Content Updates
- Update `Footer.tsx`, `Logo.tsx`, `AboutSection.tsx`, and `ContactSection.tsx` to pull data from the dynamic site settings instead of hardcoded constants.
- Clearly establish the relationship between "Customz Paradise BD" (Bangladesh) and "Custom Paradise" (India) as requested.
- Ensure all images across the site use descriptive `alt` text from the database.

## User Review Required

> [!IMPORTANT]
> - The production domain is set to `customparadisebd.com`. All generated URLs will point here even during development if this is set as the production domain.
> - We will migrate existing hardcoded data from `src/data/site.ts` into the initial database seed.
