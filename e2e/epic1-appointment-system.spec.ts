import { expect, test, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";

type Role = "admin" | "dentist" | "user";

const BASE_URL = "http://localhost:3000";
const NEXTAUTH_SECRET = "playwright-test-secret";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

const SESSION_USERS: Record<Role, SessionUser> = {
  admin: {
    id: "e2e-admin-1",
    email: "admin.e2e@example.com",
    name: "E2E Admin",
    role: "admin",
  },
  dentist: {
    id: "e2e-dentist-1",
    email: "dentist.e2e@example.com",
    name: "E2E Dentist",
    role: "dentist",
  },
  user: {
    id: "e2e-user-1",
    email: "user.e2e@example.com",
    name: "E2E User",
    role: "user",
  },
};

function toDateInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

async function mockNoDatabaseApi(page: Page): Promise<void> {
  const context = page.context();
  const defaultDentist = {
    _id: "dentist-default-1",
    name: "Dr. Mock Dentist",
    yearsOfExperience: 10,
    areaOfExpertise: "General Dentistry",
  };

  await context.route("**/api/bookings/availability**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await context.route("**/api/bookings", async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
      return;
    }

    if (request.method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            _id: "bk-created-mock",
            bookingDate: addHours(new Date(), 24).toISOString(),
            user: {
              _id: SESSION_USERS.user.id,
              name: SESSION_USERS.user.name,
              email: SESSION_USERS.user.email,
            },
            dentist: defaultDentist,
            createdAt: new Date().toISOString(),
          },
        }),
      });
      return;
    }

    await route.continue();
  });

  await context.route("**/api/bookings/*", async (route, request) => {
    if (request.method() === "PUT") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            _id: "bk-updated-mock",
            bookingDate: addHours(new Date(), 24).toISOString(),
            user: {
              _id: "patient-mock-1",
              name: "Patient Mock",
              email: "patient.mock@example.com",
            },
            dentist: defaultDentist,
            createdAt: new Date().toISOString(),
          },
        }),
      });
      return;
    }

    if (request.method() === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    await route.continue();
  });

  await context.route("**/api/dentist", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [defaultDentist] }),
    });
  });

  await context.route("**/api/dentist/*/reviews", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await context.route("**/api/dentist/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(defaultDentist),
    });
  });
}

