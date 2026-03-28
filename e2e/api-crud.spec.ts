import { test, expect } from '@playwright/test';

test.describe('API CRUD', () => {
  test('GET /api/history returns 200 with items', async ({ request }) => {
    const response = await request.get('/api/history');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBeTruthy();
  });

  test('GET /api/settings returns 200', async ({ request }) => {
    const response = await request.get('/api/settings');
    expect(response.ok()).toBeTruthy();
  });

  test('GET /api/form-presets returns array', async ({ request }) => {
    const response = await request.get('/api/form-presets');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /api/custom-styles returns array', async ({ request }) => {
    const response = await request.get('/api/custom-styles');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});
