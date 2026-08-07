import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:5000/api';

test.describe('RBAC & Authorization', () => {
  let adminToken;
  let commanderToken;
  let logisticsToken;
  let commanderBravoToken;

  test.beforeAll(async ({ request }) => {
    const login = async (user, pass) => {
      const res = await request.post(`${API_URL}/auth/login`, { data: { username: user, password: pass } });
      const body = await res.json();
      return body.token;
    };
    adminToken = await login('admin_user', 'AdminPass123!');
    commanderToken = await login('commander_alpha', 'CommandPass123!');
    logisticsToken = await login('logistics_officer', 'LogisticsPass123!');
    commanderBravoToken = await login('commander_bravo', 'CommandPassBravo!');
  });

  test('Admin accesses dashboard', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status()).toBe(200);
  });

  test('Base Commander blocked from creating transfers', async ({ request }) => {
    const res = await request.post(`${API_URL}/transfers`, {
      headers: { Authorization: `Bearer ${commanderToken}` },
      data: { sourceBaseId: 1, destinationBaseId: 2, equipmentTypeId: 1, quantity: 5 }
    });
    expect(res.status()).toBe(403);
  });

  test('Logistics Officer accesses Purchases/Transfers', async ({ request }) => {
    const res1 = await request.get(`${API_URL}/purchases`, { headers: { Authorization: `Bearer ${logisticsToken}` } });
    expect(res1.status()).toBe(200);
    const res2 = await request.get(`${API_URL}/transfers`, { headers: { Authorization: `Bearer ${logisticsToken}` } });
    expect(res2.status()).toBe(200);
  });

  test('Commander queries own base successfully', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics?baseId=1`, { headers: { Authorization: `Bearer ${commanderToken}` } });
    expect(res.status()).toBe(200);
  });

  test('Commander cross-base read returns 403', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics?baseId=2`, { headers: { Authorization: `Bearer ${commanderToken}` } });
    expect(res.status()).toBe(403);
  });

  test('Admin queries all bases', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status()).toBe(200);
  });

  test('Admin queries specific base', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics?baseId=2`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status()).toBe(200);
  });

  test('Commander Bravo queries Base 2 successfully', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics?baseId=2`, { headers: { Authorization: `Bearer ${commanderBravoToken}` } });
    expect(res.status()).toBe(200);
  });
});
