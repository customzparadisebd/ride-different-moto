# Admin Panel Rebuild — Order Management, Products, Customers, Settings

## What went wrong (verified in the code)

- The backend was finished, the interface was not. The database fields, filters, permission checks, totals recalculation and audit logging are all in place and working.
- `/czp-ops-9f2c` is the order list itself, so there is no dashboard and no dedicated Orders page. Nav "Orders" is the home page.
- That one file holds the list, the filters, a manual-order form and a leftover access-denied/sign-out block that the admin shell already handles — dead UI, 364 lines in one screen.
- Manual order entry is a stub: a single line item, plain text boxes for price and quantity, no product picker from the catalog.
- The list has no pagination, sorting, bulk status update, CSV export or invoice print.
- There are no Products, Customers or Settings sections — only Orders, Staff, Audit log, Security.
- Nothing was ever checked on screen, because the owner login stops at the two-factor code step and I cannot get past it.

## What I will build

### 1. Admin shell and navigation

Sidebar navigation (collapsible) replacing the current top tab strip: Dashboard, Orders, Products, Customers, Staff & roles, Audit log, Security. Each entry still shown only when the role permits it, and every screen still re-checks permission server-side.

### 2. Dashboard (new home at /czp-ops-9f2c)

Today / 7-day / 30-day order count and revenue, count per order status, count of unpaid and due amounts, and the 10 most recent orders with a link through to each.

### 3. Orders (moved to /czp-ops-9f2c/orders)

- Clean list: filters (order ID, name, phone, order status, payment status, delivery zone, date range), sortable date and total columns, pagination, per-page selector, result count.
- Row selection with bulk order-status update, and CSV export of the filtered result.
- Manual order creation moved to its own page with a product picker from the store catalog, multiple line items, live subtotal/total preview, and validation before submit.

### 4. Order detail (/czp-ops-9f2c/orders/{id})

Reorganised into clear cards: customer information, ordered items with image/variant/qty/unit price/line total, pricing summary (subtotal, discount, delivery, advance paid, due, total payable), order status updater, payment and transaction details, courier and tracking, internal notes, and the full activity timeline. Plus a print-friendly invoice view.

### 5. Products

Read-only view of the store catalog (image, name, category, price, stock flag) with search, so staff can look up what they are selling while taking an order. Editable products would need a products table in the database — say the word and I will add that as a follow-up.

### 6. Customers

Derived from orders: unique customer by phone, with name, city/zone, order count, total spent, last order date, search, and a drill-down to that customer's order history.

### 7. Settings

Store operations settings visible to admins: flat delivery charge, delivery zone labels and charges, payment methods shown at checkout, and the low-stock/contact details used across the panel. Stored in the database so checkout reads the same values.

## Technical notes

- No changes to the existing `orders` / `order_items` / `order_events` tables; the current server functions stay the source of truth.
- New server functions: dashboard metrics, paginated order list (returning total count), bulk status update, customer aggregation, settings read/write — all permission-checked and audited like the existing ones.
- One new `store_settings` table with row-level security so only admins can write and checkout can read the public values.
- Order screens split into small components under `src/components/admin/orders/`; no single screen file over ~200 lines.
- Every admin route stays under the `_authenticated/czp-ops-9f2c` gate with noindex/nofollow.
- Two-factor stays enforced as-is, so after each step I will tell you exactly which screen to open and what to check.
