# Merge the Admin Hub into this project as one application

Both projects are reachable, so the Admin Hub can be used as the real source. Decisions locked in from your answers:

- The Hub's admin screens become the admin panel here (its look and its extra sections), rewired to **this** project's database.
- This project's data stays. The Hub's own rows can't be transferred; anything you had only in the Hub is re-entered from the panel.
- Landing Page is not rebuilt or touched, other than continuing to read the same shared data.
- Admin panel moves to a private path: login at `/ad/log`, sections under `/ad/*`. An `admin.customzparadisebd.com` subdomain can be pointed at this same app after publishing.

## What the Hub adds that this project doesn't have

New sections: Payments, Inventory (stock in/out with movement log), Reports (sales / profit / inventory / customer with Excel export), Invoices list + PDF invoice, Suppliers, Brands & Categories, plus a richer Dashboard with charts and a tamper-evident Activity trail view.

Already covered here and kept as-is underneath: Orders, Products, Customers, Couriers (SteadFast / Pathao / RedX), Staff & roles, permissions, MFA, login lockout, session revocation, Recycle Bin, Store settings, audit log.

## Data model: one shared backend

The two projects' tables differ (for example the Hub uses `address`, ours uses `address_line`; the Hub keeps settings as key/value, ours as a settings row). This project's schema stays the source of truth so the Landing Page, checkout and courier flows keep working. The Hub screens are re-pointed at it.

Kept as-is: `orders`, `order_items`, `order_events`, `products`, `product_colors`, `profiles`, `user_roles`, `user_permissions`, `admin_audit_log`, `admin_sessions`, `couriers` + credentials/shipments/tracking, `delivery_zones`, `store_settings`, `hero_slides`, `nav_items`, `social_links`, `reviews`.

Added for the Hub-only sections (one migration, with grants + staff-only policies):
`brands`, `categories`, `suppliers`, `inventory_movements`, `payments`, and `customers` (a real customer record keyed on phone, backfilled from existing orders so the current Customers view keeps its history and lifetime value).

Products gain the Hub's extra fields (brand, category reference, cost price, barcode, low-stock level, supplier) as nullable columns, so nothing existing breaks.

## Phases

**Phase 1 — Move the panel to `/ad`**
Relocate every admin route from `/czp-ops-9f2c` to `/ad`, login at `/ad/log`, keep `noindex, nofollow, noarchive`, update `robots.txt` to disallow `/ad`, update sign-out and redirect targets. Old `/czp-ops-9f2c/*` paths redirect to the new ones so nothing dead-ends.

**Phase 2 — Database**
One migration for the new tables and product columns, with the customer backfill from existing orders. New permissions for the new sections (`payments.view`, `inventory.manage`, `reports.view`, `catalog.manage`, `suppliers.manage`), granted to the roles that already hold the equivalent rights.

**Phase 3 — Chrome and shared pieces**
Bring over the Hub's `AdminSidebar`, `AdminTopbar`, `DataTable`, `StatCard`, `ConfirmDialog`, `CustomerCard` and its Excel/PDF/timezone helpers, adapted to this project's design tokens (red / silver / black, Barlow) and to the existing permission model. Install the missing packages (`xlsx`, `jspdf`, `jspdf-autotable`). The existing gate stays: server-verified staff access, approval status, session revocation and MFA step-up all keep running in front of every screen.

**Phase 4 — Port screens, existing ones first**
Dashboard, Orders, Products, Customers, Recycle Bin, Activity, Users/Staff, Settings, Integrations — Hub layout on this project's server functions, so order creation, courier booking, invoice numbering and audit logging keep their current behaviour.

**Phase 5 — New screens**
Payments, Inventory, Reports, Invoices list + PDF, Suppliers, Brands & Categories, on the Phase 2 tables and permissions.

**Phase 6 — Sync check and notes**
Verify end to end: a Landing Page checkout appears in Orders; a product price / stock / offer, hero slide, nav item, social link, review or delivery zone edited in the panel shows on the Landing Page; deleting restores from Recycle Bin. Update `DEVELOPER_NOTES.md` with everything shipped and what's left.

## Technical notes

- Every Hub screen is re-pointed at this project's `*.functions.ts` server functions; each write keeps its permission check, validation and audit entry server-side. No admin logic moves to the browser.
- The Hub's client-only session guard is dropped in favour of the existing `_authenticated` gate plus the server-side access check, which is stricter.
- The Hub's hash-chained `activity_logs` is not duplicated: the Activity screen renders this project's append-only `admin_audit_log`.
- Courier credentials stay write-only in `courier_credentials`, unreadable by the browser.
- New tables get GRANTs plus staff-only RLS; `payments` and `inventory_movements` are append-only for staff, with corrections recorded rather than rows edited.

## Scope note

This is a large port — roughly six phases of work. I'll go phase by phase and report after each, so nothing on the Landing Page or in Orders breaks silently along the way.
