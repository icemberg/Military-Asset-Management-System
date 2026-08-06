import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('Admin can log in and see dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin_user');
    await page.fill('input[type="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Role: ADMIN')).toBeVisible();
  });

  test('Shows error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin_user');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
