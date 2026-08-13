# Developer Notes — Customz Paradise BD

## Implementation Status
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

## Recent Changes (Aug 14, 2026)
- **Invoice Configuration**: Added an Invoice Settings panel to the Admin Dashboard. Super Admins/Admins can now customize the invoice prefix (e.g., "CZP") and the sequence starting number.
- **Atomic Invoice Generation**: Implemented a database sequence and `SECURITY DEFINER` trigger to ensure sequential, collision-free invoice IDs (e.g., CZP-01, CZP-02) even during concurrent order placement.
- **Staff Management Updates**: Implemented 'Delete', 'Reset Password', 'Edit Name', and 'Add User' capabilities for Super Admins/Admins. Corrected profile name display to reflect the authenticated user.
- **Admin UI Hardening**: Restricted "Staff & Roles" and "SteadFast Courier/API settings" to Super Admin and Admin roles only. Staff users are now correctly redirected if they attempt to access these sections directly via URL.

## Recent Changes (Aug 13, 2026)
- **Full Responsiveness**: Executed a comprehensive responsiveness audit across the entire website. Refactored the About Us, Bike Models, Product Browser, Store Coming Soon, Contact Us, and Social sections to ensure clean layouts and proper stacking on mobile, tablet, and desktop viewports. Added safe-area padding and responsive typography.
- **Mobile Product Card Optimization**: Redesigned the product card layout specifically for mobile (single-column grid). Cards now feature a clear vertical flow: Image → Badges → Name → Description → Price → Color Selection → Action Buttons (Choose Color, Order Now). Ensured full readability of button text and easy-to-tap color selection. Existing tablet/desktop layouts remain unchanged.
- **Product UI**: Added theme-aware outlines (Silver/Gray in Dark Mode, Black/Dark in Light Mode) to all product color selection circles.
- **About Us Section**: Removed the feature cards (Premium Quality, Unique Designs, etc.) while keeping the brand story and tagline.
- **Store Coming Soon**: Removed the estimated launch date (Q3 2026) from the "Physical Store Coming Soon" section on the landing page.
- **Security Hardening**: Resolved automated scan findings. Refactored database migrations to remove `GRANT ALL` in favor of granular permissions. Standardized staff authorization checks across server functions and RLS policies. Hardened the owner account identification logic.
- **SteadFast API Integration**: Completed the SteadFast courier integration with full support for the `Api-Key` and `Secret-Key` authentication headers.
- **Connection Testing**: Added a "Test Connection" button in Admin Settings to verify API credentials without placing real orders.
- **API Visibility**: Implemented a "Recent API Activity" log table in the courier settings panel to debug integration issues.
- **Shipment Management**: Added a "Cancel Shipment" capability to individual orders in the admin list.
- **Admin Theme & Utilities**: Integrated theme toggle and live Asia/Dhaka clock into the Admin Header.
- **RBAC Hardening**: Restricted the "Staff & Roles" section to Super Admin and Admin roles only.
- **Staff Management**: Implemented 'Delete', 'Reset Password', 'Edit Name', and 'Add User' capabilities for Super Admins/Admins.

- **Modern Admin UI Refresh**: Implemented a "3D Floating" button design system across the Admin Panel. Buttons now feature generous padding, pill-style rounded corners, and subtle top highlights with soft drop-shadows for a modern, tactile feel.
- **Admin Button States**: Primary actions use the brand red with enhanced depth, while secondary actions utilize a sleek steel/onyx gradient with multi-layered shadows.

## Recently Completed
- **User Profile Widget**: Implemented a dynamic User Profile Widget in the Admin sidebar.
  - Features dynamic 3D illustrated avatars via DiceBear based on user name/gender.
  - Allows users to customize their profile (Edit Name, Select Gender, Upload Custom Photo).
  - Profile data is securely stored in `profiles` table and `avatars` storage bucket with full RLS.
- Optimized product cards for mobile with a specific vertical order.
- Comprehensive responsiveness audit: Fixed grid gap inconsistencies and refined mobile layouts.

## Next Steps
- Implement detailed Product Inventory tracking.
- Enhance Admin Analytics dashboard with sales charts.
- Integrate remaining courier service webhooks for real-time tracking updates.
