# Plan: Professional Image Audit and Workflow Enhancement

Audit all Bike and Product image assignments to ensure every model is matched with its correct high-quality visual, prioritizing existing model-specific imagery, followed by appropriate demo/generated visuals. Enhance the admin workflow for code-free visual management.

## Technical Details

### 1. Database Image Audit & Synchronization
- Execute a comprehensive SQL migration to:
  - Correct misaligned product images (e.g., replacing generic placeholders with model-specific bike parts).
  - Populate `public.bike_models` with high-quality, optimized URLs for key models (Pulsar N160, R15 V4, KTM Duke).
  - Link `public.hero_slides` to their corresponding `bike_models` via foreign keys for automated storefront consistency.
- Standardize all image URLs to use optimized formats (WebP/CDN) with appropriate compression for mobile/desktop performance.

### 2. Admin Workflow Enhancements
- **Hero Slider**: Ensure drag-and-drop reordering and manual uploads in `ad/hero` are fully synchronized with the `bike_models` links.
- **Bike Explorer**: Verify that the "Bike Explorer" tab in the admin panel allows full management of card images and sort orders.
- **Product Gallery**: Audit the `ProductForm` to ensure that image reordering and bulk uploads are intuitive and persistent.

### 3. Frontend Optimization & Accessibility
- **Preloading**: Maintain `fetchPriority="high"` and `loading="eager"` for the LCP hero slider images.
- **Responsive Layout**: Ensure `SafeImage` prevents Layout Shift (CLS) by maintaining aspect ratios during lazy loading.
- **SEO/Metadata**: Verify that JSON-LD and OG tags correctly pick up the newly assigned model-specific images.

## User Review Required

> [!IMPORTANT]
> This plan focuses on data alignment and workflow stability. No design changes will be made to the storefront or admin UI layouts.

- Are there specific bike models or products you recently added that require custom images?
- Should we prioritize specific categories (e.g., Exhausts or Graphics) for the high-quality demo images if exact ones aren't found?
