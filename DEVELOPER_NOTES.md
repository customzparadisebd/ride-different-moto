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
- **Next:** Point the `admin.customzparadisebd.com` subdomain at the project once the custom domain is connected (DNS + Domains settings), and add per-role permissions (Super Admin vs Staff) if finer-grained control is needed.

## Analytics & SEO Tracking
- **Status:** Pending
- **Done:** Per-route meta tags and structured data only.
- **Next:** Add analytics, sitemap and robots handling when the domain goes live.
