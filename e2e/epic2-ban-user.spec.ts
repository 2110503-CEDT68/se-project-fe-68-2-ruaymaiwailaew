import { test, expect } from "@playwright/test";

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const ADMIN = {
  email: "adminsdf@gmail.com",
  password: "12345678",
};

const BANNED_USER = {
  email: "testloginban@gmail.com",
  password: "12345678",
  name: "testloginban",
};

// ─── Helper: Login ────────────────────────────────────────────────────────────
async function loginAs(
  page: any,
  email: string,
  password: string
) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("you@example.com").click();
  await page.getByPlaceholder("you@example.com").type(email, { delay: 50 });
  await page.getByPlaceholder("••••••••").click();
  await page.getByPlaceholder("••••••••").type(password, { delay: 50 });
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 60000 });
}

// ─── Helper: Navigate to Users tab at Admin Dashboard ──────────────────────────────
async function goToUsersTab(page: any) {
  await page.goto(`${BASE_URL}/admin`);
  await page.getByRole("tab", { name: /users/i }).click();
  // Loading table
  await page.waitForSelector("table");
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Admin ban user จาก Dashboard
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AC1 - Admin bans a user from the dashboard", () => {

    test("TC1: Admin ban user success and show success notification", async ({ page }) => {
        await loginAs(page, ADMIN.email, ADMIN.password);
        await goToUsersTab(page);

        // Find the row  user want to ban then click Ban button
        const userRow = page.getByRole("row", { name: new RegExp(BANNED_USER.name, "i") });
        await userRow.getByRole("button", { name: "Ban" }).click();

        // A dialog box opens — enter a reason.
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.getByRole("dialog").locator("textarea").first().fill("Violates community policy");
    
        // Click ban user in dialog box
        await page.getByRole("dialog").getByRole("button", { name: "Ban User" }).click();

        // Check toast notification
        await expect(page.locator("[data-sonner-toast]").filter({ hasText: /has been banned/i })).toBeVisible();

        // Button change to Unban and DB status updated
        await expect(userRow.getByRole("button", { name: "Unban" })).toBeVisible();
    });
});