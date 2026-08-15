# Plan: Featured Products Admin Management

Implement an admin panel to manage the homepage "Featured & Best Deals" section, allowing for product selection, sort ordering, and promotional labels without code changes.

## User Review Required

> [!IMPORTANT]
>
> - Should "Featured" and "Best Deals" be managed as two separate lists or one combined section as it currently appears on the homepage?
> - Do you want a dedicated "Promotional Label" field per featured product (e.g., "50% OFF", "NEW ARRIVAL"), or should it use the existing product badge system?

## Proposed Changes

### Database & Backend

- Verify/Update `products` table schema to ensure `sort_order` is consistently applied for featured items.
- Create `listFeaturedProducts` server function for admin use, supporting sorting and flag management.
- Add `updateFeaturedProduct` server function to manage specific featured properties.

### Admin Panel

- Create a new Admin route: `/ad/featured`.
- Implement a drag-and-drop or priority-based sorting interface for products flagged as `is_featured` or `is_best_deal`.
- Add a quick-toggle interface to add/remove products from the featured section.
- Allow editing promotional labels (badges) directly from this view.

### Storefront

- Update the homepage to fetch "Featured & Best Deals" items dynamically using the new sorting and filtering logic.

## Technical Details

- **Tables**: `products` (using `is_featured`, `is_best_deal`, `sort_order`, `badge_text`).
- **Server Functions**: New functions in `src/lib/products.functions.ts`.
- **Admin UI**: New page at `src/routes/_authenticated/ad/featured.tsx` using `@dnd-kit` (if available) or a simple position-input system.
- **Storefront**: Updates to `src/routes/index.tsx`.
