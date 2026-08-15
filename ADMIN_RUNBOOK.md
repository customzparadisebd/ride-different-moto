# CUSTOMZ PARADISE BD — Admin Operations Runbook

This document defines critical procedures for managing orders, invoices, and system security.

## 1. Invoice Numbering & Serial Management
All orders (Website & Manual) follow a single sequential sequence: `CZP-YYMM-XXXX`.

### Manual Serial Override
If the sequence needs to be adjusted (e.g., skip a range or reset after a test):
1. Navigate to **Admin Panel > Settings > Invoice Settings**.
2. Locate the **"Set Next Invoice Serial"** field.
3. Enter the desired number (e.g., if you want the next invoice to be `1050`, enter `1050`).
4. **Super Admin confirmation is required.** The system logs this action in the Audit Trail.

### Collision Handling
If the system detects a duplicate invoice attempt:
1. The request is **blocked immediately** at the database level.
2. A high-visibility alert is pushed to the **Security Dashboard**.
3. Admin receives a toast notification: `DUPLICATE INVOICE DETECTED`.
4. Review the **Forensic Log** in the Security Dashboard to identify the source of the conflict.

---

## 2. Order Management & Export
### Bulk Export to Excel
To generate reports or process bulk data:
1. Navigate to **Admin Panel > Orders**.
2. Use filters (Date Range, Status, Staff) to isolate the required data.
3. Click **"Filtered Excel (.xlsx)"**.
4. The generated file includes: Order ID, Invoice ID, Customer Details, Items, and Totals.

---

## 3. Printing Protocols
### POS Invoices
1. Open any order and click **"Print Invoice"**.
2. The print view is optimized for POS thermal printers and standard A4 (ink-saving mode).
3. **Important**: The order is only marked as "Printed" **after** the browser print dialog is successfully completed. If cancelled, the status remains unchanged.

---

## 4. Recovery & Rollback
### Soft-Delete (Recycle Bin)
- Orders and Customers are never permanently deleted via the standard UI.
- Use the **Recycle Bin** to restore accidentally deleted records.
- Permanent deletion is restricted to Super Admins via the database console.

### Concurrency Stress Testing
- Admins can trigger a **Stress Test** from the Security Dashboard.
- **Test Isolation**: These tests use a dedicated sequence and **DO NOT** affect production numbering.
- If a stress test fails, notify technical support immediately as it indicates a locking failure in the database.

---

## 5. Security & Access
- **MFA**: All staff are required to enable MFA.
- **Login Approval**: New staff accounts require manual approval by a Super Admin after email verification.
- **Audit Logs**: Every sensitive action (printing, serial reset, export) is recorded with the Actor's IP and Timestamp.
