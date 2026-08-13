# Developer Notes — Customz Paradise BD

## Implementation Status
- [x] Sticky Navigation Bar (Sticky with Backdrop Blur)
- [x] Home Page Theme: Dark Mode by default with Light Mode toggle
- [x] Product Color Selector: Gray outline for Black/Red/Blue chips on dark backgrounds
- [x] Lead Capture System: Save inquiries to DB, view at /ad/leads, CSV export
- [x] Reviews Management: Staff manage testimonials at /ad/reviews, storefront carousel
- [x] Admin Dashboard: Redesigned Orders board, Live status counts, Bulk actions, Audit logs
- [x] Admin Security: MFA (TOTP), Session Revocation, Login Lockouts (rate limiting)
- [x] Role-Based Access: Super Admin, Admin, Manager, Staff roles implemented
- [x] Staff Management (RESTRICTED): Super Admin/Admin only access. Add/Delete/Reset Password/Edit Name.
- [x] Operational UI: Bangladesh Time (Asia/Dhaka) displayed in Admin Header.
- [x] Staff UI: Super Admin name correctly displayed, Add User button added.

## Recent Changes (Aug 13, 2026)
- **Admin Theme & Utilities**: Integrated theme toggle and live Asia/Dhaka clock into the Admin Header.
- **RBAC Hardening**: Restricted the "Staff & Roles" section to Super Admin and Admin roles only.
- **Staff Management**: Implemented 'Delete' and 'Reset Password' capabilities for high-level admins.
- **Security Logic**: Added server-side authorization checks for email/password-related staff data to prevent lower-level staff from accessing sensitive details.

## Next Steps
- Implement detailed Product Inventory tracking.
- Enhance Admin Analytics dashboard with sales charts.
- Integrate remaining courier service webhooks for real-time tracking updates.
