# SEO & Admin Hardening Plan

Implement automated RLS checks, bulk image management, and enhanced SEO features for Customz Paradise BD.

## User Review Required

> [!IMPORTANT]
> - **Search Console Submission**: I will provide the sitemap URL (`/api/public/sitemap.xml`) for you to submit manually to Google Search Console and Bing Webmaster Tools, as these require domain ownership verification (via TXT record or HTML file) which I cannot perform on your behalf.
> - **Structured Data Verification**: I will implement the schema but you should verify it using the [Google Rich Results Test](https://search.google.com/test/rich-results) after deployment.

## Proposed Changes

### Database & Security
- **RLS Verification**: Create a new server-side diagnostic utility to verify RLS policies for `orders`, `products`, `profiles`, and `courier_credentials` using different actor roles.
- **Audit Logging**: Ensure all bulk actions are captured in `admin_audit_log`.

### SEO Optimization
- **Sitemap & Robots**: Update dynamic routes to use the live database for sitemap generation.
- **JSON-LD Structured Data**: Implement `Organization`, `Product`, and `BreadcrumbList` schemas across storefront pages.
- **Dynamic Meta Tags**: Enhance `head()` metadata for every product and bike model page with localized BDT pricing and availability.
- **Index Coverage Check**: Add a visual status indicator in the Admin panel to check if the current page is reachable by crawlers.

### Admin Product Workflow
- **Bulk Image Management**: Add a "Bulk Images" action to the product list multi-select bar.
- **Image Optimization**: Enhance the uploader with automatic WebP conversion and 1000x1000px validation.
- **Batch Processing**: Allow replacing or appending images for multiple selected products at once.

### Technical Details
- **Schema**: Add `Organization` schema to the root layout and `BreadcrumbList` to product detail routes.
- **Server Functions**: Implement `verifyDatabaseSecurity` and `bulkUpdateProductImages` functions.
- **UI Components**: Create a `BulkImageDialog` for the admin panel.

## Verification Plan

### Automated Tests
- Run RLS verification suite via `tsgo` to ensure no data leakage.
- Validate `sitemap.xml` structure against XSD schema.
- E2E test for bulk image uploading and reordering.

### Manual Verification
- Check OG tags using Facebook Sharing Debugger.
- Confirm Robots.txt correctly points to the sitemap.
- Verify bulk image updates reflect in the storefront gallery.
