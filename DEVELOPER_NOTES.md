# Developer Notes

Project: CUSTOMZ PARADISE BD
Author: Rafi Gazi (Rabbee) Apps

## Hosting-Independent / Portability Pass — Sep 6, 2026

- **Portable media URLs.** All Supabase Storage uploads (products, hero, hero-banners,
  bike-models, logos) now store an app-relative URL `/api/public/media/<bucket>/<path>`
  instead of an absolute `https://<ref>.supabase.co/storage/...` URL. Served by
  `src/routes/api/public/media/$.ts` (service-role read, allow-listed buckets only,
  `Cache-Control: immutable`). Bucket allow-list: `src/lib/storage-url.ts`.
  Consequence: uploads work whether buckets are public or private, and no URL
  rewriting is needed when the Supabase project or the host changes.
  `avatars` is deliberately excluded (personal data, keeps signed URLs).
- **Storage policies added** for `products`, `hero`, `bike-models`: public read,
  staff-only insert/update/delete (`public.is_staff`). Nothing existing weakened.
  Note: the workspace blocks public buckets, which is why the media route exists.
- **Removed Lovable/CDN-specific assumptions** from `src/lib/images.functions.ts`
  (dropped the non-existent `image-cache` bucket lookup and the `lovableproject.com`
  host check) and `src/components/SafeImage.tsx` (host-agnostic storage check).
- **Legacy DB links rewritten** to `/api/public/media/...` for 11 bike models and 1
  product/`site_logos` row; `supabase/migration-export/02_data.sql` rewritten to match
  (audit-log history rows left untouched on purpose).
- **VPS/self-host build:** `npm run build:node` (`DEPLOY_PRESET=node-server`) plus
  `npm run start:node`. The Lovable sandbox always forces the Cloudflare preset, so the
  Node preset can only be observed on a real host/CI; the config path itself is verified.
  Docs: `supabase/migration-export/ENV_TEMPLATE.md` §3c, `05_storage.md` §0.
- **Still requires owner action:** re-upload 11 bike-model images, 1 product image
  (`drl.jpg`) and 3 hero slide images through the admin panel — those files were already
  missing/dead externally (ImgBB + Unsplash 404, old storage objects gone).
- Verified: `tsc --noEmit` clean, production build clean, `/api/public/media/...`
  returns 200 for a private-bucket object and 404 for non-allow-listed buckets.

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

## 2026-08-28 — Final production-readiness audit

Result: READY to deploy on own Supabase + GitHub + Netlify, no code blockers.

Verified: Netlify config (`DEPLOY_PRESET=netlify`, `publish = dist`, Node 22,
security headers, `no-store`/`noindex` on `/ad/*`, `/czp-ops-9f2c/*`, `/api/*`),
portable Vite/nitro build with production sourcemaps off, no secrets in the repo
(`SUPABASE_SERVICE_ROLE_KEY` read only inside server handlers), server-side auth via
`requireSupabaseAuth`, and the four-step migration package.

Fixed during the audit:
- `src/lib/customers.functions.ts` — bulk permanent delete of customers now allows
  Admin + Super Admin, matching products/orders.
- `supabase/migration-export/01_schema.sql` — synced with the live database
  (invoice-settings RLS for Admin *and* Super Admin, `anon` grant dropped, updated
  invoice generator functions with REVOKE/GRANT hardening, non-unique
  `orders.invoice_no` index). See that folder's README changelog.
- `src/lib/hero-restore.server.ts` — hero seed image URLs now built from
  `process.env['SUPABASE_URL']` instead of a hardcoded project ref.

Owner steps outside Lovable: create the Supabase project, run
`supabase/migration-export/` steps 1-4, create auth users by hand before step 3 and
re-enrol MFA, create the six storage buckets from `05_storage.md`, and set on
Netlify: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (mandatory).

Next: nothing pending — documentation and audit closed.
