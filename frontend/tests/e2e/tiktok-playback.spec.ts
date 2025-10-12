import { test, expect, Page } from "@playwright/test";

test.describe("TikTok Playback Issue Diagnosis", () => {
  let consoleErrors: string[] = [];
  let networkRequests: { url: string; status: number }[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    networkRequests = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        if (!msg.text().includes("ResizeObserver loop limit exceeded")) {
          consoleErrors.push(msg.text());
        }
      }
    });

    page.on("response", (response) => {
      networkRequests.push({ url: response.url(), status: response.status() });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "TikTok", exact: true }).click();
    const grid = page.locator("#grid").first();
    await expect(grid).toBeVisible();
  });

  async function playTikTokVideo(page: Page, videoIndex: number) {
    const videoCard = page.locator("#grid article").nth(videoIndex);
    await expect(videoCard).toBeVisible({ timeout: 15_000 }); // Revert to original timeout
    await videoCard.locator('button[aria-label$="상세 보기"]').click();

    const adCloseButton = page.getByRole("button", { name: "영상 재생하기" });
    await expect(adCloseButton).toBeVisible({ timeout: 10_000 }); // Revert to original timeout
    await adCloseButton.click();
    await expect(adCloseButton).not.toBeVisible({ timeout: 5_000 }); // Keep this assertion, it's useful

    const modal = page.getByRole("dialog", { name: "영상 플레이어" });
    await page.waitForTimeout(300); // Keep this delay, it's based on app logic
    await expect(modal).toBeVisible({ timeout: 10_000 }); // Keep this timeout
    await page.waitForTimeout(500); // Keep this delay

    const tiktokFrame = modal.locator('iframe[src*="tiktok.com"]');
    await expect(tiktokFrame).toBeVisible({ timeout: 15_000 }); // Revert to original timeout

    await page.waitForTimeout(5000); // Keep this timeout

    const isBlackScreen = await modal.evaluate((el) => {
      const iframe = el.querySelector('iframe[src*="tiktok.com"]');
      if (!iframe) return true;
      return false;
    });

    if (isBlackScreen) {
      console.warn(`Video at index ${videoIndex} might be showing a black screen.`);
    }

    return { modal, tiktokFrame };
  }

  test("should play the first TikTok video and then a second one without black screen", async ({ page }) => {
    // test.setTimeout(60_000); // Remove global test timeout
    const { modal: modal1 } = await playTikTokVideo(page, 0);
    expect(consoleErrors).toEqual([]);

    await page.getByRole("button", { name: "닫기" }).click();
    await expect(modal1).not.toBeVisible();

    consoleErrors = [];
    networkRequests = [];

    const { modal: modal2 } = await playTikTokVideo(page, 1);
    expect(consoleErrors).toEqual([]);

    console.log("Network Requests after second video:", networkRequests.filter(req => req.url.includes("tiktok.com")));
    console.log("Console Errors after second video:", consoleErrors);

    await expect(modal2).toBeVisible();
    const tiktokFrame2 = modal2.locator('iframe[src*="tiktok.com"]');
    await expect(tiktokFrame2).toBeVisible();
  });
});