# Developer Notes / Project Comments

Project: **CUSTOMZ PARADISE BD** — motorcycle modification store
Tagline: RIDE DIFFERENT. BE DIFFERENT.
Stack: TanStack Start (React 19) + Tailwind CSS 4 + shadcn/ui

**How to use this file:** one entry per major feature/section. Keep it short.
Update the **Status** when work is completed — never delete old entries.
Status values: `Completed` / `In Progress` / `Pending`.

---

## Branding & Design System
- **Status:** Completed
- **Done:** Brand palette (red / silver / black) and shadows as tokens in `src/styles.css`; Barlow Condensed headings + Barlow body; utilities (`bg-gradient-red`, `text-gradient-red`, `eyebrow`, `pb-safe`, `no-scrollbar`). Logo used as-is in light-bg / dark-bg versions via `src/components/Logo.tsx`. Favicon generated from the mark.
- **Next:** None. Rule: never recolor, stretch or redesign the logo.

## Layout & Navigation
- **Status:** Completed
- **Done:** Sticky `Header` with mobile menu, cart button and theme toggle; `Footer` with quick links, policies and socials; providers wired in `src/routes/__root.tsx` (Query, Theme, Cart, Toaster).
- **Next:** None.

## Home / Landing Page
- **Status:** Completed — **do not rebuild**
- **Done:** Hero slider (Embla, autoplay + touch), bike model carousel, featured products, trust, reviews, store-coming-soon, about, contact and social sections; SEO meta + JSON-LD `Store` schema.
- **Next:** Content/photo swaps only when the owner supplies real shop images.

## Shop & New Arrivals
- **Status:** Completed
- **Done:** `/shop` product grid and `/new-arrivals` recent-parts view built from `src/data/catalog.ts`; BDT (৳) prices, discount badges.
- **Next:** Filters (category / price / bike fitment) and sorting are Pending.

## Bike Model Pages
- **Status:** Completed
- **Done:** `/bike-models` directory and dynamic `/bike-models/$slug` pages with loader, breadcrumbs, matching parts and a not-found state.
- **Next:** Expand catalog to more models as inventory grows.

## Cart & WhatsApp Ordering
- **Status:** Completed — replaced by on-site checkout
- **Done:** Local-storage cart (`src/lib/cart.tsx`) and `CartSheet` drawer. Cart now leads to `/checkout` instead of WhatsApp; WhatsApp remains only as a contact/help channel.
- **Next:** None.

## Checkout & Order Storage
- **Status:** Completed
- **Done:** `/checkout` form (name, mobile, email, address, city, payment method, notes) with client + server Zod validation. `placeOrder` server fn re-prices every line from the catalog server-side, applies flat ৳120 shipping, generates the invoice ID (`CZP-YYMM-XXXX`) and saves `orders` + `order_items` + `order_events`. Duplicate protection via a per-attempt idempotency key (unique index, race-safe). Confirmation screen shows the invoice ID.
- **Next:** Online payment capture (bKash/Nagad/card) is Pending.

## Admin Panel — Orders
- **Status:** Completed
- **Done:** Staff sign-in at `/auth` (email/password + Google). `/admin` lists the latest 200 orders; `/admin/orders/:id` shows customer, amounts, items, status/payment controls, notes and full order history. Manual orders use the same tables and invoice series (`order_source = admin`). All reads/writes go through authenticated server functions guarded by an `is_staff` check; RLS blocks non-staff. First sign-in by customzparadisebd@gmail.com is granted the admin role automatically.
- **Next:** Product/inventory management, order filters and CSV export are Pending.

## Gallery
- **Status:** Completed
- **Done:** `/gallery` square image grid using hero and bike model assets.
- **Next:** Replace placeholders with real customer build photos.

## About, Contact & Policies
- **Status:** Completed
- **Done:** `/about`, `/contact`, plus `privacy-policy`, `terms`, `returns`, `shipping` via reusable `PolicyArticle`.
- **Next:** Owner to review policy wording for accuracy.

## Mobile & Network Resilience
- **Status:** Completed
- **Done:** 44px touch targets, safe-area padding, `NetworkBanner` for offline/slow connections, `SafeImage` with reserved aspect ratio, shimmer and per-image retry (SSR-complete images handled).
- **Next:** None.

## Backend / Admin
- **Status:** In Progress
- **Done:** Lovable Cloud enabled. Tables: `profiles`, `user_roles` (separate role table + `has_role`/`is_staff` security-definer functions), `orders`, `order_items`, `order_events`. RLS enabled everywhere; invoice numbering function is service-role only.
- **Next:** Move the product catalog from `src/data/catalog.ts` into the database and add image uploads.

## Admin Panel Access & Login Security
- **Status:** Completed
- **Done:** Admin panel moved off predictable URLs to the private path `/czp-ops-9f2c` (staff sign-in `/czp-ops-9f2c/access`, order detail `/czp-ops-9f2c/orders/:id`, `/czp-ops-9f2c/access-denied`). Nothing on the public site links to or reveals it. Real security is server-side: `_authenticated` gate requires a valid session, and a nested layout gate calls the `getMyAccess` server function (bearer-token validated, roles read from `user_roles`) before rendering; non-staff users are redirected to access-denied. All admin/auth pages send `noindex, nofollow` and are disallowed in `robots.txt`. Store header/footer/nav are hidden in the admin area. Login form has a modern show/hide password (eye) toggle, password never logged, plus a 5-attempt / 60-second client-side lockout on top of backend rate limiting.
- **Next:** Point the `admin.customzparadisebd.com` subdomain at the project once the custom domain is connected (DNS + Domains settings).

