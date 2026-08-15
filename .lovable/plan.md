# Plan: 360° Product Viewer System

Add an optional 360° image sequence viewer to products, with full admin control over activation and image management.

## Proposed Changes

### Database Schema
- **`public.products`**: Add `has_360_view` boolean column.
- **`public.product_360_images`**: New table for the image sequence (`product_id`, `image_url`, `display_order`).
- **RLS**: Enable RLS and add policies for public reading and admin management.

### Admin Panel
- **Product Form**: Add a toggle for "Enable 360° View".
- **Product 360 Management**: Create `Product360Panel.tsx` (similar to `ProductColorsPanel`) to:
  - Upload/Add 360° images by URL.
  - Reorder images via drag-and-drop or index.
  - Display clear guidelines: 24-36 images recommended, 1000x1000px WebP, <150KB per frame.
- **Server Functions**: Add `listProduct360Images`, `saveProduct360Image`, `deleteProduct360Image`, and `reorderProduct360Images` to `src/lib/products.functions.ts`.

### Storefront
- **Product Card**: Display a subtle "360°" icon if enabled.
- **Product Page**: 
  - Show a prominent "360° View" button below the main gallery if enabled.
  - Implement `Product360Viewer.tsx` using a lightweight image-sequence logic (no heavy libraries).
  - Open viewer in a modal/overlay with smooth drag/swipe support.

## Technical Details
- **Viewer Logic**: A simple React component that preloads the image sequence and changes the visible index based on horizontal drag distance or swipe velocity.
- **Responsiveness**: Modal will be full-screen on mobile and centered on desktop.

## Implementation Steps

1. **Database Migration**: Run SQL to add the new table and columns.
2. **Backend Logic**: Update `products.shared.ts` and `products.functions.ts` with Zod schemas and server functions.
3. **Admin UI**: 
   - Update `ProductForm.tsx` with the toggle.
   - Build `Product360Panel.tsx`.
   - Update `products.tsx` (Admin list) to add a "360 View" button to the row actions.
4. **Frontend Components**:
   - Build `Product360Viewer.tsx`.
   - Update `ProductCard.tsx` and `products.$slug.tsx` to integrate the icon and viewer.
5. **Notes**: Update `DEVELOPER_NOTES.md`.
