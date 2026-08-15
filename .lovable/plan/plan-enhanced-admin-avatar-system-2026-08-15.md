# Plan: Enhanced Admin Avatar System

Implement a professional and flexible avatar system exclusively for Admin Panel users, featuring preset options and custom manual uploads with strict visual guidelines.

## User Review Required

> [!IMPORTANT]
> This system is strictly for **Admin Panel users** and will not affect the customer-facing website. The avatars will be stored in a dedicated `avatars` bucket in the database.

- **Preset Avatars**: I will provide a curated selection of professional styles (e.g., Minimalist, 3D Professional, Tech) that users can choose from.
- **Custom Uploads**: Users can upload their own images with real-time optimization.

## Proposed Changes

### Database & Backend
- Ensure the `avatars` storage bucket is properly configured for Admin access.
- Use the existing `updateAdminProfile` server function to handle avatar URL updates.

### Frontend Components

#### `src/components/admin/UserProfileWidget.tsx`
- **Redesign the Profile Dialog**:
  - Add a "Choose Preset" section with a grid of professional avatar options.
  - Add a "Manual Upload" section with clear technical guidelines:
    - Recommended: 400x400px (1:1 Ratio).
    - Format: WebP, JPEG, or PNG.
    - Max Size: 1MB (optimized for loading).
  - Implement a "Live Preview" within the dialog before saving.
  - Add functionality to "Replace" or "Remove" custom avatars.

#### `src/components/admin/AdminSidebar.tsx` & `AdminShell.tsx`
- Ensure the avatar displays correctly in the sidebar and header areas.
- Maintain responsive sizing across desktop, tablet, and mobile.

#### `src/routes/_authenticated/ad/staff.tsx`
- Update the staff list table to display the enhanced avatars (presets or custom) for each member.

## Technical Details
- **Optimization**: Client-side resizing and compression before upload to ensure fast panel loading.
- **Avatars**: Leverage high-quality SVGs or optimized WebP assets for presets.
- **Privacy**: Admin avatars are strictly restricted to the admin authentication context.

## Verification Plan

### Automated Tests
- Run `bunx tsgo` to ensure no TypeScript regressions.

### Manual Verification
1. Open Admin Panel and click on the profile widget.
2. Select a preset avatar and verify it updates in the sidebar, header, and staff list.
3. Upload a custom image:
   - Verify size validation (e.g., try uploading a 5MB image).
   - Verify preview updates instantly.
   - Save and verify the URL is correctly stored in the `profiles` table.
4. Remove the custom avatar and verify it reverts to the selected preset or default.
5. Check mobile view to ensure the avatar scales properly in the collapsed sidebar and header.
