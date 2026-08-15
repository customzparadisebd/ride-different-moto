# Customer Fraud Marking System Implementation

Implement a professional fraud detection and marking system for CUSTOMZ PARADISE BD. This system will allow admins to flag suspicious customers by their phone number, ensuring that these warnings are visible across all management sections (Orders, Customers, etc.) to prevent fraudulent transactions.

## User-facing changes

- **Mark Fraud Action**: New "Mark Fraud" button/icon next to customer phone numbers in the Order List, Order Details, and Customer List.
- **Visual Warnings**: High-visibility fraud badges (Red "Fraud" or "Warning") displayed near phone numbers for flagged customers.
- **Fraud Details**: Clicking a fraud badge opens a dialog showing the reason, label (e.g., success rate percentage), and admin notes.
- **Management Form**: A "Mark Fraud" form for admins to set/update fraud status, add required notes, and optionally set a label.
- **Consistent Tracking**: Fraud status is linked to the phone number, making it appear automatically for any new order from the same customer.

## Technical details

- **Database Schema**:
  - `public.customer_fraud_marks`: New table keyed by `phone_number`.
  - Fields: `mark_type` (fraud/warning), `label`, `note` (required), `marked_by`, `marked_at`.
- **Backend Logic**:
  - `customer-fraud.functions.ts`: New server functions for `getFraudMark`, `setFraudMark`, and `removeFraudMark`.
  - Permission-gated: Management restricted to `admin` and `super_admin` roles.
  - Audit Logging: Every marking/unmarking action is recorded in the `admin_audit_log`.
- **UI Components**:
  - `FraudMarkBadge.tsx`: Reusable component to display the warning icon and trigger the details popup.
  - `MarkFraudDialog.tsx`: Dialog containing the management form.
  - Integration into `OrderCells.tsx`, `customers.tsx`, and `orders.$id.tsx`.
- **RBAC**: Enforce that only authorized roles can add or remove marks, while all staff can see them.
