# Developer Notes
Project: CUSTOMZ PARADISE BD
Author: Rafi Gazi (Rabbee) Apps

## Completed Milestones
- [x] Initial design system and brand integration.
- [x] Advanced Admin Dashboard with Recharts metrics.
- [x] Sequential Invoice Generation (CZP-XX).
- [x] Customer Fraud Marking System.
- [x] SteadFast Courier Bulk Booking & Tracking.
- [x] Dynamic Bike Model Management.
- [x] Responsive Product Card & Storefront refactor.
- [x] Project Attribution & Documentation Cleanup (Aug 2026).
- [x] Implemented API Rate Limiting and Login Throttling.
- [x] Hardened Security Headers (CSP, HSTS, XSS Protection).
- [x] Created Admin Security Events page for monitoring throttling activity.
- [x] Hardened backend authorization logic and database grants based on security scan (Aug 2026).
- [x] **Smooth Custom Cursor:** Implemented a minimal Cyan Blue (#06B6D4) following ring with smooth interpolation site-wide and in Admin panel (Aug 15, 2026).
- [x] **Responsive Order Animation:** Updated Order Confirmation animation to be fully responsive (320px to 640px max-width) and set to infinite loop (Aug 15, 2026).
- [x] **Product Form Enhancements:** Added inline validation, placeholders, examples, and image guidelines to Admin Product Form (Aug 15, 2026).
- [x] **Staff Login Approval System:** Implemented mandatory per-login administrator approval for Staff users with real-time status polling, request expiration (10m), and comprehensive audit logging (Aug 15, 2026).
- [x] **Customer Data Management & Recycle Bin:** Created a dedicated `customers` table populated from orders, with a secure soft-delete (Recycle Bin) system. Restricted delete/restore/purge actions to Admin and Super Admin roles only, ensuring data preservation for order history (Aug 15, 2026).
- [x] **Admin Customer Filtering & Pagination:** Added robust search (name, phone, email, location), status filters (All, Active, Fraud), and pagination to the Admin Customers list (Aug 15, 2026).
- [x] **Customer Audit Trail:** Enabled a secure, Admin-only audit trail view for customer records, tracking sensitive operations (delete, restore, purge, profile edits) including IP tracking, delete reasons, and profile diffing (Aug 15, 2026).
- [x] **Bulk Customer Actions:** Implemented checkbox selection and bulk soft-deletion (Recycle Bin) for customer records, restricted to Admin/Super Admin roles (Aug 15, 2026).
- [x] **SteadFast Success Counter:** Integrated a dedicated "SteadFast Success" metric on the Admin Dashboard to track confirmed API bookings, including a details popup showing the last successful submission timestamp and order reference (Aug 15, 2026).
- [x] **Audit Trail UI Enhancements:** Added real-time search and pagination to the Admin Customer Audit Trail modal for improved performance on mobile and large datasets (Aug 15, 2026).
- [x] **Environment Indicator & Safety Banner:** Implemented automatic environment detection (Staging vs. Production) with a high-visibility warning banner in the Admin Panel to prevent accidental destructive actions in non-live environments (Aug 15, 2026).
- [x] **Migration Readiness:** Authored `MIGRATION_GUIDE.md` and `ENV_TEMPLATE.md`. Generated a lossless SQL replay package in `supabase/exports/` including schema, data, and sequence synchronization (Aug 15, 2026).
- [x] **Bug Fix:** Resolved 500 error in `getHeroSlides` by moving `supabaseAdmin` import inside the handler to prevent SSR environment variable resolution issues.
- [x] **Admin Logo Optimization:** Enhanced Admin Panel logo with responsive sizing (h-10 to h-20) for better visibility and visual balance on larger desktop screens (Aug 15, 2026).

## Documentation Strategy
- Use JSDoc for complex server functions and components.
- Maintain strict RBAC (Super Admin/Admin/Staff).
- All orders must follow the verified server-side pricing logic.