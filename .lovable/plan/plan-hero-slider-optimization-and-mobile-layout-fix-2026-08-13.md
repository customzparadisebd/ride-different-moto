# Plan: Hero Slider Optimization and Mobile Layout Fix

## Background
The user wants to fix hero banner cropping on mobile, ensuring the full image is visible by adjusting the container height to the image's aspect ratio. Additionally, they require server-side validation and optimization for hero slide uploads (file types, size limits, and resizing).

## User Review Required
> [!IMPORTANT]
> - For image optimization, I will implement a server-side route that processes uploads using standard web APIs.
> - The mobile hero section will change from a fixed height to a dynamic aspect-ratio based height, which might push content further down on very tall mobile images.

## Technical Details

### Frontend Changes
- **`src/components/home/HeroSlider.tsx`**:
  - Update `containerClassName` to use `aspect-[800/1000]` (4:5) for mobile instead of a mix that might crop.
  - Remove `object-cover` on mobile if necessary to prevent cropping, or better, ensure the container's aspect ratio matches the mobile banner (4:5).
  - Use `h-auto` or `aspect-ratio` utility to let the section grow.
- **`src/routes/_authenticated/ad/hero.tsx`**:
  - Replace raw URL input with a file upload component.
  - Implement a `handleFileUpload` function that calls the new API.

### Backend Changes
- **`src/routes/api/hero/upload.ts`** (New):
  - Create a POST handler for image uploads.
  - Implement validation:
    - File type: `image/jpeg`, `image/png`, `image/webp`.
    - Size limit: 2MB.
  - Note: Since `sharp` or `canvas` are unavailable in the Worker runtime, I will use `Image` via `fetch` or simple buffer checks if possible, or advise using a client-side resize before upload if complex resizing is needed. However, Supabase Storage itself can handle resizing via transformation URLs. I will use Supabase Storage with transformations.

### Data Model & Storage
- Ensure Supabase Storage bucket `hero-banners` exists.
- Update `hero_slides` table if `mobile_image_url` is missing (it's already in the types but I should check the DB).

## Operational Security
- Audit log every hero slider change.
- Enforce `super_admin` or `admin` roles for uploads.
