# Plan: Harmonize MFA with Staff Approval Flow

Ensure the Admin Panel access flow correctly sequences MFA and Staff Approval while maintaining existing security controls and RBAC.

## User Review Required

> [!IMPORTANT]
> The current "Staff Approval System" involves a per-session `login_approvals` check (which expires in 10 minutes) AND a persistent `access_status` check in the profile. This plan preserves both: `access_status` controls overall account validity (Active/Pending/Suspended), while the 10-minute approval flow provides just-in-time session verification.

- **Access Flow:** Login → MFA → Staff Approval (10m request) → Dashboard.
- **Persistent Status:** Accounts with `access_status = 'pending'` remain blocked even if MFA is successful.

## Proposed Changes

### Backend Logic Refinement

#### `src/routes/_authenticated/ad/route.tsx`

- Reorder the gate sequence:
  1. Revocation check (session validity).
  2. **MFA check** (identity verification).
  3. **Staff Status check** (account approval).
  4. **Login Approval check** (10-minute session approval).
- Ensure `mfaSatisfied` is required _before_ any staff status or session approval logic is considered terminal.

#### `src/lib/admin.server.ts`

- Audit `resolveActor` to ensure `isStaff` is strictly `roles.length > 0 && status === 'approved'`.
- Ensure `loginApprovalPending` logic correctly respects the `pending` status of new accounts.

### UI Improvements

#### `src/routes/_authenticated/ad/staff.tsx`

- Refine the status management UI to clearly distinguish between **Account Status** (Permanent: Approved, Suspended, etc.) and **Session Approval** (Temporary: 10m window).
- Ensure Super Admins can easily Reject/Suspend accounts, which will immediately revoke all active sessions for that user.

#### `src/routes/ad.log.tsx`

- Ensure the "Waiting for Approval" screen only appears _after_ identity (Login + MFA) is fully established.

### Technical Details

- **MFA Policy:** `mfa_required` remains `true` for all staff. Supabase AAL2 is the baseline for identity.
- **RBAC:** Roles (Super Admin, Admin, Manager, Staff) and permissions remain unchanged.
- **Audit Logs:** All status changes (Approve, Reject, Activate, Deactivate, Suspend) are recorded in `admin_audit_log`.

## Verification Plan

### Automated Tests

- Run `lovable-exec test` to verify no regressions in RBAC permissions.
- Verify `assertAccess` logic in `admin.server.ts` via unit tests if applicable.

### Manual Verification

- Sign in with a new staff account: Verify it triggers MFA first, then shows "Pending Approval" (if not yet approved).
- As Super Admin: Approve the account. Verify the staff user is then redirected to the Dashboard.
- As Super Admin: Suspend the account. Verify the staff user is immediately kicked out to a "Denied" page.
