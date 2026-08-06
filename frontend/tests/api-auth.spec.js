/* global process */
import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:5000/api';

test.describe('Authentication & Authorization', () => {
  test('Valid login returns JWT', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { username: 'admin_user', password: 'AdminPass123!' }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(body.role).toBe('ADMIN');
  });

  test('Invalid password', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { username: 'admin_user', password: 'WrongPassword' }
    });
    expect(response.status()).toBe(401);
  });

  test('Non-existent username', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { username: 'unknown_user', password: 'AdminPass123!' }
    });
    expect(response.status()).toBe(401);
  });

  test('Missing fields', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { username: 'admin_user' }
    });
    expect(response.status()).toBe(400);
  });

  test('SQL injection attempt', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { username: "admin' OR '1'='1", password: 'password' }
    });
    expect(response.status()).toBe(401);
  });

  test('Missing token on protected route', async ({ request }) => {
    const response = await request.get(`${API_URL}/assets/metrics`);
    expect(response.status()).toBe(401);
  });

  test('Malformed token', async ({ request }) => {
    const response = await request.get(`${API_URL}/assets/metrics`, {
      headers: { Authorization: 'Bearer this.is.garbage' }
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Invalid authentication token.');
  });

  test('Expired token returns 401', async ({ request }) => {
    const expiredToken = jwt.sign(
      { id: 1, role: 'ADMIN', baseId: 1 },
      process.env.JWT_SECRET || 'supersecretjwtkey_for_development_only',
      { expiresIn: '-1h' }
    );
    const response = await request.get(`${API_URL}/assets/metrics`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Session expired. Please log in again.');
  });
});
