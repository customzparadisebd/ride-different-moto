# Plan: Enhance 360° Product Viewer System

Optimize the 360° Product Viewer with advanced admin controls, bulk sequence management, lazy loading, and improved accessibility.

## User Review Required

> [!IMPORTANT]
>
> - Bulk uploading requires pasting a list of URLs (one per line).
> - Dimension validation is client-side based on image metadata.

## Proposed Changes

### Database & Backend

- **Bulk Sequence Management:**
  - Add `saveProduct360Sequence` server function to handle bulk inserts/updates.
  - Implement reordering logic within the bulk function for efficiency.
- **Image Validation:**
  - Update `product360ImageInput` schema with strict validation for dimensions and file size.

### Admin Panel (CZP Ops)

- **Bulk Sequence Uploader:**
  - Create `Bulk360Uploader` component to accept a list of image URLs.
  - Implement sequence auto-ordering based on URL patterns (e.g., `frame-01`, `frame-02`).
- **Interactive Preview & Frame Scrubber:**
  - Add a mini-viewer to `Product360Panel` with a horizontal scrubber for frame-by-frame verification.
  - Real-time preview of the reordered sequence.
- **Validation Feedback:**
  - Add pre-save validation for dimensions (1000x1000px), format (WebP recommended), and total sequence size.

### Storefront & Viewer

- **Lazy Loading & Caching:**
  - Implement progressive loading: load key frames first (0, 90, 180, 270 degrees) then the rest.
  - Use `IntersectionObserver` to trigger preloading only when the viewer is in/near the viewport.
  - Optimize browser caching via standard headers.
- **Accessibility Hardening:**
  - Add full keyboard support (Left/Right arrows for rotation).
  - Enhance ARIA attributes for the drag interaction and rotation state.
  - Add clear focus indicators for the viewer toggle and controls.

## Technical Details

### Performance

- Use `requestAnimationFrame` for smooth scrubber updates.
- Sequence loading will prioritize the current frame and its neighbors.

### Security

- Server-side re-validation of sequence ownership and permissions.
- Sanitization of all provided URLs.
