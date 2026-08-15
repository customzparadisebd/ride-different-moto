# Production-Readiness Audit & Quality Control Plan

Perform a complete end-to-end audit, testing, debugging, and quality check of the entire project to ensure production readiness.

## User Review Required

> [!IMPORTANT]
> This audit involves executing end-to-end tests and security scans. I will use Playwright for UI testing and manual code review for security.

- **Admin Login:** I will need to simulate admin login for testing. I will use the established super-admin account `customzparadisebd@gmail.com`.
- **SteadFast Sandbox:** If a sandbox API key is not available, SteadFast submission tests will be simulated or limited to validation checks to avoid accidental production bookings.

## Proposed Changes

### 1. Customer Website Audit
- **Verification:** Test Homepage, sticky nav, Product listing/details, Cart, and Checkout.
- **Fixes:** Resolve any layout shifts, broken images, or navigation errors.
- **Responsiveness:** Test mobile, tablet, and desktop viewports.

### 2. Admin Panel Audit
- **Auth Flow:** Verify Login → MFA → Staff Approval sequence.
- **Management:** Test Order creation/editing, Product 360 management, and User RBAC.
- **Tools:** Audit Invoice serial generation (CZP-XX) and Excel exports.

### 3. Backend & Security Audit
- **Database:** Verify all `public` tables have `GRANT`s and `RLS` policies.
- **Security:** Check for exposed secrets, XSS/Injection risks, and unauthorized access vectors.
- **Integrations:** Verify SteadFast API handling and shipment timeline syncing.

### 4. Accessibility & Performance
- **A11y:** Ensure keyboard navigation (Tab/Enter/Esc) and ARIA labels are present.
- **Perf:** Optimize image loading (WebP) and database query efficiency.

### 5. Automated Testing
- **Unit/Integration:** Fix existing test scripts in `package.json` and ensure they pass.
- **E2E:** Create a robust Playwright script covering the full order-to-shipment lifecycle.

## Technical Details

- **Test Suite:** Update `package.json` to include `test:acc` (accessibility) and `test:e2e` (Playwright).
- **Audit Logs:** Ensure every security event (failed login, unauthorized access) is correctly logged.
- **Error Handling:** Standardize all server function errors to return user-friendly messages via `sonner`.

## Success Criteria
- [ ] 0 Critical TypeScript errors.
- [ ] 0 Security vulnerabilities (RLS/RBAC/Secrets).
- [ ] 100% Successful critical E2E flows (Checkout, Admin Login).
- [ ] Responsive design verified on all breakpoints.
- [ ] Final `PRODUCTION_AUDIT_REPORT.md` generated.
