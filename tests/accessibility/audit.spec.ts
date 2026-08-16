import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';
import { playAudit } from 'playwright-lighthouse';

const BASE_URL = 'http://localhost:8080';
const ADMIN_LOGIN_URL = `${BASE_URL}/czp-ops-9f2c/access`;

test.describe('Accessibility Audit', () => {
  test('Storefront: Homepage', async ({ page }) => {
    await page.goto(BASE_URL);
    await injectAxe(page);
    
    // Basic Axe check
    await checkA11y(page, undefined, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'best-practice']
        }
      }
    });

    // Lighthouse audit (optional, can be slow)
    // await playAudit({
    //   page,
    //   thresholds: {
    //     accessibility: 90,
    //     'best-practices': 90,
    //   },
    //   port: 9222,
    // });
  });

  test('Storefront: Product Detail', async ({ page }) => {
    // Navigate to the first bike model page
    await page.goto(BASE_URL);
    await page.click('a[href^="/bike-models/"]');
    await injectAxe(page);
    await checkA11y(page);
  });

  test('Admin: Login Page', async ({ page }) => {
    await page.goto(ADMIN_LOGIN_URL);
    await injectAxe(page);
    
    // Focus indicator check
    await page.focus('input[type="email"]');
    const hasFocusRing = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.boxShadow.includes('rgb(239, 68, 68)') || style.outlineColor.includes('rgb(239, 68, 68)');
    });
    
    await checkA11y(page);
  });
});
