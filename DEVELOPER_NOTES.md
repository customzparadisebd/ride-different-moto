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
- [x] **360° Product Viewer System:** Implemented a full-stack image-sequence viewer. Includes a dedicated Admin management panel with bulk URL uploading, an interactive frame scrubber for sequence verification, progressive frame loading (cardinal frames first), and full accessibility support (keyboard nav + ARIA). (Aug 15, 2026).
- [x] **Mandatory MFA Enforcement:** Hardened two-factor authentication requirements, making TOTP enrolment mandatory for all staff roles. Blocked Admin Panel access for sessions below AAL2 assurance (Aug 15, 2026).
- [x] **Granular RBAC System:** Implemented a hybrid role-based and permission-based access control system. Admins can now toggle specific permissions for individual staff members via the new User Permissions UI (Aug 15, 2026).
- [x] **Personal Security Management:** Enhanced the personal security page for administrators to manage their own MFA settings and securely regenerate backup recovery codes with a verified confirmation flow (Aug 15, 2026).
- [x] **Harmonized MFA & Staff Approval Flow:** Reordered the security gate to strictly sequence Login → MFA → Staff Approval Status Check → Admin Access. Ensured accounts in "Pending" status are blocked even with successful MFA, while maintaining existing 10-minute session validation (Aug 15, 2026).
- [x] **Security E2E Testing & UI Feedback:** Implemented automated Playwright tests to verify the Login → MFA → Approval flow. Enhanced the "Pending" status screens to provide clearer, identity-verified feedback to staff awaiting administrative approval (Aug 15, 2026).
- [x] **Product Image Upload System:** Implemented a direct manual image upload system in the Admin Panel using Supabase Storage. Added the `ProductImageUpload` component to the Product Create/Edit form, supporting single main images and bulk gallery uploads with drag-and-drop, interactive previews, reordering, and dimension/size validation (Aug 15, 2026).
- [x] **Bug Fix:** Resolved a `ZodError` in `listProducts` by lowering the minimum `pageSize` validation from 10 to 1, ensuring compatibility with small-batch fetches or single-item filtered lists (Aug 15, 2026).
- [x] **Enhanced Image Upload Workflow:** Upgraded `ProductImageUpload` with per-file progress tracking, status indicators (Processing, Uploading, Completed, Error), and retry capability. Added drag-and-drop reordering for gallery images and implemented basic client-side image processing. (Aug 15, 2026).
- [x] **Admin Live Preview Upgrades:** Added a "Publish/Unpublish" toggle to the `ProductPreviewDialog`, allowing administrators to toggle between "Draft" and "Public" visual states during live preview. (Aug 15, 2026).
- [x] **Enhanced Admin Avatar System:** Implemented a professional and flexible avatar system for Admin Panel users. Includes preset options (Adventurer, Bottts, etc.) and manual custom uploads with client-side preview, validation (1MB limit), and optimization recommendations (400x400px WebP/JPEG/PNG). (Aug 15, 2026).
- [x] **Staff List Avatar Integration:** Updated the Admin Staff list to display real-time user avatars (presets or custom) instead of generic icons. (Aug 15, 2026).
- [x] **RBAC & Gate Alignment:** Synchronized `getMyAccess` and `AdminAccess` types to ensure full profile metadata (fullName, avatarUrl, gender) is available to all Admin Panel components and guards. (Aug 15, 2026).
- [x] **Automatic Image Optimization Pipeline:** Implemented an on-demand regeneration system for missing AVIF/WebP variants. Updated `SafeImage` to trigger a backend check via `regenerateMissingVariants` whenever a variant fails to load, ensuring future requests benefit from modern image formats automatically (Aug 16, 2026).
- [x] **Tablet Navigation Fix:** Kept full storefront navigation visible from 768px upward, tightened tablet logo/control/link sizing, and verified desktop/tablet/mobile behavior at 1440, 1366, 1180, 1112, 1080, 1024, 1023, 900, 820, 800, 768, 767, 430, and 390px. Mobile hamburger behavior remains unchanged (Aug 25, 2026).
- [x] **Authoritative Invoice Reset:** Admin reset/manual starting numbers now apply exactly to the next storefront or manual order, even when that display number exists in history. Historical orders remain unchanged and order UUIDs remain the permanent unique identity (Aug 27, 2026).
- [x] **Invoice Reset Regression Coverage:** Added an atomic settings-save operation and automated reset/manual-number tests covering both website and Admin Manual Order sources, immediate active-number state, historical label reuse, and sequence advancement (Aug 27, 2026).

## Documentation Strategy

- Use JSDoc for complex server functions and components.
- Maintain strict RBAC (Super Admin/Admin/Staff).
- All orders must follow the verified server-side pricing logic.

### Gallery Management (2026-08-20)
- Implemented `gallery_items` table in Supabase with RLS policies.
- Created `src/lib/gallery.functions.ts` with POST-based server functions (CRUD + reordering).
- Added `src/components/admin/settings/GalleryPanel.tsx` for Admin UI (DndContext for reordering, SingleImageUpload).
- Integrated Gallery tab in `src/routes/_authenticated/ad/settings.tsx`.
- Refactored `src/routes/gallery.tsx` to fetch dynamic data from `gallery_items` table.
- Added support for "Hidden" state (is_active) to allow hiding builds without deleting them.

## Migration-readiness audit (final Lovable-side task)

Status: COMPLETED. Full report: `MIGRATION_AUDIT.md`.

Fixed seven blockers: corrupt FUNCTIONS section and missing `private` schema in
`01_schema.sql`, invalid `EXCEPTION` syntax in 113 constraint blocks, stale
`auth.users` FK values in `02_data.sql`, Cloudflare-only build target
(`vite.config.ts` now honours `DEPLOY_PRESET`), wrong Netlify publish dir, and an
incomplete storage guide (6 buckets, not 2). `supabase/migration-export/` is
authoritative; `supabase/exports/` is marked superseded.

Next steps (owner, outside Lovable): create the Supabase project, run steps 1-4,
create auth users + re-enrol MFA, create the six storage buckets, set Netlify env
vars including `SUPABASE_SERVICE_ROLE_KEY`.

## 2026-08-27 — Orders Recycle Bin fix
- Bulk "Recycle Bin" action on /ad/orders now soft-deletes (bulkRecycleOrders) instead of only setting status=cancelled, so orders appear in the Recycle Bin.
- Permanent delete now runs through service-role hardDeleteOrders() (orders has no staff DELETE policy) and removes dependent rows (items, events, payments, courier/stock records) first.
- Permanent delete allowed for Admin + Super Admin; per-order confirm by invoice no, plus "Empty orders bin" with typed DELETE. All actions audited.
- Next: consider same admin-level purge for products/customers if requested.
