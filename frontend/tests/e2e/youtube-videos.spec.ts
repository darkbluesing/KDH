import { test, expect } from '@playwright/test';

test.describe('YouTube Video Grid', () => {
  test('should load videos and display them in the grid', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      // Ignore favicon.ico errors, which are common and don't affect functionality
      if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) {
        consoleErrors.push(msg.text());
      }
    });

    // Intercept the network request to the videos API
    const apiResponsePromise = page.waitForResponse('**/api/youtube/videos**');

    await page.goto('/');

    const apiResponse = await apiResponsePromise;
    const responseStatus = apiResponse.status();
    const responseBody = await apiResponse.json();

    console.log(`API Response Status: ${responseStatus}`);
    console.log(`API Response Body: ${JSON.stringify(responseBody, null, 2)}`);

    // Check that there were no console errors during page load
    expect(consoleErrors).toEqual([]);

    // Check that the API call was successful
    expect(responseStatus).toBe(200);

    // Check that the API response contains a "videos" array, even if it's empty
    expect(Array.isArray(responseBody.videos)).toBe(true);

    // Wait for the grid to be populated and check the number of video cards
    const videoGrid = page.locator('#grid');
    await expect(videoGrid).toBeVisible();

    const videoCards = videoGrid.locator('a[href*="youtube.com/watch?v="]');
    const count = await videoCards.count();
    console.log(`Found ${count} video cards rendered in the DOM.`);

    // Expect at least one video card to be rendered
    await expect(videoCards.first()).toBeVisible();
    expect(count).toBeGreaterThan(0);
  });
});
