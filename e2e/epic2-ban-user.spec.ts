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

const USER_TC1 = {
  email: "UserForTC1@gmail.com",
  password: "123456",
  name: "UserForTC1",
};

const USER_TC3 = {
  email: "UserForTC1@gmail.com",
  password: "123456",
  name: "UserForTC3",
};

const USER_TC4 = {
  email: "UserForTC4@gmail.com",
  password: "123456",
  name: "UserForTC4",
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
        const userRow = page.getByRole("row", { name: new RegExp(USER_TC1.name, "i") });
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

    test("TC2: The Ban button is disabled for admin accounts", async ({ page }) => {
        await loginAs(page, ADMIN.email, ADMIN.password);
        await goToUsersTab(page);
        // Find admin row and check for Ban button is disabled
        const adminRow = page.getByRole("row", { name: /AdminEnfa/i });
        const banBtn = adminRow.getByRole("button", { name: "Ban" });
        await expect(banBtn).toBeDisabled();
    });

    test("TC3: 'Ban User' button in the dialog is disabled when no reason is entered.", async ({ page }) => {
        await loginAs(page, ADMIN.email, ADMIN.password);
        await goToUsersTab(page);
    
        const userRow = page.getByRole("row", { name: new RegExp(USER_TC3.name, "i") });
        await userRow.getByRole("button", { name: "Ban" }).click();
    
        await expect(page.getByRole("dialog")).toBeVisible();
    
        // Reason not yet entered — Ban User button must be disabled.
        const confirmBtn = page.getByRole("dialog").getByRole("button", { name: "Ban User" });
        await expect(confirmBtn).toBeDisabled();
    });

    test("TC4: Cancel in dialog then close dialog and user not banned", async ({ page }) => {
        await loginAs(page, ADMIN.email, ADMIN.password);
        await goToUsersTab(page);
    
        const userRow = page.getByRole("row", { name: new RegExp(USER_TC4.name, "i") });
        await userRow.getByRole("button", { name: "Ban" }).click();
    
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    
        // Close dialog
        await expect(page.getByRole("dialog")).not.toBeVisible();

        // Ban button not change
        await expect(userRow.getByRole("button", { name: "Ban" })).toBeVisible();
    });
});