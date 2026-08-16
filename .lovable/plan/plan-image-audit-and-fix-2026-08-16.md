# Plan: Image Audit and Fix

Audit all existing image areas across the website and fix missing, blank, or broken images by assigning appropriate, optimized assets.

## Audit Findings
- **Products**: 13 products lack a main `image_url` and gallery `images` (e.g., X-3 Kit, KTM RC Underbelly, CZP DRL).
- **Bike Models**: All 14 bike models (e.g., Pulsar N160, Yamaha R15 V4) have `NULL` image URLs.
- **Hero Slider**: Current slides have images, but some rely on external Supabase storage which should be verified for accessibility.
- **Categories/Brands**: Categories lack image fields, and the brands table is empty.

## Proposed Fixes

### 1. Database Updates
Assign high-quality, relevant motorcycle and parts images to missing entries using stable, optimized URLs.
- **Bikes**: Assign specific model images (Pulsar, Yamaha, KTM, etc.) to the `bike_models` table.
- **Products**: Assign appropriate parts images (body kits, lighting, accessories) to the `products` table.
- **Hero Slides**: Ensure all slides have fallback `mobile_image_url` values.

### 2. Frontend Improvements
- Ensure `SafeImage` is used for all image renders to provide graceful failure and lazy loading.
- Add responsive `sizes` attributes to images in `ProductCard` and `BikeModelCarousel` to optimize for mobile/tablet/desktop.

### 3. Image Optimization Strategy
- Use `WebP` format where possible (via CDN parameters if available, or by selecting WebP sources).
- Implement `loading="lazy"` for off-screen images.
- Set explicit aspect ratios to prevent Layout Shift (CLS).

## Technical Details

### SQL Migration
- I will execute a series of `UPDATE` statements to fill missing `image_url` fields with high-quality, optimized Unsplash URLs specifically tailored to the bike models and product types.
- For bike models, I will use specific sport bike and commuter bike imagery.
- For products, I will use detailed motorcycle component photography (lighting, body kits, exhaust, etc.).

### Component Adjustments
- Update `src/components/SafeImage.tsx` to handle `sizes` and `priority` props.
- Update `src/components/ProductCard.tsx` and `src/components/home/BikeModelCarousel.tsx` to pass optimal sizes.
