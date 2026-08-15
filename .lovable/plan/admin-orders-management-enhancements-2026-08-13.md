# Admin Orders Management Enhancements

Implement multi-select bulk actions for order status and SteadFast Courier assignment, and a comprehensive manual order creation form.

## User Interface

- **Bulk Actions**:
  - Add checkboxes to each row in the Order List.
  - Implement a multi-select header checkbox.
  - Add a dedicated bulk action bar that appears when orders are selected.
  - Integrate a "Change Status" dropdown in the bulk action bar.
  - Add a "Send to SteadFast" button using the official SVG logo.

- **Manual Order Creation**:
  - Add a "CREATE ORDER" button to the Orders page.
  - Implement a "Create Order" modal/form with:
    - Customer Info: Name, Phone (BD validation), Full Address.
    - Product Selection: Multi-product search from catalog, quantity, and price.
    - Financials: Auto-calculated Subtotal, Discount, Advance Payment, and Due Amount.
    - Metadata: Payment Method and Order Status.

## Technical Details

- **Bulk Status Update**:
  - Enhance `bulkUpdateOrderStatus` in `orders.functions.ts` to handle the selected IDs and log audit events for each.
- **SteadFast Integration**:
  - Update `SteadfastBulkDialog.tsx` to ensure it uses the official logo SVG: `https://www.steadfast.com.bd/landing-page/asset/images/logo/logo.svg`.
- **Order Calculation Logic**:
  - Implement real-time calculations in the `ManualOrderForm.tsx` to handle `Subtotal - Discount + Shipping - Advance = Due`.
- **Database Safety**:
  - Ensure all manual orders use the same invoice sequence and log events via `logOrderEvent`.
- **Permissions**:
  - Enforce `orders.create` and `orders.manage` permissions on both client and server side.
