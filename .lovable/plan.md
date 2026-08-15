# Security Monitoring Dashboard

Create a comprehensive security dashboard for admins to monitor authentication failures, rate-limiting, and other security-related events.

## Features
- **Security Summary Cards**: At-a-glance metrics for Auth Failures, Rate Limits, and Suspicious IPs.
- **Activity Visualization**: A time-series chart showing security event trends over the last 24 hours.
- **Suspicious IP Tracking**: Dedicated view for IPs with high failure/throttle counts.
- **Unified Event Log**: Filterable list of all security-related incidents.
- **Real-time Updates**: Supabase Realtime integration for live monitoring.

## Technical Details

### Backend Changes
- **Database**: Use existing `security_events`, `login_attempts`, and `admin_audit_log` tables.
- **Server Functions**:
    - Update `listSecurityEvents` to support more event types (CSP/CORS if logged).
    - Create `getSecurityStats` in `src/lib/security-events.functions.ts` to fetch aggregated metrics.
    - Create `getSuspiciousIPs` to identify potential attackers.
- **Middleware**: Ensure `requireSupabaseAuth` and `assertAccess(PERMISSIONS.securityManage)` are applied.

### Frontend Changes
- **Route**: New route `src/routes/_authenticated/ad/security-dashboard.tsx`.
- **Components**:
    - `SecurityStatsCards`: Grid of metric cards with trend indicators.
    - `SecurityEventsChart`: Recharts-based time-series graph.
    - `SuspiciousIPList`: Table showing flagged IPs and their activity counts.
    - `SecurityDashboardShell`: Main layout for the dashboard.
- **Navigation**: Add "Security Dashboard" to `src/components/admin/AdminSidebar.tsx`.

### UI/UX
- **Theme**: Stick to the project's dark theme (Apple-like minimal, True Red accents).
- **Responsive**: Mobile-friendly layout with stacked cards and scrollable tables.
