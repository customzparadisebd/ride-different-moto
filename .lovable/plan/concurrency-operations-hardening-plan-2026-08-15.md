# Concurrency & Operations Hardening Plan

Implement automated concurrency testing, a Super Admin alerting system for invoice collisions, and an operational runbook for the admin team.

## Proposed Changes

### Database & Backend
- **Alerting System**:
    - Create `notification_settings` table to manage admin alert preferences.
    - Implement a `log_security_event` helper that triggers alerts when `DUPLICATE_INVOICE_DETECTED` occurs.
    - Integration: Ensure the event includes details of both colliding orders and timestamps.
- **Automated Concurrency CI**:
    - Create `src/lib/tests/concurrency.test.ts` for automated invoice uniqueness validation.
    - This will be run via Vitest to verify sequence continuity.

### Admin Panel
- **Alert UI**:
    - Add a "Security Alerts" section to `SecurityDashboard.tsx`.
    - Display collision incidents with "Forensic View" showing payload differences.
- **Operational Runbook**:
    - Create `ADMIN_RUNBOOK.md` in the project root (accessible via a link in the Admin Panel help section).
    - Covers: Serial management, export workflows, printing protocols, and recovery steps.

### Technical Details
- **Alerting**: Use a database trigger or a server function listener on `invoice_collisions` to push notifications to the `admin_notifications` table.
- **Concurrency Test**: 
    ```typescript
    test('invoice sequence integrity', async () => {
      // Parallel order creation attempts
      // Verify no gaps and no duplicates
    });
    ```

## Verification Plan

### Automated Tests
- Run `npm run test:concurrency` to verify the logic.
- Mock high-concurrency environments to ensure the `FOR UPDATE` lock holds.

### Manual Verification
- Trigger a manual collision and verify the Super Admin dashboard shows a persistent alert.
- Review the `ADMIN_RUNBOOK.md` for clarity and completeness.
