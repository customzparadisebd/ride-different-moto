# Plan: RBAC & Personal Security Management

Implement role-based access control and a personal security page for TOTP/recovery management.

## User Review Required

> [!IMPORTANT]
> The staff management UI will now include a granular permission selector for Admin/Super Admin roles to customize what specific staff members can do.

- Should Managers be allowed to manage products by default, or should that be an explicit permission grant? (Defaulting to allowed for now).

## Proposed Changes

### Database & Security

#### [SQL Migration]
- Verify `user_permissions` table exists and has RLS.
- Ensure `has_role` and `has_permission` security-definer functions are available for RLS policies.
- Grant `SELECT, INSERT, DELETE` on `user_permissions` to `service_role`.

### Admin Features

#### [Staff Management]
- Create `src/components/admin/UserPermissionsDialog.tsx` to allow Admins to toggle individual permissions for a staff member.
- Update `src/routes/_authenticated/ad/staff.tsx` to include an "Edit Permissions" action.
- Update `src/lib/admin.functions.ts` with `setStaffPermissions` server function.

#### [Personal Security]
- Enhance `src/routes/_authenticated/ad/security.tsx` to explicitly highlight TOTP management and recovery code regeneration for the logged-in user.
- Add "Regenerate Recovery Codes" prominently with a confirmation step.
- Ensure the "Admin Access Information" card is strictly limited to Super Admins.

### Refactoring & Polish

#### [Permissions Logic]
- Audit `effectivePermissions` in `src/lib/admin.server.ts` to ensure it correctly merges role defaults with explicit grants.
- Verify `assertAccess` covers all sensitive operations.

## Technical Details

- **RBAC Model**: Hybrid (Role-based baseline + User-specific overrides).
- **Audit Logging**: Every permission change or MFA reset will be logged with actor, target, and old/new values.
- **MFA Flow**: Supabase MFA (TOTP) + custom backup code hashing (SHA-256).

## Constraints & Assumptions

- User-uploads logo will be used correctly in the `AdminSidebar`.
- MFA is mandatory for all staff as per previous implementation.
