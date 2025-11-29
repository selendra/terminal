import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the homepage", async ({ page }) => {
    // Check that the page has a title
    await expect(page).toHaveTitle(/Selendra/i);
  });

  test("should display the main navigation", async ({ page }) => {
    // Check for navigation elements
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("should have a wallet connect button", async ({ page }) => {
    // Look for connect wallet button - it might have different text
    const connectButton = page.getByRole("button", {
      name: /connect|wallet/i,
    });
    await expect(connectButton.first()).toBeVisible();
  });

  test("should display blockchain stats", async ({ page }) => {
    // Wait for blockchain stats to load (with mock data or real data)
    // The page should show block number or other chain stats
    await page.waitForTimeout(2000); // Give time for data to load

    // Check for block-related content
    const blockContent = page.locator("text=/block|Block/i").first();
    await expect(blockContent).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to explorer", async ({ page }) => {
    // Find and click on blocks/explorer link
    const explorerLink = page.getByRole("link", { name: /block|explorer/i });

    if ((await explorerLink.count()) > 0) {
      await explorerLink.first().click();
      // URL should change
      await expect(page).toHaveURL(/block|explorer/i);
    }
  });

  test("should navigate to staking", async ({ page }) => {
    const stakingLink = page.getByRole("link", { name: /stak/i });

    if ((await stakingLink.count()) > 0) {
      await stakingLink.first().click();
      await expect(page).toHaveURL(/stak/i);
    }
  });

  test("should navigate to governance", async ({ page }) => {
    const govLink = page.getByRole("link", { name: /govern/i });

    if ((await govLink.count()) > 0) {
      await govLink.first().click();
      await expect(page).toHaveURL(/govern/i);
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Page should still be functional
    await expect(page).toHaveTitle(/Selendra/i);

    // Navigation might be collapsed into a menu
    const mobileMenu = page.locator('[aria-label*="menu"]');
    const hamburger = page.locator(
      'button:has-text("☰"), [class*="hamburger"]'
    );

    // Either navigation is still visible or there's a mobile menu button
    const nav = page.locator("nav");
    const isNavVisible = await nav.isVisible();
    const hasMenuButton =
      (await mobileMenu.count()) > 0 || (await hamburger.count()) > 0;

    expect(isNavVisible || hasMenuButton).toBe(true);
  });
});

test.describe("Health Check", () => {
  test("API health endpoint returns valid response", async ({ request }) => {
    const response = await request.get("/api/health");

    // Should return JSON
    expect(response.headers()["content-type"]).toContain("application/json");

    const data = await response.json();

    // Should have required fields
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("services");
    expect(data.services).toHaveProperty("substrate");
    expect(data.services).toHaveProperty("evm");
  });
});
