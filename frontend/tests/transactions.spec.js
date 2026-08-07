import { test, expect } from '@playwright/test';

test.describe('Transactions and Edge Cases', () => {
  test('Prevents transfer with insufficient inventory', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin_user');
    await page.fill('input[type="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    await page.click('a:has-text("Transfers")');
    await expect(page).toHaveURL('/transfers');
    
    await page.getByLabel('Source Base ID').fill('1');
    await page.getByLabel('Destination Base ID').fill('2');
    await page.getByLabel('Equipment Type ID').fill('1');
    await page.getByLabel('Quantity').fill('999999');
    
    await page.click('button:has-text("Transfer")');

    await expect(page.locator('text=Insufficient inventory')).toBeVisible();
  });

  test('Prevents same-base transfers', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin_user');
    await page.fill('input[type="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Transfers")');
    
    await page.getByLabel('Source Base ID').fill('1');
    await page.getByLabel('Destination Base ID').fill('1');
    await page.getByLabel('Equipment Type ID').fill('1');
    await page.getByLabel('Quantity').fill('10');
    
    await page.click('button:has-text("Transfer")');

    await expect(page.locator('text=Source and destination base cannot be the same')).toBeVisible();
  });
});
