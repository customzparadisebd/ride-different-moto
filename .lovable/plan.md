# Staff Management Implementation Plan

Upgrade the Staff & Roles section with a professional "Add User" form, activity logging, and enhanced user management based on the reference design.

## User Interface

- **Add User Dialog**: Replace `window.prompt` workflow with a custom `Dialog` component.
  - Fields: Full Name (req), Email (req), Phone (opt), Password (req, toggle), Role (req), Status (req).
  - Validation: Ensure email format, name length, and password strength.
- **Staff List Table**: Redesign as a high-density table.
  - Columns: SL, Image/Avatar, Name (inc. Email/Phone), Last Login IP, Status (Active/Inactive badge), Actions (Edit, Delete, Activity).
- **Activity Log View**: Add a dialog to view a specific user's audit trail.
  - Format: `[User] → [Action] → [Time] → [Date]` (e.g., `Rafi → Created Order #1024 → 7:42 PM → 13 Aug 2026`).

## Backend & Database

- **Profile Schema Update**: Add `phone_number` and `last_login_ip` to `public.profiles`.
- **IP Tracking Logic**: Update `recordSignIn` and `resolveActor` to automatically capture and store the current request IP.
- **Activity Logging**: Ensure all staff-related actions (create, status change, password reset) are correctly emitted to `admin_audit_log`.
- **Server Functions**:
  - `createStaff`: Update to handle optional phone and explicit status.
  - `listStaff`: Include last login IP and more profile metadata.
  - `getStaffActivity`: New function to fetch filtered audit logs for a specific user.

## Security

- **Status Enforcement**: Ensure `AccessError` correctly blocks `inactive`, `suspended`, or `revoked` users.
- **RBAC Enforcement**: Hard-code role-based access to the Staff management section (Super Admin/Admin only).

## Technical Details

- Use `@tanstack/react-query` for data fetching and invalidation.
- Use `lucide-react` for iconography.
- Formatting: All timestamps should use `Asia/Dhaka` time for the UI.
- Permissions: Use `PERMISSIONS.staffManage` for all mutations.
