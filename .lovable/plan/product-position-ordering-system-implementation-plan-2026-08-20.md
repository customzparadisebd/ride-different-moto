# Product Position / Ordering System Implementation Plan

Implement a manual drag-and-drop ordering system for products using the existing `sort_order` column in the `products` table. This will allow administrators to control the exact display order of products on both the Admin Panel and the storefront.

## User Review Required

> [!IMPORTANT]
> The ordering UI will be a new tab in the **Store Settings** page (`/ad/settings?tab=product-order`), rather than modifying the main Product List table, to provide a clean drag-and-drop workspace similar to the "Bike Model Arrangement" interface.

- **Ordering UI**: Should I group products by category for ordering, or provide a single global list of all products? (Default: Global list for maximum control).

## Proposed Changes

### Database & Shared Logic
- **`src/lib/products.shared.ts`**: Add `reorderProductsInput` Zod schema and export `PRODUCT_ORDER_COLUMNS`.
- **`src/lib/products.functions.ts`**: Implement `reorderProducts` server function to update `sort_order` for multiple products atomically.
- **`src/lib/products.server.ts`**: (If exists/used) Ensure queries use `sort_order ASC, created_at DESC`.

### Admin Panel Improvements
- **`src/components/admin/settings/ProductOrderPanel.tsx`**: Create a new component using `@dnd-kit` for drag-and-drop product ordering, featuring:
  - Product thumbnails and basic info.
  - Drag handle and Up/Down arrows.
  - Search/Filter to find products quickly within the ordering list.
  - "Save New Order" button.
- **`src/routes/_authenticated/ad/settings.tsx`**: Add the "Product Order" tab to the settings sidebar.
- **`src/lib/products.functions.ts`**: Update `listProducts` to optionally sort by `sort_order`.

### Storefront Integration
- **`src/lib/storefront.server.ts`**: Update `fetchActiveProducts` and `fetchProductBySlug` to order results by `sort_order ASC, created_at DESC`.
- **`src/lib/sections.server.ts`**: Ensure homepage sections (Featured, Best Deals) respect the `sort_order`.

## Technical Details
- **Sequencing**: When a new product is added, it will default to `sort_order = 0`. The system will treat 0 as "last" or use the highest current `sort_order + 1` to ensure new items don't break existing arrangements.
- **Performance**: Use specific column selects (`PRODUCT_ORDER_COLUMNS`) for the ordering UI to keep the payload light.

## Verification Plan
- **Admin**: Verify dragging product A above product B and clicking "Save" persists the change.
- **Storefront**: Confirm the "All Products" section on the landing page reflects the new order immediately.
- **Edge Case**: Add a new product and verify it appears at the end of the list by default (or as defined).
- **Audit**: Check that reordering actions are recorded in the Admin Audit Log.
