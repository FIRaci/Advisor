import { test, expect } from '@playwright/test';

test.describe('AdvisorAI Chat Interface', () => {
  // Mock login state if needed, but since we just want to see if the page renders, 
  // we can mock the auth API or just hit the home page.
  // Actually, /chat requires auth. Let's see if we get redirected to /login first.
  
  test('redirects to login if not authenticated', async ({ page }) => {
    await page.goto('/chat');
    await expect(page).toHaveURL(/\/login/);
  });

  test('landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    // Check if the page title contains AdVisor
    await expect(page).toHaveTitle(/AdVisor/);
  });
});
