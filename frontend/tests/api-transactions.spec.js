import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:5000/api';

test.describe.serial('Core Business Logic - Transactions', () => {
  let logisticsToken;

  test.beforeAll(async ({ request }) => {
    const login = async (user, pass) => {
      const res = await request.post(`${API_URL}/auth/login`, { data: { username: user, password: pass } });
      const body = await res.json();
      return body.token;
    };
    await login('admin_user', 'AdminPass123!');
    logisticsToken = await login('logistics_officer', 'LogisticsPass123!');
  });

  test('Valid purchase creation by Logistics Officer', async ({ request }) => {
    const res = await request.post(`${API_URL}/purchases`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { baseId: 1, equipmentTypeId: 1, quantity: 100 }
    });
    expect(res.status()).toBe(201);
  });

  test('Negative or zero quantity purchase rejected', async ({ request }) => {
    const res1 = await request.post(`${API_URL}/purchases`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { baseId: 1, equipmentTypeId: 1, quantity: -10 }
    });
    expect(res1.status()).toBe(400);

    const res2 = await request.post(`${API_URL}/purchases`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { baseId: 1, equipmentTypeId: 1, quantity: 0 }
    });
    expect(res2.status()).toBe(400);
  });

  test('Non-existent equipment type', async ({ request }) => {
    const res = await request.post(`${API_URL}/purchases`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { baseId: 1, equipmentTypeId: 9999, quantity: 10 }
    });
    expect(res.status()).toBe(400);
  });

  test('Invalid data types in purchase', async ({ request }) => {
    const res = await request.post(`${API_URL}/purchases`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { baseId: 1, equipmentTypeId: 1, quantity: "ten" }
    });
    expect(res.status()).toBe(400);
  });

  test('Valid transfer creation', async ({ request }) => {
    const res = await request.post(`${API_URL}/transfers`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { sourceBaseId: 1, destinationBaseId: 2, equipmentTypeId: 1, quantity: 10 }
    });
    expect(res.status()).toBe(201);
  });

  test('Transfer with insufficient source stock rejected', async ({ request }) => {
    const res = await request.post(`${API_URL}/transfers`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { sourceBaseId: 1, destinationBaseId: 2, equipmentTypeId: 1, quantity: 999999 }
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Insufficient inventory');
  });

  test('Transfer to same base rejected', async ({ request }) => {
    const res = await request.post(`${API_URL}/transfers`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { sourceBaseId: 1, destinationBaseId: 1, equipmentTypeId: 1, quantity: 5 }
    });
    expect(res.status()).toBe(400);
  });

  test('Transfer with negative quantity rejected', async ({ request }) => {
    const res = await request.post(`${API_URL}/transfers`, {
      headers: { Authorization: `Bearer ${logisticsToken}` },
      data: { sourceBaseId: 1, destinationBaseId: 2, equipmentTypeId: 1, quantity: -5 }
    });
    expect(res.status()).toBe(400);
  });

  test('Concurrent transfers do not bypass inventory limits (race condition)', async ({ request }) => {
    const promises = [];
    for(let i=0; i<5; i++) {
      promises.push(request.post(`${API_URL}/transfers`, {
        headers: { Authorization: `Bearer ${logisticsToken}` },
        data: { sourceBaseId: 1, destinationBaseId: 2, equipmentTypeId: 1, quantity: 80 }
      }));
    }
    const responses = await Promise.all(promises);
    const successes = responses.filter(r => r.status() === 201).length;
    expect(successes).toBe(1);
  });
});
