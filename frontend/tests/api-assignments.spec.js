import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:5000/api';

test.describe.serial('Assignments and Expenditures API Scenarios', () => {
  let adminToken;
  let commanderToken;
  let commander2Token;
  let logisticsToken;
  
  // Isolation: API tests will exclusively use Base 1 and EquipmentType 1, 
  // except where cross-base logic demands otherwise. UI tests will use Base 2 / Eq 2.
  const baseId = 1;
  const crossBaseId = 2; 
  const eqId = 1;

  test.beforeAll(async ({ request }) => {
    const login = async (user, pass) => {
      const res = await request.post(`${API_URL}/auth/login`, { data: { username: user, password: pass } });
      const body = await res.json();
      return body.token;
    };
    adminToken = await login('admin_user', 'AdminPass123!');
    commanderToken = await login('commander_alpha', 'CommandPass123!'); // Base 1
    commander2Token = await login('commander_bravo', 'CommandPassBravo!'); // Base 2
    logisticsToken = await login('logistics_officer', 'LogisticsPass123!');

    // Inject massive stock to prevent stockout failures during sequential tests
    await request.post(`${API_URL}/purchases`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { baseId, equipmentTypeId: eqId, quantity: 10000 }
    });
  });

  const getAvail = async (request, bId = baseId) => {
    const res = await request.get(`${API_URL}/assets/metrics?baseId=${bId}&equipmentTypeId=${eqId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const metrics = await res.json();
    return metrics.availableStock;
  };

  test.describe('1. Assignments - Creation', () => {
    test('ASG-01: Valid assignment creation', async ({ request }) => {
      const res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 5, personnelName: 'ASG-01 Soldier' }
      });
      expect(res.status()).toBe(201);
      const data = await res.json();
      expect(data.assignmentId).toBeDefined();
    });

    test('ASG-02, ASG-03: Assign exactly equal to Available Stock and 1 more (Boundary)', async ({ request }) => {
      const avail = await getAvail(request);
      
      // ASG-03: 1 more than available fails
      const resFail = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: avail + 1, personnelName: 'Overage' }
      });
      expect(resFail.status()).toBe(400);

      // ASG-02: Exactly equal succeeds
      const resSuccess = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: avail, personnelName: 'Exact' }
      });
      expect(resSuccess.status()).toBe(201);
    });

    test('ASG-04: Assign when Available is 0 but Closing > 0', async ({ request }) => {
      // Stock is currently 0 from the previous test. Closing balance is > 0.
      const res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 1, personnelName: 'Zero Stock' }
      });
      expect(res.status()).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Insufficient inventory');
      
      // Replenish for further tests
      await request.post(`${API_URL}/purchases`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 100 }
      });
    });

    test('ASG-05, ASG-06, ASG-07, ASG-08: Validation errors', async ({ request }) => {
      // ASG-05: Neg qty
      let res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: -1, personnelName: 'Sol' }
      });
      expect(res.status()).toBe(400);
      
      // ASG-06: Non-int
      res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: "abc", personnelName: 'Sol' }
      });
      expect(res.status()).toBe(400);

      // ASG-07: Missing name
      res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 1 }
      });
      expect(res.status()).toBe(400);

      // ASG-08: Bad FK
      res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: 9999, quantity: 1, personnelName: 'Sol' }
      });
      expect(res.status()).toBe(400);
    });

    test('ASG-09, ASG-10, ASG-11, ASG-12: RBAC and Cross-base', async ({ request }) => {
      // ASG-09: LO blocked
      let res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${logisticsToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 1, personnelName: 'LO' }
      });
      expect(res.status()).toBe(403);

      // ASG-10: Commander own base (base 1)
      res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 1, personnelName: 'Own' }
      });
      expect(res.status()).toBe(201);

      // ASG-11: Commander cross base (base 2)
      res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId: crossBaseId, equipmentTypeId: eqId, quantity: 1, personnelName: 'Cross' }
      });
      expect(res.status()).toBe(403);

      // ASG-12: Admin any base (base 2)
      // First ensure base 2 has stock
      await request.post(`${API_URL}/purchases`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { baseId: crossBaseId, equipmentTypeId: eqId, quantity: 10 }
      });
      res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { baseId: crossBaseId, equipmentTypeId: eqId, quantity: 1, personnelName: 'Admin' }
      });
      expect(res.status()).toBe(201);
    });
  });

  test.describe('2. Assignments - Return', () => {
    let activeId;
    test.beforeAll(async ({ request }) => {
      const res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 10, personnelName: 'Return Test' }
      });
      activeId = (await res.json()).assignmentId;
    });

    test('ASG-15, ASG-16: Valid return and double-return block', async ({ request }) => {
      const availBefore = await getAvail(request);
      
      // ASG-15
      let res = await request.post(`${API_URL}/assignments/${activeId}/return`, {
        headers: { Authorization: `Bearer ${commanderToken}` }
      });
      expect(res.status()).toBe(200);
      
      const availAfter = await getAvail(request);
      expect(availAfter).toBe(availBefore + 10);

      // ASG-16
      res = await request.post(`${API_URL}/assignments/${activeId}/return`, {
        headers: { Authorization: `Bearer ${commanderToken}` }
      });
      expect(res.status()).toBe(409);
    });

    test('ASG-17: Bad ID', async ({ request }) => {
      const res = await request.post(`${API_URL}/assignments/999999/return`, {
        headers: { Authorization: `Bearer ${commanderToken}` }
      });
      expect(res.status()).toBe(404);
    });

    test('ASG-19, ASG-20: Cross-base and LO return blocked', async ({ request }) => {
      // Create active in base 1
      const res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 1, personnelName: 'Cross Check' }
      });
      const id = (await res.json()).assignmentId;

      // ASG-19: Commander 2 tries to return base 1's assignment
      let ret = await request.post(`${API_URL}/assignments/${id}/return`, {
        headers: { Authorization: `Bearer ${commander2Token}` }
      });
      expect(ret.status()).toBe(403);

      // ASG-20: LO tries
      ret = await request.post(`${API_URL}/assignments/${id}/return`, {
        headers: { Authorization: `Bearer ${logisticsToken}` }
      });
      expect(ret.status()).toBe(403);
    });

    test('ASG-22: Concurrent double-return race', async ({ request }) => {
      // Create fresh assignment
      const res = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 2, personnelName: 'Race Return' }
      });
      const id = (await res.json()).assignmentId;

      const p1 = request.post(`${API_URL}/assignments/${id}/return`, { headers: { Authorization: `Bearer ${commanderToken}` } });
      const p2 = request.post(`${API_URL}/assignments/${id}/return`, { headers: { Authorization: `Bearer ${commanderToken}` } });
      const [r1, r2] = await Promise.all([p1, p2]);
      
      const statuses = [r1.status(), r2.status()];
      expect(statuses).toContain(200);
      expect(statuses).toContain(409);
    });

    test('ASG-23: Concurrent return + assign race', async ({ request }) => {
      // Zero out stock
      const avail = await getAvail(request);
      if (avail > 0) {
        await request.post(`${API_URL}/assignments`, {
          headers: { Authorization: `Bearer ${commanderToken}` },
          data: { baseId, equipmentTypeId: eqId, quantity: avail, personnelName: 'Zero' }
        });
      }

      // Add 5 units, assign them
      await request.post(`${API_URL}/purchases`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 5 }
      });
      const aRes = await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 5, personnelName: 'Race Holder' }
      });
      const { assignmentId } = await aRes.json();

      // Race: return 5, and assign 5.
      const pRet = request.post(`${API_URL}/assignments/${assignmentId}/return`, { headers: { Authorization: `Bearer ${commanderToken}` } });
      const pAss = request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 5, personnelName: 'Race Taker' }
      });

      const [rRet, rAss] = await Promise.all([pRet, pAss]);
      expect(rRet.status()).toBe(200);
      expect([201, 400]).toContain(rAss.status()); // 400 if assign executed before return committed
      
      // Replenish for future tests
      await request.post(`${API_URL}/purchases`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 100 }
      });
    });
  });

  test.describe('3. Expenditures', () => {
    test('EXP-01, EXP-02, EXP-03: Expenditure bounds', async ({ request }) => {
      const avail = await getAvail(request);
      
      // EXP-03: Expend + 1
      let res = await request.post(`${API_URL}/expenditures`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: avail + 1, reason: 'Too many' }
      });
      expect(res.status()).toBe(400);

      // EXP-02: Expend exact
      res = await request.post(`${API_URL}/expenditures`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: avail, reason: 'All of it' }
      });
      expect(res.status()).toBe(201);
    });

    test('EXP-04: Expend when stock is 0 but Closing > 0', async ({ request }) => {
      // From previous test, Available = 0
      const res = await request.post(`${API_URL}/expenditures`, {
        headers: { Authorization: `Bearer ${commanderToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 1, reason: 'Empty' }
      });
      expect(res.status()).toBe(400);
      
      // Replenish
      await request.post(`${API_URL}/purchases`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 50 }
      });
    });

    test('EXP-11: No reversal exists', async ({ request }) => {
      const res = await request.delete(`${API_URL}/expenditures/1`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect([404, 405]).toContain(res.status());
    });
  });

  test.describe('4. Two-Tier Inventory Logic', () => {
    test('AVAIL-01, AVAIL-02: Assignment affects Available but not Closing', async ({ request }) => {
      const m1 = await request.get(`${API_URL}/assets/metrics?baseId=${baseId}&equipmentTypeId=${eqId}`, { headers: { Authorization: `Bearer ${adminToken}` }});
      const before = await m1.json();

      await request.post(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { baseId, equipmentTypeId: eqId, quantity: 5, personnelName: 'Tier Test' }
      });

      const m2 = await request.get(`${API_URL}/assets/metrics?baseId=${baseId}&equipmentTypeId=${eqId}`, { headers: { Authorization: `Bearer ${adminToken}` }});
      const after = await m2.json();

      expect(after.closingBalance).toBe(before.closingBalance);
      expect(after.availableStock).toBe(before.availableStock - 5);
      expect(after.assigned).toBe(before.assigned + 5);
    });

    test('AVAIL-06: Transfer respects Available Stock', async ({ request }) => {
      const avail = await getAvail(request);
      // Attempt transfer of avail + 1
      const res = await request.post(`${API_URL}/transfers`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { sourceBaseId: baseId, destinationBaseId: crossBaseId, equipmentTypeId: eqId, quantity: avail + 1 }
      });
      expect(res.status()).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Insufficient inventory');
    });
  });
});
