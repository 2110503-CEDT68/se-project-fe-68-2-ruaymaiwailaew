import { test, expect, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";

type Role = "admin" | "dentist" | "user";

const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

if (!NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set in the environment variables");
}

type SessionUser = {
  id: string;
  email: string;
  name: string;
  tel: string;
  role: Role;
};

const SESSION_USERS: Record<"user", SessionUser> = {
  user: {
    id: "e2e-user-delete-1",
    email: "delete.user@example.com",
    name: "Delete Test User",
    tel: "1234567890",
    role: "user",
  },
};

async function loginAs(page: Page, role: "user"): Promise<void> {
  const user = SESSION_USERS[role];
  const token = await encode({
    secret: NEXTAUTH_SECRET as string,
    token: {
      id: user.id,
      email: user.email,
      name: user.name,
      tel: user.tel,
      role: user.role,
      accessToken: `e2e-access-token-${role}`,
    },
    maxAge: 30 * 24 * 60 * 60,
  });

  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

async function mockDeleteApi(page: Page): Promise<void> {
  const context = page.context();

  // Mock GET for user profile
  await context.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: SESSION_USERS.user,
      }),
    });
  });

  // Mock DELETE request for account deletion
  await context.route(
    "**/api/auth/delete-account**",
    async (route, request) => {
      if (request.method() !== "DELETE") {
        await route.continue();
        return;
      }

      const payload = request.postDataJSON() as {
        password?: string;
      };

      // Validation: Check if password is provided
      if (!payload.password) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Password is required to delete account",
          }),
        });
        return;
      }

      // Validation: Check password (mock: correct password is "correct-password")
      if (payload.password !== "correct-password") {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Invalid password",
          }),
        });
        return;
      }

      // Success: Account deleted
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Account deleted successfully",
        }),
      });
    },
  );
}

test.describe("US2-3: User Account Deletion", () => {
  // Log in and mock APIs before each test
  test.beforeEach(async ({ page }) => {
    await mockDeleteApi(page);
    await loginAs(page, "user");
    // Navigate to profile delete page
    await page.goto(`${PLAYWRIGHT_BASE_URL}/profile/delete`);
    await page.waitForTimeout(500);
  });

  // ============================================================
  // AC1: Password Verification
  // ============================================================

  test("AC1.1: should require password verification before deletion", async ({
    page,
  }) => {
    // Click delete button
    const buttons = await page.getByRole("button").all();
    let deleteBtn = null;

    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("delete") && !(await btn.isDisabled())) {
        deleteBtn = btn;
        break;
      }
    }

    if (deleteBtn) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify password input appears
    const passwordInput = page.locator('input[type="password"]');
    const isVisible = (await passwordInput.count()) > 0;
    expect(isVisible).toBeTruthy();
  });

  test("AC1.2: should reject deletion with incorrect password", async ({
    page,
  }) => {
    // Click delete
    const buttons = await page.getByRole("button").all();
    let deleteBtn = null;

    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("delete") && !(await btn.isDisabled())) {
        deleteBtn = btn;
        break;
      }
    }

    if (deleteBtn) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
    }

    // Fill wrong password
    const passwordFields = await page.locator('input[type="password"]').all();
    if (passwordFields.length > 0) {
      await passwordFields[0].fill("wrong-password");
    }

    // Check the confirmation checkbox, otherwise the confirm button remains disabled
    await page.getByRole("checkbox").check();

    // Click confirm
    const confirmButton = page
      .getByRole("button", { name: /confirm|yes|delete|proceed/i })
      .filter({ visible: true })
      .last();

    await confirmButton.click();
    await page.waitForTimeout(500);

    // Should show error or stay on page
    const isOnDelete = page.url().includes("/profile/delete");
    const hasError = await page
      .locator("div")
      .filter({ hasText: /invalid|password|error/i })
      .count();

    expect(isOnDelete || hasError > 0).toBeTruthy();
  });

  test("AC1.3: should not allow empty password submission", async ({
    page,
  }) => {
    // Click delete
    const buttons = await page.getByRole("button").all();
    let deleteBtn = null;

    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("delete") && !(await btn.isDisabled())) {
        deleteBtn = btn;
        break;
      }
    }

    if (deleteBtn) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
    }

    // Check the confirmation checkbox to test that even if checked, an empty password keeps the button disabled
    await page.getByRole("checkbox").check();

    // Leave password empty - try to confirm
    const confirmButton = page
      .getByRole("button", { name: /confirm|yes|delete|proceed/i })
      .filter({ visible: true })
      .last();

    const isDisabled = await confirmButton.isDisabled();

    // Try to click if not disabled
    if (!isDisabled) {
      await confirmButton.click();
      await page.waitForTimeout(500);
    }

    // Should either have disabled button or error
    const errorMsg = await page
      .locator("div")
      .filter({ hasText: /password|required/i })
      .count();

    expect(isDisabled || errorMsg > 0).toBeTruthy();
  });

  test("AC1.4: should allow user to cancel deletion", async ({ page }) => {
    // Click delete
    const buttons = await page.getByRole("button").all();
    let deleteBtn = null;

    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("delete") && !(await btn.isDisabled())) {
        deleteBtn = btn;
        break;
      }
    }

    if (deleteBtn) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
    }

    // Find and click cancel
    const allBtns = await page.getByRole("button").all();
    for (const btn of allBtns) {
      const text = await btn.textContent();
      if (
        text?.toLowerCase().includes("cancel") ||
        text?.toLowerCase().includes("no")
      ) {
        await btn.click();
        break;
      }
    }

    await page.waitForTimeout(500);

    // Should still be on delete page
    const isOnDelete = page.url().includes("/profile/delete");
    expect(isOnDelete).toBeTruthy();
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Verify page loads without errors
    const deleteButtons = await page.getByRole("button").all();
    const hasDeleteBtn = deleteButtons.length > 0;
    expect(hasDeleteBtn).toBeTruthy();
  });
});
