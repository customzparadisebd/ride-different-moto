# Plan: Environment Indicator and Warning Banner

Add a professional environment indicator (Staging vs. Production) and a persistent warning banner to the Admin Panel to prevent accidental destructive actions in the wrong environment.

## User Review Required

> [!IMPORTANT]
> The environment detection will rely on the hostname. By default, `*.lovable.app` and `localhost` will be treated as **Staging**, while the custom production domain (once connected) will be treated as **Production**.

## Proposed Changes

### Admin Panel UI

- **Environment Badge**: A clear indicator in the top header showing "STAGING" or "PRODUCTION".
- **Warning Banner**: A high-visibility, dismissible (but persistent per session) banner that appears when in the Staging environment to warn about non-live data.
- **Visual Distinction**: The Production environment will use the standard "True Red" accents, while Staging will use a distinctive "Warning Orange/Yellow" to provide immediate visual context.

### Technical Details

- **Environment Detection**: Implement a helper utility to determine the environment based on `window.location.hostname`.
- **AdminShell Integration**: Update `src/components/admin/AdminShell.tsx` to include the banner and badge.
- **Styling**: Use existing Tailwind tokens with a new semantic `warning` color for staging visibility.

## Implementation Steps

1. **Utility Creation**: Create `src/lib/env.ts` for environment detection logic.
2. **UI Component**: Build the `EnvironmentBanner` component.
3. **Shell Integration**: Modify `AdminShell.tsx` to inject the banner and header badge.
4. **Testing**: Verify display on the current preview (Staging).
5. **Notes**: Update `DEVELOPER_NOTES.md`.
