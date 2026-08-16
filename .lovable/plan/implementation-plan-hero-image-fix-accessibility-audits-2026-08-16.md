# Implementation Plan - Hero Image Fix & Accessibility Audits

Connect Hero Section slides to their corresponding Bike Model images and add automated accessibility audits.

## User Review Required

> [!NOTE]
> The accessibility audits will be implemented as a new test suite under `tests/accessibility/`. You can run them manually or integrate them into a CI pipeline.

- No visual modifications to the website or admin panel.
- Reusing existing bike image mapping for Hero Section slides.
- Automated accessibility checks for focus management, contrast, and ARIA roles.

## Proposed Changes

### Database & Backend
#### [hero.functions.ts](src/lib/hero.functions.ts)
- Update `getHeroSlides` to fetch `image_url` and `mobile_image_url` from the linked `bike_models`.
- Add fallback logic: use `bike_model.image_url` if `hero_slides.image_url` is missing or empty.

### Accessibility Testing
#### [tests/accessibility/audit.spec.ts](tests/accessibility/audit.spec.ts)
- Implement `axe-core` and `Lighthouse` tests.
- Target key pages: Homepage, Bike Models, Product Details, Admin Login, and Admin Dashboard.
- Audit for keyboard navigation, focus indicators, and ARIA compliance.

### Admin Tools
#### [package.json](package.json)
- Add `test:a11y` script to run the accessibility audits.

## Technical Details

- **Hero Image Logic**: `image: slide.image_url || bikeModel?.image_url` ensures that if a specific hero image isn't set, it pulls from the linked bike model.
- **Accessibility Tools**: 
  - `axe-core/playwright`: Fast, automated accessibility engine.
  - `playwright-lighthouse`: Performance and deep accessibility auditing (simulates Lighthouse).
- **Concurrency**: `FOR UPDATE` locking (already present in database triggers) ensures invoice/order serials remain consistent even if multiple orders are placed during audits.

## Validation Plan
- [ ] Verify Hero Slider displays correct Pulsar N160 image when that model is active.
- [ ] Run `npm run test:a11y` and confirm basic compliance across main routes.
- [ ] Verify Admin Panel remains fully functional with current RBAC/MFA flow.