## Admin MFA (Two-Factor)
- **Status:** Completed
- **Done:** TOTP authenticator MFA via the auth provider (secret never stored in our DB). Super Admin accounts are `mfa_required` and cannot open any admin screen without an AAL2 token — the server-side gate redirects to `/czp-ops-9f2c/mfa`, which handles both first-time enrolment (QR) and step-up verification. Flow: Email + Password -> TOTP -> panel. 8 one-time recovery codes are generated at setup, stored only as salted SHA-256 hashes in `mfa_backup_codes` (service-role only) and shown once; a valid code removes the lost authenticator so a new device can be enrolled. Optional MFA for other roles from the Security page.
- **Next:** None.

## Admin Audit Log
- **Status:** Completed
- **Done:** Append-only `admin_audit_log` (actor, role, action, target, IP, user agent, session, before/after JSON, timestamp) written only with the service-role client. Covers logins, failed logins, logout, MFA enrolment/recovery/backup codes, session revocation, staff status/role/permission changes and order create/status/notes. Viewer at `/czp-ops-9f2c/audit-log` requires the `audit.view` permission (Super Admin by default); no client role can insert, edit or delete rows.
- **Next:** Append product create/edit/delete/restore and API-configuration events when those modules are built (the writer already accepts them).

## Staff Roles & Permissions (RBAC)
- **Status:** Completed
- **Done:** Roles `super_admin`, `admin`, `manager`, `staff` in `user_roles`, plus per-user grants in `user_permissions`. Effective permissions = role defaults + explicit grants, resolved server-side in `admin.server.ts`; `roles.manage`, `security.manage` and `api.manage` are Super-Admin-only and are stripped from anyone else even if a row exists. Every admin server function calls `assertAccess(actor, permission)` — hiding buttons is never the gate. Manage screen at `/czp-ops-9f2c/staff`. Nobody can change their own status, role or permissions; only a Super Admin can change roles or touch another Super Admin.
- **Next:** None.

## Admin Session Hardening & Rate Limiting
- **Status:** Completed
- **Done:** `admin_sessions` tracks every admin session (session id from the verified token, IP, device, first/last seen). Sign-out and Super Admin revocation mark sessions revoked and the gate blocks them on the next request; suspending/revoking an account kills its live sessions immediately. Tokens are short-lived and rotated by the auth provider, CSRF middleware protects server functions, and baseline security headers (nosniff, referrer-policy, permissions-policy) are set for every response. Login rate limiting is server-side in `login_attempts`: 3 consecutive failures = 5 min lock, then 15/30/60 min progressively; errors are generic so account existence is never revealed.
- **Next:** Frame-ancestors/HSTS are handled by the hosting platform; revisit if a custom reverse proxy is introduced.

## Secure Staff Access (Approval Workflow)
- **Status:** Completed
- **Done:** `profiles.access_status` = Pending / Approved / Suspended / Revoked; new sign-ups start Pending and `is_staff()` only returns true for approved accounts with a role, so RLS and the gate both deny them. Admins with `staff.manage` can approve, suspend, revoke or reset to pending from `/czp-ops-9f2c/staff`. Staff cannot approve themselves, edit their own role/permissions, create a Super Admin, or reach API/security/role screens (blocked server-side, not just hidden).
- **Next:** None.

## Super Admin Access Information
- **Status:** Completed
- **Done:** Super-Admin-only card on `/czp-ops-9f2c/security` showing the panel URL, login page URL, login method (email + password + TOTP), owner account, live MFA status, remaining recovery codes and step-by-step recovery/lockout instructions. Served by a server function that verifies Super Admin before responding and returns no keys, secrets or tokens. Nothing about it appears on the public site.
- **Next:** Once `admin.customzparadisebd.com` is connected the displayed URL updates automatically (it is derived from the live origin).

## Admin Login Page (simplified)
- **Status:** Completed
- **Done:** `/czp-ops-9f2c/access` now shows only the brand logo, an "Admin Panel" label, Email + Password (with show/hide eye), a Log in button and Continue with Google. Self sign-up, the Forgot password link and all bottom instruction text were removed, so staff and admins use one form. The owner Super Admin account (customzparadisebd@gmail.com) was provisioned server-side with an approved profile and the super_admin role.
- **Next:** New staff accounts must now be created by an Admin/Super Admin (there is no public sign-up); password resets are handled by an admin, since the self-service reset link is no longer surfaced. The `/czp-ops-9f2c/reset-password` page still exists and works if a recovery link is issued.

## Owner / Staff Password Reset
- **Status:** Completed
- **Done:** "Forgot password?" on `/czp-ops-9f2c/access` now sends the recovery link to a real reset page, `/czp-ops-9f2c/reset-password` (public, client-only, `noindex, nofollow, noarchive`). It validates the recovery session from the link, requires the new password twice with a 10-character minimum and the show/hide eye field, saves it, signs the recovery session out and records a `security.password_reset` entry in the audit log. Reset responses stay generic so account existence is never revealed, and no password is ever logged or stored by the app. The login page also documents the owner-account path: sign up once with the owner email (auto Super Admin) or use Forgot password.
- **Next:** None. Reset emails use the default provider templates; branded auth emails can be added once a sending domain is connected.

## Analytics & SEO Tracking
- **Status:** Pending
- **Done:** Per-route meta tags and structured data only.
- **Next:** Add analytics, sitemap and robots handling when the domain goes live.
