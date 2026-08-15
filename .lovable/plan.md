# Plan: Invoice Serial Management & Stress Testing

Implement a robust invoice management system with manual serial control, isolated stress testing, and database-level duplicate protection.

## User Review Required

> [!IMPORTANT]
> - Manual serial resets will only affect *future* invoices; existing invoices will remain unchanged.
> - Stress testing now uses a separate database sequence to prevent interference with production order numbering.

## Proposed Changes

### Database & Backend
- **Isolated Stress Testing**: Create a `stress_test_settings` table and update the `generate_next_invoice_no` PL/pgSQL function to use this sequence when in test mode.
- **Duplicate Protection**: Add a `UNIQUE` constraint to `orders(invoice_no)` and a `invoice_collisions` table to log attempted duplicates.
- **Sequential Control**: Update `invoice_settings` and the generation function to support manual resets of the "Next Serial Number" by Super Admins.
- **Audit Logging**: Record all manual sequence changes in the Admin Audit Log.

### Admin Panel (Admin Portal)
- **Invoice Settings**: Add a "Reset Next Serial" tool with confirmation dialogs.
- **Dashboard Alerts**: Implement a real-time "Duplicate Invoice Detected" alert system for admins.
- **Stress Test UI**: Update the security dashboard to clarify that concurrent requests in tests do not reflect application limits.
- **Load Testing**: Add a basic load testing utility to simulate high traffic on storefront and admin routes.

## Technical Details
- **Atomic Operations**: Using `SELECT ... FOR UPDATE` in PL/pgSQL to ensure thread-safe sequence increments.
- **Isolated Sequences**: Stress tests will use a `TEST-XXXX` prefix and its own counter.
- **Zod Validation**: Updated `invoiceSettingsInput` to handle the new `nextNumber` field.
- **Real-time Toasts**: Using `sonner` for immediate feedback on print status and audit log failures.

## Verification Plan

### Automated Tests
- Run `runInvoiceStressTest` from the Admin Panel to verify sequence isolation.
- Execute a sequence reset and verify the next created order matches the expected ID.
- Attempt to manually insert a duplicate `invoice_no` to verify database rejection and collision logging.

### Manual Verification
1. Set next serial to `CZP-01`.
2. Create website order (verify `CZP-01`).
3. Create admin order (verify `CZP-02`).
4. Set next serial to `CZP-100`.
5. Create order (verify `CZP-100`).
6. Run stress test and confirm production sequence is still `CZP-101`.
