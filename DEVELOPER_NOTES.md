# Developer Notes — Customz Paradise BD

## Implementation Status
- [x] Customer Fraud Marking System: Flag suspicious phone numbers with Red/Warning badges
- [x] Customer Order History: Clicking "Total Orders" in Admin opens a detailed order summary popup
- [x] Order Notes: Dedicated blue Note button in Admin for customer messages
- [x] Invoice Sequence: Automatic Prefix-Number generation (e.g., CZP-01)
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
- **Customer Fraud Marking System**: Implemented a professional fraud detection system linked to phone numbers. Admins can mark customers as "Fraud" or "Warning" with mandatory notes. Warnings appear automatically in the Order List, Order Details, and Customer Management.
- **Invoice Configuration**: Added an Invoice Settings panel to the Admin Dashboard. Super Admins/Admins can now customize the invoice prefix (e.g., "CZP") and the sequence starting number.
- **Atomic Invoice Generation**: Implemented a database sequence and `SECURITY DEFINER` trigger to ensure sequential, collision-free invoice IDs (e.g., CZP-01, CZP-02) even during concurrent order placement.
- **Staff Management Updates**: Implemented 'Delete', 'Reset Password', 'Edit Name', and 'Add User' capabilities for Super Admins/Admins. Corrected profile name display to reflect the authenticated user.
- **Admin UI Hardening**: Restricted "Staff & Roles" and "SteadFast Courier/API settings" to Super Admin and Admin roles only. Staff users are now correctly redirected if they attempt to access these sections directly via URL.
- **Full Responsiveness**: Executed a comprehensive responsiveness audit across the entire website. Refactored sections to ensure clean layouts and proper stacking on mobile, tablet, and desktop viewports.

## Next Steps
- Implement detailed Product Inventory tracking.
- Enhance Admin Analytics dashboard with sales charts.
- Integrate remaining courier service webhooks for real-time tracking updates.
