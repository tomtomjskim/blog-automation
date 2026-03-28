import { test, expect } from '@playwright/test';

const pages = [
  { path: '/', title: 'Blog Auto' },
  { path: '/history', title: 'Blog Auto' },
  { path: '/dashboard', title: 'Blog Auto' },
  { path: '/settings', title: 'Blog Auto' },
  { path: '/keywords', title: 'Blog Auto' },
  { path: '/calendar', title: 'Blog Auto' },
];

for (const page of pages) {
  test(`${page.path} loads successfully`, async ({ page: p }) => {
    const response = await p.goto(page.path);
    expect(response?.ok()).toBeTruthy();
    await expect(p).toHaveTitle(new RegExp(page.title));
  });
}
