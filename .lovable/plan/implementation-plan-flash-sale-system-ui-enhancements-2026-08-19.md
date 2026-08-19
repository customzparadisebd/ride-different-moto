# Implementation Plan - Flash Sale System & UI Enhancements

## Phase 1: Database & Backend
- **Schema**: Create `flash_sales` table (name, description, start_date, end_date, start_time, end_time, discount_type, discount_value, is_active, priority).
- **Schema**: Create `flash_sale_products` join table.
- **Server Functions**: Implement `getFlashSales`, `saveFlashSale`, `deleteFlashSale`, and `getActiveFlashSaleForProduct`.
- **Security**: Enable RLS on new tables. `staff_only` for management, `authenticated/anon` for active offer reading.

## Phase 2: Admin Panel Management
- **Route**: New admin route `/ad/flash-sales`.
- **Form**: `FlashSaleForm` with scheduling (Date/Time pickers), product selector (multi-select), and pricing toggle (% vs Fixed).
- **Preview**: `FlashSalePreviewDialog` for Desktop/Mobile visualization of the offer banner/countdown before saving.
- **Dashboard**: Update admin dashboard to show active flash sales.

## Phase 3: Customer Experience
- **Logic**: Update product pricing logic (frontend/backend) to check for active flash sales using `Asia/Dhaka` time.
- **Component**: `FlashSaleBanner` and `CountdownTimer` for product pages.
- **Gallery Enhancement**: Add responsive "Click/Tap to view full image" visual hint to `ProductGallery.tsx` with fade-out animation and session-based persistence.

## Phase 4: Security & Audit
- **SQL Audit**: Verify all queries (especially search/filters and new flash sale endpoints) use parameterized queries via Supabase client.
- **Report**: Generate a detailed SQL Injection Security Audit report.
- **Note Icon**: Replace current note icon in `BrandIcons.tsx` with modern pinned note SVG with glow/shadow.

## Technical Details
- **Timezone**: Use `date-fns-tz` for all `Asia/Dhaka` calculations.
- **Animation**: Use `framer-motion` for gallery hints and countdown transitions.
- **State**: Track first-time gallery visit via `sessionStorage`.
- **RBAC**: Enforce `productsManage` permission for Flash Sale operations.
