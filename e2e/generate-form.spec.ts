import { test, expect } from '@playwright/test';

test.describe('Generate Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders topic input', async ({ page }) => {
    const topicInput = page.locator('#topic-input');
    await expect(topicInput).toBeVisible();
  });

  test('renders style cards (at least 6)', async ({ page }) => {
    const styleCards = page.locator('[role="radio"]');
    await expect(styleCards.first()).toBeVisible();
    const count = await styleCards.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('generate button is disabled when topic is empty', async ({ page }) => {
    const button = page.getByRole('button', { name: /블로그 글 생성/ });
    await expect(button).toBeDisabled();
  });

  test('generate button enables after topic input', async ({ page }) => {
    const topicInput = page.locator('#topic-input');
    await topicInput.fill('서울 맛집 추천');
    const button = page.getByRole('button', { name: /블로그 글 생성/ });
    await expect(button).toBeEnabled();
  });
});
