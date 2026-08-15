# Plan: Inventory and Order Management Enhancement

Implement a robust inventory system, stock deduction rules, role-based order completion restrictions, and comprehensive activity logging.

## User Review Required

> [!IMPORTANT]
> This plan introduces a strict rule where only Admins/Super Admins can complete orders. Staff will be blocked from this action.

- Does the "OUT OF STOCK" toggle need to hide the product from the shop entirely, or just show the label and disable the buy button? (Currently planning to just disable/label).

## Proposed Changes

### Database & Schema
- Add `out_of_stock_toggle` (boolean, default false) to `products` table.
- Create `order_stock_deductions` table to track which orders/items have already had stock deducted (Duplicate Protection).
- Create `order_returns` and `order_damages` tables to track return/damage history.
- Ensure `order_events` captures all required activity log fields.

### Server Functions & Logic
- **Stock Deduction**: Update `updateOrderStatus` to handle stock deduction when transitioning to `completed`.
- **Permission Guard**: Enforce role checks for `completed` status in `updateOrderStatus`.
- **Inventory Validation**: Update `placeOrder` to check `stock_qty` and `out_of_stock_toggle`.

### Admin UI
- **Product Form**: Add "Stock Out" toggle and inventory field.
- **Order Details**: 
    - Add "Completed" status confirmation modal for Admins.
    - Block "Completed" status for Staff.
    - Add "Return" and "Mark as Damaged" actions.
- **Order List**: Add activity history icon and timeline popup/drawer.

### Storefront UI
- **Product Page**: Show "OUT OF STOCK" and disable "Add to Cart" if stock is 0 or toggle is ON.
- **Checkout**: Prevent submission if quantity exceeds stock.

## Technical Details

- **Concurrency**: Use `FOR UPDATE` in Supabase/PostgreSQL during stock deduction to prevent race conditions.
- **Audit**: Every inventory change will be logged in `admin_audit_log`.
- **BD Time**: All logs and sales metrics will continue to respect Bangladesh Standard Time (UTC+6).
