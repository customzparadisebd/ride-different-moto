# SEO and Security Hardening Plan

Implement automated security checks, SEO metadata generation, and enhanced bulk image management for the admin workflow.

## Proposed Changes

### 1. Automated Security Checks (RLS Verification)
- Update `verifyDatabaseSecurity` in `src/lib/security-check.functions.ts` to include more robust checks (e.g., trying to read sensitive columns as anon).
- Ensure `AdminDiagnostics` UI provides actionable feedback on failures.

### 2. SEO & Sitemap Submission
- Enhance sitemap generation to include bike models/categories.
- Add "Index Coverage Check" to `ad/diagnostics.tsx` by pinging Google's Indexing API (if possible) or providing status links.
- Generate robots.txt and sitemap.xml dynamically with proper priorities.

### 3. Bulk Image Management
- Enhance `bulkUpdateProductImages` to support:
  - Replacing all gallery images.
  - Validating 1000x1000px WebP recommendation on the server-side if possible.
  - Adding a "Bulk Image Gallery" modal in the product list for faster multi-item updates.

### 4. SEO Metadata & Structured Data
- Update `src/routes/products.$slug.tsx` to generate full `Product` JSON-LD including:
  - `AggregateRating` (if reviews exist).
  - `Offer` with price and currency (BDT).
  - `BreadcrumbList` for category paths.
- Add `Organization` and `LocalBusiness` JSON-LD to the homepage.
- Ensure unique meta titles and descriptions for every product based on its category and bike compatibility.

## Technical Details

- **Structured Data**: Use standard `application/ld+json` blocks.
- **Bulk Images**: Use `context.supabase.rpc` if custom logic is needed, or stick to multi-row updates in a single transaction.
- **Security**: Use `createClient` with the anon key inside server functions to simulate external requests.

## User Review Required

- Confirm if specific bike models should have their own dedicated SEO pages or if they are just product filters.
- Verify if any external API keys (Google Search Console API) are available for real-time index checking.
