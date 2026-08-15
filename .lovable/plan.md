# SEO-Friendly URLs and Image Optimization Plan

Implement SEO-friendly keyword-based slugs for all products and bike models to improve search engine rankings. Optimize storefront images (hero, products, bike models) with responsive sizes, proper alt text, and lazy loading to enhance performance and SEO.

## User Review Required

> [!IMPORTANT]
> The current bike models and products use static IDs/slugs from `src/data/catalog.ts`. I will be updating these to be more descriptive and keyword-rich (e.g., `yamaha-r15-v4-modification-parts` instead of `r15-v4`). Existing bookmarks to the old URLs will break, but SEO will improve significantly.

## Proposed Changes

### SEO & URLs
- **Bike Model Slugs**: Update `src/data/catalog.ts` to use keyword-rich slugs for bike models (e.g., `pulsar-n160-parts-bd`).
- **Product Slugs**: Update `src/data/catalog.ts` to use keyword-rich slugs for products (e.g., `sequential-led-indicator-motorcycle`).
- **Metadata Enhancement**: Standardize `head()` metadata across all routes to include clear keywords and absolute canonical URLs.

### Image Optimization
- **SafeImage Component**: Refine `SafeImage.tsx` to ensure all storefront images use WebP by default, provide proper `sizes` and `alt` text, and utilize `loading="lazy"` (except for hero images).
- **Hero Slider**: Optimize hero slides with explicit width/height to prevent layout shifts (CLS) and use `priority` for the first slide.
- **Product Cards/Details**: Ensure product images have descriptive `alt` tags derived from product metadata.

### Technical Details
- Update `src/data/catalog.ts` bike and product data.
- Refactor `SafeImage.tsx` if necessary for better WebP handling.
- Audit and update `head()` functions in:
  - `src/routes/index.tsx`
  - `src/routes/shop.tsx`
  - `src/routes/products.$slug.tsx`
  - `src/routes/bike-models.$slug.tsx`
  - `src/routes/new-arrivals.tsx`
  - `src/routes/gallery.tsx`
  - `src/routes/about.tsx`
  - `src/routes/contact.tsx`
