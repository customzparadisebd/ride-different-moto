# Plan: Product Video Integration

Add an optional product video feature that allows admins to toggle and configure videos for individual products, which then appear as a watchable card/modal on the product details page.

## Database Changes

1.  **Extend `products` table**:
    *   `video_enabled`: boolean (default false)
    *   `video_platform`: text (enum: youtube, facebook, instagram, tiktok)
    *   `video_url`: text
2.  **Apply Migration**: Update the database schema and RLS grants.

## Backend Development

1.  **Update `src/lib/products.shared.ts`**:
    *   Add video fields to `productInput` Zod schema.
    *   Update `productToRow` and `PRODUCT_COLUMNS` constants.
2.  **Update `src/lib/storefront.shared.ts`**:
    *   Add video fields to `StorefrontProduct` type.
3.  **Update `src/lib/storefront.server.ts`**:
    *   Include video fields in `PRODUCT_FIELDS` query string.
    *   Map video fields in `toProduct` converter.

## Admin Panel Improvements

1.  **Update `src/components/admin/products/ProductForm.tsx`**:
    *   Add "Product Video" section with Toggle (ON/OFF).
    *   Add conditional fields for Video Platform (Select) and Video URL (Input).
    *   Implement video preview using platform-specific embed logic.
2.  **Update `src/routes/_authenticated/ad/products.tsx`**:
    *   Map video fields in `toFormValue` converter.
    *   Update `ProductRow` type.

## Storefront Enhancements

1.  **Create `src/components/product/ProductVideo.tsx`**:
    *   Component to display the "Watch Product Video" card.
    *   Handle platform-specific thumbnail/icon logic.
2.  **Create `src/components/product/VideoModal.tsx`**:
    *   Responsive modal to embed and play the video (YouTube iframe, etc.).
3.  **Update `src/routes/products.$slug.tsx`**:
    *   Conditionally render `ProductVideo` section below product description if `videoEnabled` is true.

## Technical Details

*   **Video Embedding**: Support standard URL formats for YouTube, Facebook, Instagram, and TikTok.
*   **Responsiveness**: Ensure the video modal scales correctly for all device sizes.
*   **Branding**: Use CZP brand colors (True Red, Steel, Onyx) for the video section UI.
