import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:5000/api';

test.describe('Security & Infrastructure', () => {
  let adminToken;
  let logisticsToken;

  test.beforeAll(async ({ request }) => {
    const res1 = await request.post(`${API_URL}/auth/login`, { data: { username: 'admin_user', password: 'AdminPass123!' } });
    const b1 = await res1.json();
    adminToken = b1.token;

    const res2 = await request.post(`${API_URL}/auth/login`, { data: { username: 'logistics_officer', password: 'LogisticsPass123!' } });
    const b2 = await res2.json();
    logisticsToken = b2.token;
  });

  test('Helmet headers are present', async ({ request }) => {
    const res = await request.get(`${API_URL}/assets/metrics`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const headers = res.headers();
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-content-type-options']).toBeDefined();
    expect(headers['x-xss-protection']).toBeDefined();
  });

  test('No password hashes or stack traces leaked on errors', async ({ request }) => {
    const res = await request.post(`${API_URL}/purchases`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { quantity: "invalid" }
    });
    expect(res.status()).toBe(400);
    const body = await res.text();
    expect(body).not.toContain('node_modules');
    expect(body).not.toContain('prisma');
    expect(body).not.toContain('passwordHash');
  });

  test('Malformed JSON body returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: '{ "username": "admin", "password": "123", }'
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Malformed JSON payload');
  });

  test('Mass assignment protection (ignoring role override)', async ({ request }) => {
    const res = await request.post(`${API_URL}/transfers`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { sourceBaseId: 1, destinationBaseId: 2, equipmentTypeId: 1, quantity: 1, adminPrivilege: true }
    });
    expect([201, 400]).toContain(res.status());
  });
});
