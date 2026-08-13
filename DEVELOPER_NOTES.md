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
- [x] Courier Integration (SteadFast): Bulk booking, Tracking, Cancellation, Connection Testing, and API Logs.

## Recent Changes (Aug 13, 2026)
- **About Us Section**: Removed the feature cards (Premium Quality, Unique Designs, etc.) while keeping the brand story and tagline.
- **Store Coming Soon**: Removed the estimated launch date (Q3 2026) from the "Physical Store Coming Soon" section on the landing page.
- **SteadFast API Integration**: Completed the SteadFast courier integration with full support for the `Api-Key` and `Secret-Key` authentication headers.
- **Connection Testing**: Added a "Test Connection" button in Admin Settings to verify API credentials without placing real orders.
- **API Visibility**: Implemented a "Recent API Activity" log table in the courier settings panel to debug integration issues.
- **Shipment Management**: Added a "Cancel Shipment" capability to individual orders in the admin list.
- **Admin Theme & Utilities**: Integrated theme toggle and live Asia/Dhaka clock into the Admin Header.
- **RBAC Hardening**: Restricted the "Staff & Roles" section to Super Admin and Admin roles only.
- **Staff Management**: Implemented 'Delete', 'Reset Password', 'Edit Name', and 'Add User' capabilities for Super Admins/Admins.

## Next Steps
- Implement detailed Product Inventory tracking.
- Enhance Admin Analytics dashboard with sales charts.
- Integrate remaining courier service webhooks for real-time tracking updates.
