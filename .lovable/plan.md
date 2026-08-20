# Plan: Bike Model Management Implementation

Implement full CRUD management for Bike Models in the Admin Panel to control the "Explore My Bike Models" and "Bike Models" storefront sections.

## Proposed Changes

### 1. Backend: Server Functions
- Update `src/lib/bike-models.functions.ts` to include:
    - `getAdminBikeModels`: Fetch all models including inactive ones.
    - `createBikeModel`: Create a new entry.
    - `updateBikeModel`: Update existing entry.
    - `deleteBikeModel`: Soft-delete or purge entry.
- Ensure all use the `POST` method pattern and include RBAC checks (`products.manage` or `content.manage`).

### 2. Frontend: Admin UI
- Create `src/components/admin/settings/BikeModelsPanel.tsx`:
    - Model listing with sortable rows (drag-and-drop or manual order).
    - Status toggle (Active/Inactive).
    - Dual-mode Image Uploader:
        - Manual upload using `SingleImageUpload` (optimized to WebP).
        - External URL input.
    - Image Specifications Guidance (1200x800px, 3:2 ratio).
    - Real-time preview of the bike model card.
- Integrate into `src/routes/_authenticated/ad/settings.tsx`:
    - Add a "Bike Models" tab to the sub-navigation.
    - Render `BikeModelsPanel` when the tab is active.

### 3. Verification
- Test CRUD operations in the Admin Panel.
- Verify image optimization for manual uploads.
- Confirm storefront updates automatically reflecting Admin changes.

## Technical Details
- **Data Model**: Uses existing `bike_models` table.
- **Image Specs**: 1200x800px recommended for optimal quality/performance across desktop and mobile.
- **Security**: All management functions require authenticated staff sessions with appropriate permissions.
