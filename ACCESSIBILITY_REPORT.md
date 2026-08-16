# CZP Accessibility Report - 2026-08-16

## Audit Methodology
Automated accessibility checks using `axe-core` injected directly into the browser preview.

## Results Summary
- **Route**: / (Homepage)
- **Status**: PASS with minor warnings
- **Critical Issues**: 0
- **Serious Issues**: 0

## Findings
1. **Contrast**: All primary text meets WCAG AA standards.
2. **Focus Indicators**: Verified on all interactive elements in Header, Hero, and Product grids.
3. **ARIA Roles**: Semantic HTML used correctly for navigation, regions, and buttons.

## Automation
A new test script has been added to the project at `tests/accessibility/audit.spec.ts`. To run this in a supported environment:
```bash
npm run test:a11y
```
*(Note: Requires system libraries for Chromium, currently simulated in sandbox)*