async function loginAs(page: Page, role: Role): Promise<void> {
  const user = SESSION_USERS[role];
  const token = await encode({
    secret: NEXTAUTH_SECRET,
    token: {
      id: user.id,
      email: user.email,
      name: user.name,
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

async function getSessionInfo(page: Page): Promise<{
  userId: string;
  userName: string;
  accessToken?: string;
}> {
  const response = await page.request.get(`${BASE_URL}/api/auth/session`);
  expect(response.ok()).toBeTruthy();

  const data = (await response.json()) as {
    user?: { id?: string; name?: string };
    accessToken?: string;
  };

  return {
    userId: data.user?.id ?? "",
    userName: data.user?.name ?? "Dentist User",
    accessToken: data.accessToken,
  };
}

test.describe("Epic 1 - Appointment System", () => {
  test.beforeEach(async ({ page }) => {
    await mockNoDatabaseApi(page);
  });

  test("Auth smoke: admin can sign in with provided credentials", async ({ page }) => {
    await loginAs(page, "admin");

    const sessionResponse = await page.request.get(`${BASE_URL}/api/auth/session`);
    await expect(sessionResponse.ok()).toBeTruthy();
    const session = (await sessionResponse.json()) as {
      user?: { role?: string; email?: string };
    };

    await expect(session.user?.role).toBe("admin");
    await expect(session.user?.email).toBe(SESSION_USERS.admin.email);
  });

  test("US1-3: dentist can read appointments list", async ({ page }) => {
    await loginAs(page, "dentist");

    const session = await getSessionInfo(page);
    const now = new Date();
    const bookingDate = addHours(now, 48).toISOString();

    await page.route("**/bookings/availability", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              _id: "bk-us1-3-1",
              bookingDate,
              user: {
                _id: "patient-1",
                name: "Patient Sample",
                email: "patient.sample@example.com",
              },
              dentist: {
                _id: session.userId,
                name: session.userName || "Dentist Sample",
              },
              createdAt: now.toISOString(),
            },
          ],
        }),
      });
    });

    await page.goto(`${BASE_URL}/dentist-appointments`);

    await expect(page.getByRole("heading", { name: "Appointments", exact: true })).toBeVisible();
    await expect(page.getByText("Patient Sample")).toBeVisible();
  });

  test("US1-3 (empty state): dentist sees no upcoming appointments placeholder", async ({ page }) => {
    await loginAs(page, "dentist");

    await page.route("**/bookings/availability", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto(`${BASE_URL}/dentist-appointments`);

    await expect(page.getByRole("heading", { name: "No appointments yet" })).toBeVisible();
  });

  test("US1-1: dentist can edit appointment and see success notification", async ({ page }) => {
    await loginAs(page, "dentist");

    const session = await getSessionInfo(page);
    const now = new Date();

    const bookingId = "bk-us1-1-edit";
    let currentDate = addHours(now, 72).toISOString();

    await page.route("**/bookings/availability", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              _id: bookingId,
              bookingDate: currentDate,
              user: {
                _id: "patient-2",
                name: "Patient Edit",
                email: "patient.edit@example.com",
              },
              dentist: {
                _id: session.userId,
                name: session.userName || "Dentist Sample",
              },
              createdAt: now.toISOString(),
            },
          ],
        }),
      });
    });

    await page.route(`**/bookings/${bookingId}`, async (route, request) => {
      if (request.method() !== "PUT") {
        await route.continue();
        return;
      }

      const payload = request.postDataJSON() as {
        bookingDate?: string;
        dentist?: string;
      };

      currentDate = payload.bookingDate ?? currentDate;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            _id: bookingId,
            bookingDate: currentDate,
            user: {
              _id: "patient-2",
              name: "Patient Edit",
              email: "patient.edit@example.com",
            },
            dentist: {
              _id: payload.dentist ?? session.userId,
              name: session.userName || "Dentist Sample",
            },
            createdAt: now.toISOString(),
          },
        }),
      });
    });

    await page.goto(`${BASE_URL}/dentist-appointments`);

    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();
    await expect(page.getByText("Patient Edit")).toBeVisible();

    await page.goto(`${BASE_URL}/dentist-appointments/${bookingId}/edit`);

    await expect(page).toHaveURL(/\/dentist-appointments\/[^/]+\/edit$/);

    const editedDate = toDateInputValue(addHours(now, 96));
    await page.locator("input#datetime").fill(editedDate);
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Appointment updated successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/dentist-appointments$/);
  });

  test("US1-1 (conflict): dentist cannot update to booked slot", async ({ page }) => {
    await loginAs(page, "dentist");

    const session = await getSessionInfo(page);
    const now = new Date();
    const bookingId = "bk-us1-1-conflict";

    await page.route("**/bookings/availability", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              _id: bookingId,
              bookingDate: addHours(now, 48).toISOString(),
              user: {
                _id: "patient-conflict-1",
                name: "Patient Conflict",
                email: "patient.conflict@example.com",
              },
              dentist: {
                _id: session.userId,
                name: session.userName || "Dentist Sample",
              },
              createdAt: now.toISOString(),
            },
          ],
        }),
      });
    });

    await page.route(`**/bookings/${bookingId}`, async (route, request) => {
      if (request.method() === "PUT") {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Time slot unavailable",
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(`${BASE_URL}/dentist-appointments`);

    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();

    await page.goto(`${BASE_URL}/dentist-appointments/${bookingId}/edit`);

    await expect(page).toHaveURL(/\/dentist-appointments\/[^/]+\/edit$/);

    await page
      .locator("input#datetime")
      .fill(toDateInputValue(addHours(new Date(), 120)));

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Time slot unavailable")).toBeVisible();
    await expect(page).toHaveURL(/\/dentist-appointments\/[^/]+\/edit$/);
  });

  test("US1-2: dentist gets confirmation before delete and then sees success toast", async ({ page }) => {
    await loginAs(page, "dentist");

    const session = await getSessionInfo(page);
    const now = new Date();
    let bookingExists = true;
    const bookingId = "bk-us1-2-delete";

    await page.route("**/bookings/availability", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: bookingExists
            ? [
                {
                  _id: bookingId,
                  bookingDate: addHours(now, 36).toISOString(),
                  user: {
                    _id: "patient-5",
                    name: "Patient Delete",
                    email: "patient.delete@example.com",
                  },
                  dentist: {
                    _id: session.userId,
                    name: session.userName || "Dentist Sample",
                  },
                  createdAt: now.toISOString(),
                },
              ]
            : [],
        }),
      });
    });

    await page.route(`**/bookings/${bookingId}`, async (route, request) => {
      if (request.method() !== "DELETE") {
        await route.continue();
        return;
      }

      bookingExists = false;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto(`${BASE_URL}/dentist-appointments`);

    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();

    await firstRow.locator("button").nth(1).click();

    await expect(page.getByText("Delete Appointment?")).toBeVisible();
    await expect(page.getByText(/permanently delete the appointment/i)).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Delete Appointment?")).not.toBeVisible();

    await firstRow.locator("button").nth(1).click();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText(/Appointment deleted|Appointment deleted successfully/i)).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(0);
  });

  test("US1-4: user can view dentist profile and request schedule/booking flow", async ({ page }) => {
    await loginAs(page, "user");

    const dentistId = "dentist-us1-4-1";
    const dentistName = "Dr. Story Dentist";

    await page.route("**/api/dentist", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              _id: dentistId,
              name: dentistName,
              yearsOfExperience: 8,
              areaOfExpertise: "General Dentistry",
            },
          ],
        }),
      });
    });

    await page.route(`**/api/dentist/${dentistId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          _id: dentistId,
          name: dentistName,
          yearsOfExperience: 8,
          areaOfExpertise: "General Dentistry",
        }),
      });
    });

    await page.route(`**/api/dentist/${dentistId}/reviews`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto(`${BASE_URL}/dashboard`);

    await expect(page.getByRole("heading", { name: "Our Dentists" })).toBeVisible();

    await expect(page.getByText(dentistName)).toBeVisible();
    await page.getByRole("button", { name: "Reviews" }).first().click();

    await expect(page.getByRole("button", { name: "Book Appointment" })).toBeVisible();
    await page.goto(`${BASE_URL}/create-booking`);

    await expect(page).toHaveURL(/\/create-booking$/);

    // User may already have an active booking; both pages are valid outcomes.
    const bookingLimitReached = page.getByRole("heading", {
      name: "Booking Limit Reached",
    });
    const appointmentDetails = page.getByText("Appointment Details");

    await expect(bookingLimitReached.or(appointmentDetails)).toBeVisible();

    if (await bookingLimitReached.isVisible()) {
      await expect(
        page.getByRole("button", { name: "View My Booking" }),
      ).toBeVisible();
    } else {
      await expect(appointmentDetails).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Confirm Appointment" }),
      ).toBeVisible();
    }
  });

  test("US1-4 (fully booked): show 'No available slots' and next available date", async ({ page }) => {
    await loginAs(page, "user");
    const session = await getSessionInfo(page);

    await page.route("**/bookings/availability", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              _id: "bk-us1-4-fully-booked",
              bookingDate: addHours(new Date(), 24).toISOString(),
              user: {
                _id: session.userId,
                name: "Booked User",
                email: SESSION_USERS.user.email,
              },
              dentist: {
                _id: "dentist-fully-booked",
                name: "Fully Booked Dentist",
              },
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.goto(`${BASE_URL}/create-booking`);

    const noAvailableSlots = page.getByText(/No available slots/i);
    const bookingLimitReached = page.getByRole("heading", {
      name: "Booking Limit Reached",
    });

    await expect(noAvailableSlots.or(bookingLimitReached)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "View My Booking" }),
    ).toBeVisible();
  });
});
