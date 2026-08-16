import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
// lighthouse integration usually needs more setup for playwright-lighthouse in simple scripts, eliding for now

const BASE_URL = 'http://localhost:8080';
const ADMIN_LOGIN_URL = `${BASE_URL}/czp-ops-9f2c/access`;

test.describe('Accessibility Audit', () => {
  test('Storefront: Homepage', async ({ page }) => {
    await page.goto(BASE_URL);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('Storefront: Product Detail', async ({ page }) => {
    await page.goto(BASE_URL);
    // Find first bike model link
    const bikeLink = page.locator('a[href^="/bike-models/"]').first();
    await bikeLink.click();
    
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Admin: Login Page', async ({ page }) => {
    await page.goto(ADMIN_LOGIN_URL);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
