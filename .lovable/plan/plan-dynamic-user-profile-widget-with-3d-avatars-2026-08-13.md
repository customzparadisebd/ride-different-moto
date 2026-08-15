# Plan: Dynamic User Profile Widget with 3D Avatars

Implement a high-fidelity User Profile Widget in the Admin Panel sidebar that features dynamic 3D avatars based on gender/name and allows for easy customization.

## User Review Required

> [!IMPORTANT]
> The profile widget will be placed in the Admin sidebar. It will feature dynamic 3D avatars generated via DiceBear based on the user's name and an optional gender field.

## Proposed Changes

### Database Schema Updates

- Add `gender` (enum/text) and `avatar_url` (text) columns to `public.profiles`.
- Update RLS and GRANTs to allow authenticated users to read and update their own profile fields.

### Backend Functions (`src/lib/admin.functions.ts`)

- Create `updateProfile` server function to handle gender and avatar URL updates.
- Update `getAdminContext` to include `gender` and `avatarUrl`.

### Components

- **UserProfileWidget**: A new component for the `AdminSidebar` header.
  - Circular avatar using DiceBear for default 3D illustrated looks.
  - Bold Full Name and muted Role label.
  - Hover/Click state for editing.
- **AvatarSettingsDialog**: A modal to allow users to:
  - Select gender (triggers new default DiceBear avatar).
  - Upload a custom image (integration with Lovable Cloud Storage).
  - Reset to default.

### DiceBear Integration

- Use the `adventurer` or `avataaars` styles from DiceBear API to match the "3D illustrated" requirement.
- Seed the seed with the user's ID/Name to ensure consistency.

## Technical Details

- **Avatar Generation**: `https://api.dicebear.com/9.x/adventurer/svg?seed={name}&flip={isFemale}`
- **Permissions**: Users can only edit their _own_ avatar and gender.
- **Storage**: Custom uploads go to `avatars` bucket in backend storage.
