import { test, expect } from '@playwright/test';

// Use baseId 2 and equipmentTypeId 1 to isolate UI tests from API tests (Base 1)
const baseId = 2;
const eqId = 1;

test.describe.serial('Assignments and Expenditures - Frontend & E2E', () => {
  test('FE-16, E2E-09: Logistics Officer cannot see or access Assignments', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'logistics_officer');
    await page.fill('input[type="password"]', 'LogisticsPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Role: LOGISTICS_OFFICER')).toBeVisible();
    
    // Sidebar link absent
    await expect(page.locator('a:has-text("Assignments")')).not.toBeVisible();
    
    // Direct URL navigation should redirect to home
    await page.goto('/assignments');
    await expect(page).toHaveURL('/');
  });

  test('E2E-11: Cross-base isolation for Base Commander', async ({ page }) => {
    // Commander Alpha (Base 1)
    await page.goto('/login');
    await page.fill('input[type="text"]', 'commander_alpha');
    await page.fill('input[type="password"]', 'CommandPass123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    
    await page.goto('/assignments');
    await expect(page.locator('h1:has-text("Assignments & Expenditures")')).toBeVisible();
    
    // Check if select element for base is disabled or locked to Base 1
    const baseSelect = page.locator('select#baseId');
    await expect(baseSelect).toHaveValue('1');
    await expect(baseSelect).toBeDisabled();
  });

  test.describe('Commander Base 2 UI Flows', () => {
    test.beforeEach(async ({ page, request }) => {
      // Create initial stock for UI tests as admin
      const adminRes = await request.post('http://localhost:5000/api/auth/login', { data: { username: 'admin_user', password: 'AdminPass123!' } });
      const adminData = await adminRes.json();
      await request.post('http://localhost:5000/api/purchases', {
        headers: { Authorization: `Bearer ${adminData.token}` },
        data: { baseId: 2, equipmentTypeId: 1, quantity: 100 }
      });

      // Login as commander bravo (base 2)
      await page.goto('/login');
      await page.fill('input[type="text"]', 'commander_bravo');
      await page.fill('input[type="password"]', 'CommandPassBravo!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');
      await page.goto('/assignments');
    });

    test('FE-17, FE-18: Form Validation blocks invalid submissions', async ({ page }) => {
      // Assignments tab
      await page.click('button:has-text("Assignments")');
      
      // Empty personnel name, click submit
      await page.selectOption('select#equipmentTypeId', '1');
      await page.fill('input#quantity', '5');
      await page.click('button[type="submit"]:has-text("Create Assignment")');
      // Should show validation error from browser (required field)
      const personnelInput = page.locator('input#personnelName');
      await expect(personnelInput).toBeFocused();

      // Negative qty
      await page.fill('input#personnelName', 'Test Name');
      await page.fill('input#quantity', '-5');
      await page.click('button[type="submit"]:has-text("Create Assignment")');
      const qtyInput = page.locator('input#quantity');
      await expect(qtyInput).toBeFocused(); // Browser HTML5 validation

      // Expenditures tab
      await page.click('button:has-text("Expenditures")');
      await page.fill('input#quantity', '10');
      await page.click('button[type="submit"]:has-text("Log Expenditure")');
      const reasonInput = page.locator('input#reason');
      await expect(reasonInput).toBeFocused();
    });

    test('E2E-08, FE-19, FE-20, FE-23: Full Lifecycle & UI State Updates', async ({ page, request }) => {
      // FE-20: Register dialog handler globally for this test
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Are you sure');
        await dialog.accept();
      });

      // Get dynamic baseline stock to avoid failures from previous run accumulations
      const metricsRes = await request.get('http://localhost:5000/api/assets/metrics?baseId=2&equipmentTypeId=1', {
        headers: { Authorization: `Bearer ${(await (await request.post('http://localhost:5000/api/auth/login', { data: { username: 'commander_bravo', password: 'CommandPassBravo!' } })).json()).token}` }
      });
      const initialMetrics = await metricsRes.json();
      const expectedClosing = initialMetrics.closingBalance - 3; // we expend 3
      const expectedAvailable = initialMetrics.availableStock - 3; // active assignment is returned, then we expend 3

      // Use a unique personnel name to avoid conflicts with data from previous aborted runs
      const uniquePersonnel = `Lifecycle Soldier ${Date.now()}`;

      // Create Assignment (E2E-08)
      await page.click('button:has-text("Assignments")');
      await page.selectOption('select#equipmentTypeId', '1'); // Rifle
      await page.fill('input#quantity', '5');
      await page.fill('input#personnelName', uniquePersonnel);
      await page.click('button[type="submit"]:has-text("Create Assignment")');
      
      // Wait for table to update
      await expect(page.locator('tr', { hasText: uniquePersonnel }).filter({ hasText: 'ACTIVE' }).first()).toBeVisible();
      
      // Confirm return button is visible for this active assignment
      const returnBtn = page.locator('tr', { hasText: uniquePersonnel }).filter({ hasText: 'ACTIVE' }).first().locator('button:has-text("Return")');
      await expect(returnBtn).toBeVisible();

      // RETURN (Dialog is auto-handled by page.on listener registered above)
      await returnBtn.click();
      
      // Wait for status to change to RETURNED, which hides the return button
      await expect(page.locator('tr', { hasText: uniquePersonnel }).filter({ hasText: 'RETURNED' }).first()).toBeVisible();
      await expect(returnBtn).not.toBeVisible();

      // EXPEND
      const uniqueReason = `Lifecycle Test ${Date.now()}`;
      await page.click('button:has-text("Expenditures")');
      await page.selectOption('select#equipmentTypeId', '1');
      await page.fill('input#quantity', '3');
      await page.fill('input#reason', uniqueReason);
      await page.click('button[type="submit"]:has-text("Log Expenditure")');

      // Wait for table update
      await expect(page.locator(`td:has-text("${uniqueReason}")`)).toBeVisible();
      
      // Check Dashboard (FE-22, FE-23)
      await page.goto('/');
      // Set dashboard filter to base 2, eq 1
      await page.selectOption('select#baseId', '2');
      await page.selectOption('select#equipmentTypeId', '1');

      // Given starting stock was dynamic, we assigned 5 (returned 5), expended 3
      // Closing = initial - 3. Available = initial - 3 (since active assignment was returned).
      await expect(page.locator('.stat-card:has-text("Closing Balance") >> p').filter({ hasText: expectedClosing.toString() })).toBeVisible();
      await expect(page.locator('.stat-card:has-text("Available Stock") >> p').filter({ hasText: expectedAvailable.toString() })).toBeVisible();
    });
  });

  test('E2E-10: Same-base concurrent assignment race (UI perspective / API trigger)', async ({ request }) => {
    // 1. Give Base 2 exact stock (e.g. 1 unit)
    const adminRes = await request.post('http://localhost:5000/api/auth/login', { data: { username: 'admin_user', password: 'AdminPass123!' } });
    const adminToken = (await adminRes.json()).token;
    const cmdrRes = await request.post('http://localhost:5000/api/auth/login', { data: { username: 'commander_bravo', password: 'CommandPassBravo!' } });
    const cmdrToken = (await cmdrRes.json()).token;

    // Zero out current stock by assigning all of it, if any
    const metrics = await (await request.get(`http://localhost:5000/api/assets/metrics?baseId=${baseId}&equipmentTypeId=${eqId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })).json();

    if (metrics.availableStock > 0) {
      await request.post(`http://localhost:5000/api/assignments`, {
        headers: { Authorization: `Bearer ${cmdrToken}` },
        data: { baseId: 2, equipmentTypeId: 1, quantity: metrics.availableStock, personnelName: 'Flush' }
      });
    }

    // Now give exactly 1 unit
    await request.post(`http://localhost:5000/api/purchases`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { baseId: 2, equipmentTypeId: 1, quantity: 1 }
    });

    // Fire two requests concurrently for the exact same 1 unit
    const p1 = request.post(`http://localhost:5000/api/assignments`, {
      headers: { Authorization: `Bearer ${cmdrToken}` },
      data: { baseId: 2, equipmentTypeId: 1, quantity: 1, personnelName: 'Race 1' }
    });
    const p2 = request.post(`http://localhost:5000/api/assignments`, {
      headers: { Authorization: `Bearer ${cmdrToken}` },
      data: { baseId: 2, equipmentTypeId: 1, quantity: 1, personnelName: 'Race 2' }
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    const statuses = [r1.status(), r2.status()];
    
    // Exactly one should succeed, other should fail with 400
    expect(statuses.includes(201)).toBe(true);
    expect(statuses.includes(400)).toBe(true);
  });
});
