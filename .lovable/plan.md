# SEO and Product Management Plan

Verify SEO setup with sitemap/robots.txt and implement bulk product management workflows for faster inventory handling.

## Proposed Changes

### SEO Verification & Setup
- Create `src/routes/api/public/sitemap.xml.ts` to dynamically generate a sitemap of all active products and core pages.
- Create `src/routes/api/public/robots.txt.ts` to guide search engine crawlers and link to the sitemap.
- Update `src/routes/__root.tsx` head metadata to include a link to the sitemap (via `robots.txt` already, but adding extra `head` tags if helpful for discovery).

### Admin Product Workflow Enhancement (Bulk Actions)
- **Selectable Product Rows**: Add checkboxes to the product list in `AdminProducts` to allow multiple selection.
- **Bulk Action Bar**: Introduce a sticky/floating action bar that appears when items are selected.
- **Bulk Operations**:
  - **Publish/Unpublish**: Toggle `is_active` for selected items.
  - **Change Category**: Update the category for multiple products at once.
  - **Bulk Deletion**: Move multiple items to the Recycle Bin.
  - **Image Cleanup**: (Optional/Secondary) Helper to identify products missing images.
- **Improved Category Management**: Add a way to quick-edit categories from the main list without opening the full form.

## Technical Details

### SEO
- The sitemap will query `products` from the database to ensure it's always up-to-date.
- `robots.txt` will disallow sensitive admin paths (`/ad/`, `/czp-ops-9f2c/`).

### Bulk Actions
- New server functions in `src/lib/products.functions.ts`:
  - `bulkUpdateProducts`: Handles status, category, and other shared flag updates.
  - `bulkRecycleProducts`: Moves a list of IDs to the Recycle Bin.
- Frontend State:
  - `selectedIds`: State array to track selections.
  - `BulkActionsBar`: New sub-component in `src/routes/_authenticated/ad/products.tsx`.

## Verification Plan

### Automated Tests
- Test sitemap generation: `curl http://localhost:8080/api/public/sitemap.xml` and verify XML structure.
- Test robots.txt: `curl http://localhost:8080/api/public/robots.txt` and verify Disallow rules.
- E2E Playwright test for bulk selection and status toggle in the admin panel.

### Manual Verification
- Check the sitemap URL in the browser.
- Select 3 products in the Admin Panel and change their status to "Inactive"; verify they are hidden from the storefront.
- Select 2 products and move them to the Recycle Bin; verify they appear in the Recycle Bin.
