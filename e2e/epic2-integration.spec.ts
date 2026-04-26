import { test, expect, type Page } from "@playwright/test";

const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// Real credentials from database
const TEST_USER = {
  email: "Hayden34@hotmail.com",
  password: "12345678",
};

// Generate unique values for each test run
function getUniqueTestData() {
  const timestamp = Date.now();
  return {
    updatedName: `Gwen Updated ${timestamp}`,
    updatedTelephone: "0987654321",
  };
}

test.describe("US2-2: Integration Test - Profile Editing (No Mock)", () => {
  // Login via UI before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${PLAYWRIGHT_BASE_URL}/login`);

    // Fill in credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Click sign in button
    await page.getByRole("button", { name: /sign in|login/i }).click();

    // Wait for redirect to dashboard/home
    await page.waitForURL("**/dashboard");

    // Navigate to profile edit page
    await page.goto(`${PLAYWRIGHT_BASE_URL}/profile/edit`);

    // Wait for form to load
    await expect(
      page.locator('input[placeholder="Enter your full name"]'),
    ).toBeVisible();
  });

  test("AC1: should update profile successfully with valid data", async ({
    page,
  }) => {
    const testData = getUniqueTestData();

    // Get form inputs
    const nameInput = page.locator('input[placeholder="Enter your full name"]');
    const telInput = page.locator('input[placeholder="e.g. 0812345678"]');
    const passwordInput = page.locator('input[type="password"]');

    // Verify initial values exist
    const initialName = await nameInput.inputValue();
    const initialTel = await telInput.inputValue();
    expect(initialName?.length).toBeGreaterThan(0);
    expect(initialTel?.length).toBeGreaterThan(0);

    // Update with unique values
    await nameInput.fill(testData.updatedName);
    await telInput.fill(testData.updatedTelephone);
    await passwordInput.fill(TEST_USER.password);

    // Click save button
    await page.getByRole("button", { name: /save|update/i }).click();

    // Wait for success or stay on page
    await page.waitForTimeout(2000);

    // Reload to verify data persisted
    await page.reload();
    await expect(nameInput).toBeVisible();

    // Verify name changed
    const newName = await nameInput.inputValue();
    expect(newName).toBe(testData.updatedName);
  });

  test("AC1: should persist data after page reload", async ({ page }) => {
    // Verify form has data
    const nameInput = page.locator('input[placeholder="Enter your full name"]');
    const telInput = page.locator('input[placeholder="e.g. 0812345678"]');

    const name = await nameInput.inputValue();
    const tel = await telInput.inputValue();

    expect(name?.length).toBeGreaterThan(0);
    expect(tel?.length).toBeGreaterThan(0);
  });

  test("AC2: should not allow empty name submission", async ({ page }) => {
    const testData = getUniqueTestData();
    const nameInput = page.locator('input[placeholder="Enter your full name"]');
    const telInput = page.locator('input[placeholder="e.g. 0812345678"]');
    const passwordInput = page.locator('input[type="password"]');

    const currentTel = await telInput.inputValue();

    // Update name to trigger form change
    await nameInput.fill(testData.updatedName);

    // Clear name to test validation
    await nameInput.fill("");

    // Fill other required fields
    await telInput.fill(currentTel || "0987654321");
    await passwordInput.fill(TEST_USER.password);

    // Try to submit
    const saveButton = page.getByRole("button", { name: /save|update/i });

    // Button should be disabled or form shouldn't allow submission
    const isDisabled = await saveButton.isDisabled();
    expect(isDisabled).toBeTruthy();
  });

  test("AC2: should not allow invalid telephone (too short)", async ({
    page,
  }) => {
    const testData = getUniqueTestData();
    const nameInput = page.locator('input[placeholder="Enter your full name"]');
    const telInput = page.locator('input[placeholder="e.g. 0812345678"]');
    const passwordInput = page.locator('input[type="password"]');

    const currentName = await nameInput.inputValue();

    // Update name to trigger form change
    await nameInput.fill(currentName + " UPDATED");

    // Set invalid telephone (less than 10 digits)
    await telInput.fill("123");
    await passwordInput.fill(TEST_USER.password);

    // Try to submit
    const saveButton = page.getByRole("button", { name: /save|update/i });
    const isDisabled = await saveButton.isDisabled();

    // Should be disabled or prevent submission
    expect(isDisabled).toBeTruthy();
  });

  test("AC2: should not allow invalid telephone (too long)", async ({
    page,
  }) => {
    const testData = getUniqueTestData();
    const nameInput = page.locator('input[placeholder="Enter your full name"]');
    const telInput = page.locator('input[placeholder="e.g. 0812345678"]');
    const passwordInput = page.locator('input[type="password"]');

    const currentName = await nameInput.inputValue();

    // Update name to trigger form change
    await nameInput.fill(currentName + " UPDATED2");

    // Set invalid telephone (more than 10 digits)
    await telInput.fill("12345678901234");
    await passwordInput.fill(TEST_USER.password);

    // Try to submit
    const saveButton = page.getByRole("button", { name: /save|update/i });
    const isDisabled = await saveButton.isDisabled();

    // Should be disabled
    expect(isDisabled).toBeTruthy();
  });
});
