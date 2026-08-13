# Plan - Orders Management UI/UX Redesign

Redesign the Orders Management page to match the professional, compact, and data-dense layout from the reference screenshot while maintaining the existing brand design system and functionality.

## Proposed Changes

### 1. Components & Layout (`src/components/admin/orders/`)

#### `OrderStatusTabs.tsx`
- Update styling to match the reference: compact, rectangular tabs with distinct borders.
- Position counts within or next to the labels more tightly.
- Use smaller text and reduced padding to save vertical space.

#### `OrderFilterBar.tsx`
- Tighten the layout of the search and filter area.
- Group "Latest first" and "Filters" more effectively.
- Ensure the advanced filters section uses a compact grid.

#### `OrderCells.tsx` (Major Update)
- **`InvoiceCell`**: Group icons horizontally in a very tight row. Make invoice numbers more prominent but compact.
- **`CustomerCell`**: Reorder into a tighter vertical stack: Name, Phone (with inline icons), Address (2 lines max), and "Total Orders" badge.
- **`ProductsCell`**: Use smaller thumbnails (36-40px). Ensure quantity and variations are clearly visible but small.
- **`AmountsCell`**: A vertical list of values (Subtotal, Discount, Shipping, Advance, Total). Total should be bold and colored (greenish/primary).
- **`PaymentCell`** & **`CourierCell`**: Vertical stacks for method/status/ID and status/name/consignment.

### 2. Main Orders Page (`src/routes/_authenticated/ad/orders.index.tsx`)

#### Table Redesign
- Implement a more condensed `<table>` structure for desktop.
- Add an `SL` (Serial number) column as seen in the reference.
- Add a "Bulk Action Bar" that appears when orders are selected, containing buttons for Print, Assign, Status, and SteadFast.
- Reduce vertical cell padding (`py-2` or `py-2.5`) to maximize items on screen.
- Ensure columns are sized appropriately: narrow for SL/Invoice, medium for Date/Payment, wide for Customer/Products.

#### Mobile View
- Refine the stacked card layout to mirror the new table hierarchy: Header (SL/Invoice/Status), Body (Customer/Products), Footer (Amounts/Payment).

### 3. Styling & Polish
- Ensure the brand red (#E31837) is used for active states instead of the reference's teal.
- Use mono fonts for IDs and Amounts where appropriate for better legibility at small sizes.
- Verify responsiveness across tablet and small desktop widths to prevent horizontal overflow where possible.

## Technical Details

- **Tailwind Classes**: Use `whitespace-nowrap` on small data points, `leading-tight` on address/product text.
- **Grid Layouts**: Use `grid-cols` with `min-content` or specific widths for table-like headers.
- **Permissions**: Ensure existing `canManage`, `canShip`, etc., guards remain intact.

## Verification Plan

- **Visual Audit**: Compare the rendered page against the reference screenshot for structure and density.
- **Responsiveness**: Check mobile stacking and tablet scaling.
- **Functionality Check**:
    - Verify bulk selection and status updates.
    - Verify SteadFast logo-only button works.
    - Verify "Create Order" modal still functions correctly.
    - Verify pagination and filters still work.
