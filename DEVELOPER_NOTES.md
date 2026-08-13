# DEVELOPER NOTES - CUSTOMZ PARADISE BD

## STATUS: OPERATIONAL
## LAST UPDATED: 2026-08-14 (UTC)

### COMPLETED:
- [x] Hero Slider Update — Added custom banner. Optimized loading (priority eager preloading for 1st slide, responsive sizes/srcset support) to prevent layout shifts and improve LCP. Enhanced accessibility with ARIA labels and keyboard navigation (Arrow keys). Transition set to 3.5s.
- [x] Product Color Selector — Added silver/gray outline to color circles for better visibility against dark backgrounds.
- [x] Sticky Navigation Bar (Desktop & Mobile) — COMPLETED
- [x] N160/N250 PRODUCT ORDER & COLOR CONFIG — COMPLETED
- [x] All Products Search & Filters (Name, Bike, Category, Price)
- [x] Dynamic Checkout (Searchable Cities, Delivery Zones & Charges)
- [x] WhatsApp Support Integration
- [x] Redesigned Admin Orders Board (Tabs, Bulk Actions, Dense Table)
- [x] SteadFast Bulk Shipment Integration
- [x] Multi-Courier Support Layer (Pathao, RedX ready)
- [x] Super Admin Provisioning & Admin MFA
- [x] Official Brand Social Icons & Compact Footer Map
- [x] Admin Panel Rebuild (Dashboard, Sidebar, Sections)
- [x] Soft Delete & Recycle Bin
- [x] Product Management (database-backed)
- [x] Secure Staff Access (RBAC & Audit Logs)
- [x] Mobile & Network Resilience

---

## Branding & Design System
- **Status:** Completed
- **Done:** Brand palette (red / silver / black) and shadows as tokens in `src/styles.css`; Barlow Condensed headings + Barlow body; utilities (`bg-gradient-red`, `text-gradient-red`, `eyebrow`, `pb-safe`, `no-scrollbar`). Logo used as-is. Default theme changed to **Dark/Black** (users can toggle to Light).
- **Next:** None. Rule: never recolor, stretch or redesign the logo.

## N160/N250 PRODUCT ORDER & COLOR CONFIG
- **Status:** Completed
- **Done:** Enforced exact serial order (1. X-3 Kit ... 12. Indicator Combo) for Pulsar N160/N250 catalogs. Refined color system to exactly 3 options: Black, Red, Blue (in that order) for all color-selectable items. Removed Orange and other variations. The storefront catalog is now 100% database-driven and adheres to this manual ordering and color constraints.
- **Next:** Admin UI for manual re-ordering/dragging is pending (currently database-controlled).

## All Products & Search
- **Status:** Completed
- **Done:** Dynamic "All Products" grid replaces old static sections. High-performance `ProductBrowser` with search (name/model), category filter, and sorting. Mobile-first responsive layout.
- **Next:** Price range filters removed at user request.

## Dynamic Checkout & Cities
- **Status:** Completed
- **Done:** Searchable Bangladesh City/District dropdown (64 districts). Admin-managed Delivery Zones (Inside Dhaka, Outside Dhaka, Suburban Dhaka) with dynamic charges that update the order total in real-time. Cash on Delivery forced. WhatsApp support button (+8801890722202) integrated.
- **Next:** None.

## Admin Panel — Redesigned Orders
- **Status:** Completed
- **Done:** Dense operational table (SL, Invoice, Customer, Products, Payment, Courier, Amounts, Status). Compact status tabs with live counts. Bulk actions: Print, Assign User, Change Status, SteadFast booking. Exports: CSV, Excel, PDF. Mobile-responsive order cards.
- **Next:** None.

## Courier Integration (SteadFast Bulk)
- **Status:** Completed
- **Done:** Multi-select orders in Admin and "Send to SteadFast" with a confirmation modal and batched results. Skip duplicate shipments. Admin/Super Admin manage API credentials server-side in Settings. Full tracking refresh.
- **Next:** Pathao and RedX API wiring.

// N160/N250 PRODUCT ORDER & COLOR CONFIG — COMPLETED

## Aug 13, 2026
- Implemented JSON-LD structured data for Product rich results.
- Added premium Product Gallery with zoom, thumbnail navigation, and fullscreen mode.
- Integrated framer-motion for gallery animations.

## Aug 13, 2026 (Part 2)
- Added Organization and LocalBusiness JSON-LD for enhanced local SEO.
- Improved Product Gallery accessibility: added keyboard controls (arrows, escape), ARIA roles, and focus management for thumbnails.
- Verified stable site URL (https://customzparadisebd.com) in site configuration.

## Aug 13, 2026 (Part 3)
- Implemented Organization and LocalBusiness JSON-LD in root layout for improved local SEO presence in Bangladesh.
- Finalized Product Gallery keyboard accessibility and focus management.
- Hardcoded Sector 10, Uttara branch coordinates and opening hours (9 AM - 9 PM) into business metadata.

## Aug 14, 2026
- Implemented Admin Slider Management: Created a dedicated admin screen (`/ad/hero`) to manage homepage banners (CRUD).
- Migrated Hero Slider to database: The homepage now fetches slides dynamically from the `hero_slides` table.
- Added sorting, active status toggles, and link/CTA management for banners without code changes.
- Refined design tokens for color selector chips with enhanced silver/gray borders.
