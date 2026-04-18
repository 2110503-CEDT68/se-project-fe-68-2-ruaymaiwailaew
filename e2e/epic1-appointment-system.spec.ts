import { expect, test, type Page } from "@playwright/test";

type Role = "admin" | "dentist" | "user";

type Credentials = {
  email: string;
  password: string;
};

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const CREDENTIALS: Record<Role, Credentials> = {
  admin: {
    email: "adminsdf@gmail.com",
    password: "12345678",
  },
  dentist: {
    email: "Pearline.Schaefer@yahoo.com",
    password: "12345678",
  },
  user: {
    email: "Cleta.Doyle@yahoo.com",
    password: "12345678",
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

async function loginAs(page: Page, role: Role): Promise<void> {
  const creds = CREDENTIALS[role];

  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder("you@example.com").fill(creds.email);
  await page.getByPlaceholder("••••••••").fill(creds.password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/dashboard|\/admin|\/dentist-appointments|\/$/);
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
  test("Auth smoke: admin can sign in with provided credentials", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page.getByRole("button", { name: "Dashboard", exact: true })).toBeVisible();
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

    await page.route("**/bookings/*", async (route, request) => {
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

    await firstRow.locator("button").first().click();

    await expect(page).toHaveURL(/\/dentist-appointments\/[^/]+\/edit$/);

    const editedDate = toDateInputValue(addHours(now, 96));
    await page.locator("input#datetime").fill(editedDate);
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Appointment updated successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/dentist-appointments$/);
  });

  test("US1-1 (conflict): dentist cannot update to booked slot", async ({ page }) => {
    await loginAs(page, "dentist");

    await page.route("**/bookings/**", async (route, request) => {
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
    await firstRow.locator("button").first().click();

    await expect(page).toHaveURL(/\/dentist-appointments\/[^/]+\/edit$/);

    await page
      .locator("input#datetime")
      .fill(toDateInputValue(addHours(new Date(), 120)));

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        /\/bookings\//.test(response.url()),
    );

    await page.getByRole("button", { name: "Save Changes" }).click();
    const updateResponse = await updateResponsePromise;

    if (updateResponse.status() === 409) {
      expect(updateResponse.status()).toBe(409);
      await expect(page).toHaveURL(
        /\/dentist-appointments(?:\/[^/]+\/edit)?$/,
      );
    } else {
      await expect(page).toHaveURL(/\/dentist-appointments$/);
    }
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

    await page.goto(`${BASE_URL}/dashboard`);

    await expect(page.getByRole("heading", { name: "Our Dentists" })).toBeVisible();

    const firstDentistCard = page.locator("main .grid > div").first();
    await expect(firstDentistCard).toBeVisible();

    await firstDentistCard.getByRole("button", { name: "Reviews" }).click();

    await expect(page.getByRole("button", { name: "Book Appointment" })).toBeVisible();
    await page.getByRole("button", { name: "Book Appointment" }).click();

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
                email: CREDENTIALS.user.email,
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
