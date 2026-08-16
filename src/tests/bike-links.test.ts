import { test, expect } from '@playwright/test';

test.describe('Bike Model Navigation Links', () => {
  test('verify all Hero Slider slides link to correct bike model pages', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the hero slider to be visible
    const heroSection = page.locator('section').filter({ has: page.locator('.swiper') }).first();
    await expect(heroSection).toBeVisible();

    // Find all links within the hero section
    const links = await heroSection.locator('a[href^="/bike-models/"]').all();
    console.log(`Found ${links.length} bike model links in Hero Slider`);

    for (const link of links) {
      const href = await link.getAttribute('href');
      const text = await link.innerText();
      console.log(`Testing Hero link: ${href} (${text.trim()})`);
      
      // Click and verify navigation
      await link.click();
      await expect(page).toHaveURL(new RegExp(href!));
      
      // Verify H1 matches or contains expected model name if possible, 
      // but primary goal is verifying the slug exists and loads a page without "Not Found"
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      const h1Text = await h1.innerText();
      console.log(`Reached page: ${h1Text}`);
      
      await expect(page.locator('body')).not.toContainText('Bike model not found');
      
      // Go back for next iteration
      await page.goto('/');
    }
  });

  test('verify all Bike Explorer cards link to correct bike model pages', async ({ page }) => {
    await page.goto('/');
    
    // Locate the Bike Explorer section (usually contains the carousel)
    const explorerSection = page.locator('section').filter({ hasText: /EXPLORE OUR BIKES|BIKE EXPLORER/i }).first();
    await expect(explorerSection).toBeVisible();

    // Find all links within the explorer cards
    const links = await explorerSection.locator('a[href^="/bike-models/"]').all();
    console.log(`Found ${links.length} bike model links in Bike Explorer`);

    for (const link of links) {
      const href = await link.getAttribute('href');
      console.log(`Testing Explorer link: ${href}`);
      
      // Click and verify navigation
      await link.click();
      await expect(page).toHaveURL(new RegExp(href!));
      
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      await expect(page.locator('body')).not.toContainText('Bike model not found');
      
      // Go back for next iteration
      await page.goto('/');
    }
  });
});
