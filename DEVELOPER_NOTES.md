# Developer Notes
Project: CUSTOMZ PARADISE BD
Author: Rafi Gazi (Rabbee) Apps

## Completed Milestones
- [x] Initial design system and brand integration.
- [x] Advanced Admin Dashboard with Recharts metrics.
- [x] Sequential Invoice Generation (CZP-XX).
- [x] Customer Fraud Marking System.
- [x] SteadFast Courier Bulk Booking & Tracking.
- [x] Dynamic Bike Model Management.
- [x] Responsive Product Card & Storefront refactor.
- [x] Project Attribution & Documentation Cleanup (Aug 2026).
- [x] Implemented API Rate Limiting and Login Throttling.
- [x] Hardened Security Headers (CSP, HSTS, XSS Protection).
- [x] Created Admin Security Events page for monitoring throttling activity.
- [x] Hardened backend authorization logic and database grants based on security scan (Aug 2026).
- [x] **Smooth Custom Cursor:** Implemented a minimal Cyan Blue (#06B6D4) following ring with smooth interpolation site-wide and in Admin panel (Aug 15, 2026).
- [x] **Responsive Order Animation:** Updated Order Confirmation animation to be fully responsive (320px to 640px max-width) and set to infinite loop (Aug 15, 2026).
- [x] **Product Form Enhancements:** Added inline validation, placeholders, examples, and image guidelines to Admin Product Form (Aug 15, 2026).
- [x] **Staff Login Approval System:** Implemented mandatory per-login administrator approval for Staff users with real-time status polling, request expiration (10m), and comprehensive audit logging (Aug 15, 2026).
- [x] **Customer Data Management & Recycle Bin:** Created a dedicated `customers` table populated from orders, with a secure soft-delete (Recycle Bin) system. Restricted delete/restore/purge actions to Admin and Super Admin roles only, ensuring data preservation for order history (Aug 15, 2026).

## Documentation Strategy
- Use JSDoc for complex server functions and components.
- Maintain strict RBAC (Super Admin/Admin/Staff).
- All orders must follow the verified server-side pricing logic.