import { test, expect } from '@playwright/test';

test.describe('RBAC Scoping', () => {
  test('Base Commander only sees their assigned base in UI', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'commander_alpha');
    await page.fill('input[type="password"]', 'CommandPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Role: BASE_COMMANDER')).toBeVisible();
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('a:has-text("Transfers")')).not.toBeVisible();
    await expect(page.locator('a:has-text("Purchases")')).not.toBeVisible();
  });

  test('Logistics Officer can access Transfers', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'logistics_officer');
    await page.fill('input[type="password"]', 'LogisticsPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Role: LOGISTICS_OFFICER')).toBeVisible();
    
    await page.click('a:has-text("Transfers")');
    await expect(page).toHaveURL('/transfers');
    await expect(page.locator('h1:has-text("Transfers")')).toBeVisible();
  });
});
