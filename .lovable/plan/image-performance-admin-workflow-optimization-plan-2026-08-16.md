# Image Performance & Admin Workflow Optimization Plan

Improve image loading strategy by prioritizing hero elements and implementing a unified admin image management workflow for products and bikes.

## User Review Required

> [!IMPORTANT]
> - This plan adds manual image reordering for Hero Slides and Bike Models, mirroring the existing Product Gallery logic.
> - Hero Slider images will now use `loading="eager"` and `fetchPriority="high"` for the first slide to improve LCP.

- No changes to visual styles (colors, fonts).
- All image optimizations (WebP, compression) remain handled by the existing Supabase storage/CDN pipeline.

## Proposed Changes

### Frontend Performance
#### [SafeImage & HeroSlider]
- Update `HeroSlider` to explicitly pass `priority` to the first slide's `SafeImage`.
- Ensure `SafeImage` correctly translates `priority={true}` to `loading="eager"`, `fetchPriority="high"`, and `decoding="sync"`.

### Admin Workflow
#### [Bike Models Management]
- Add a new `BikeImageUpload` component (refactored from `ProductImageUpload` for reuse).
- Update the Bike Models admin page to support manual image replacement.

#### [Hero Slider Management]
- Update `AdminHeroSlides` to support reordering slides via drag-and-drop (matching `ProductImageUpload` UX).
- Add support for mobile-specific banner uploads directly in the slide editor.

### Technical Details
- **SafeImage Props**: Added `fetchPriority` support to the `img` tag.
- **Hero API**: Added `reorderHeroSlides` server function.
- **Product Gallery**: Enhanced `ProductImageUpload` to support a `onReorder` callback for immediate DB sync if needed.

## Verification Plan

### Automated Tests
- Run `npm run test` to ensure no regressions in existing image components.
- Verify `SafeImage` renders with `loading="eager"` when `priority` is set.

### Manual Verification
1. Open Admin Panel > Homepage Visuals.
2. Reorder Hero Slides and verify the storefront reflects the new order.
3. Replace a Bike Model image and verify the "Explore Bikes" section updates.
4. Inspect the home page LCP element (Hero Slider) to confirm `fetchpriority="high"` is present.
