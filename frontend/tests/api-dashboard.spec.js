import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:5000/api';

test.describe('Dashboard & Aggregations', () => {
  let adminToken;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, { data: { username: 'admin_user', password: 'AdminPass123!' } });
    const body = await res.json();
    adminToken = body.token;
  });

  test('Dashboard formulas and global aggregations are correct', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    
    const expectedNet = body.purchases + body.transfersIn - body.transfersOut;
    expect(body.netMovement).toBe(expectedNet);
    expect(body.closingBalance).toBe(body.openingBalance + expectedNet - (body.expended || 0));
  });

  test('Filter by baseId', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics?baseId=1`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.transfersOut).toBeGreaterThanOrEqual(0);
  });

  test('Filter by date range', async ({ request }) => {
    const futureStr = '2099-01-01';
    const futureEnd = '2099-12-31';
    const res = await request.get(`${API_URL}/assets/metrics?startDate=${futureStr}&endDate=${futureEnd}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.purchases).toBe(0);
    expect(body.transfersIn).toBe(0);
    expect(body.transfersOut).toBe(0);
    expect(body.netMovement).toBe(0);
  });

  test('Zero activity for non-existent base returns zeros gracefully', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics?baseId=9999`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.purchases).toBe(0);
    expect(body.transfersOut).toBe(0);
    expect(body.closingBalance).toBe(0);
  });

  test('Invalid non-numeric baseId', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics?baseId=not_a_number`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect([200, 400]).toContain(res.status());
  });
});
