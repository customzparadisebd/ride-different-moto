# Plan - Invisible Character Cleanup and Portability Hardening

This plan outlines the steps to remove the invisible separator character `\u2063` from the codebase and ensure all newly implemented features remain modular, portable, and reversible.

## User Review Required

> [!IMPORTANT]
> No critical items requiring user attention. The cleanup is a technical maintenance task, and the portability guidelines are being applied to the project's architecture.

## Proposed Changes

### Invisible Character Cleanup
- Remove the invisible separator character `\u2063` (often used as a zero-width non-joiner or for layout hacks) from code files where it was previously detected.
- Audit `src/routes/__root.tsx`, `src/data/site.ts`, `src/lib/settings.shared.ts`, and major public routes.

### Portability and Modularity Hardening
- Ensure that `site_settings` and `store_settings` remain independently manageable via the Admin Panel.
- Maintain clear separation between server functions (business logic) and UI components.
- Verify that features like the "360° Product Viewer" and "Hero Slider" can be disabled or modified without impacting core e-commerce functionality (orders, products, checkout).
- Ensure database migrations and RLS policies follow a standard pattern to facilitate potential environment migrations.

## Technical Details

### 1. Targeted File Cleanup
I will use `sed` or targeted `line_replace` to remove the `\u2063` character (hex `E2 81 A3`) from identified files.

### 2. Portability Audit
- Verify `src/lib/site-settings.functions.ts` handles defaults gracefully if the database table is empty.
- Ensure `src/components/home/HeroSlider.tsx` and `src/components/home/BikeModelCarousel.tsx` handle empty data states without crashing.

### 3. Verification Plan
- **Build Test**: Run `npm run build:dev` to ensure no syntax errors were introduced during cleanup.
- **Runtime Check**: Use a script to verify that no `\u2063` characters remain in the `src` directory.
- **Manual Verification**: Briefly check the Admin Panel settings to ensure they still function as intended.
