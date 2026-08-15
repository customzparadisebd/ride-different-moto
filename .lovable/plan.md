# Product Image Upload Implementation Plan

Add manual product image upload functionality to the Admin Panel, enabling direct file selection from the computer for both the main image and the gallery sequence.

## User Review Required

> [!IMPORTANT]
> - I will use the **Lovable Cloud (Supabase) Storage** bucket named `products`. I'll assume this bucket exists or will be auto-created by the system's storage integration.
> - Recommended image specs: **1000x1000px WebP, <500KB**.
> - The implementation will handle both the **Main Image** (single) and the **Gallery Images** (multiple).

## Proposed Changes

### 1. Backend/Storage (Implicit)
- Use standard `supabase.storage.from('products').upload()` for handling file uploads.
- Files will be stored with a path structure like `products/${productId}/${filename}` or `temp/${filename}` if the product ID is not yet available.

### 2. New Component: `ProductImageUpload.tsx`
- Create a dedicated component for image uploading.
- **Features:**
  - Drag-and-drop or file selection.
  - Image preview for both single and multi-image modes.
  - Recommended dimensions and size label (1000x1000px, WebP, <500KB).
  - Validation: Format (WebP/JPG/PNG), Size limit, and Aspect Ratio check (optional but recommended for "Visual Quality").
  - Actions: Remove, Replace, and Reorder (for gallery).

### 3. Update `ProductForm.tsx`
- **Replace/Augment Main Image URL Field:** Add an "Upload" button next to the existing URL input to allow direct file selection.
- **Replace Gallery Textarea:** Replace the "Gallery image URLs" textarea with the new `ProductImageUpload` component in multi-mode.
- **Validation Integration:** Ensure the form validates that at least a main image is present (via URL or upload result).
- **Preserve Existing Functionality:** Keep the URL inputs functional for users who still prefer pasting external links.

### 4. Admin Logic
- Update the submission flow:
  - If new images are uploaded, they are transferred to the final storage path (if necessary) before saving the product record.
  - Update the `imageUrl` and `images` (array) fields with the permanent Supabase public URLs.

## Technical Details
- **Storage Path:** `public/product-images/`
- **Allowed Formats:** `.webp`, `.jpg`, `.jpeg`, `.png`.
- **Max Size:** 2MB (with a warning if > 500KB).
- **Tools:** `lucide-react` for icons, `sonner` for error toasts, `framer-motion` for smooth reordering (if applicable).
