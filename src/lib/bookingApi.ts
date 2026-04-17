/**
 * bookingApi.ts
 *
 * Centralised API client for the /bookings and /dentist endpoints.
 * All calls read base URLs from environment variables defined in .env:
 *   NEXT_PUBLIC_API_URL          – base for bookings
 *   NEXT_PUBLIC_API_DENTISTS_URL – dentist list endpoint
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DENTISTS_URL =
  process.env.NEXT_PUBLIC_API_DENTISTS_URL ?? `${BASE_URL}/dentist`;

if (!BASE_URL) {
  console.warn(
    "[bookingApi] NEXT_PUBLIC_API_URL is not set. " +
      "Make sure it is defined in your .env file."
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Dentist {
  _id: string;
  name: string;
  yearsOfExperience: number;
  areaOfExpertise: string;
}


export interface BookingPayload {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  dentistId: string;
  dentistName: string;
  date: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const message =
      data?.message ?? `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function normalizeUserId(user: any): string {
  if (!user) return "";
  if (typeof user === "string") return user;
  if (typeof user === "object") return String(user._id ?? user.id ?? "");
  return "";
}

function normalizeDentistId(dentist: any): string {
  if (!dentist) return "";
  if (typeof dentist === "string") return dentist;
  if (typeof dentist === "object")
    return String(dentist._id ?? dentist.id ?? "");
  return "";
}

function toISODate(dateValue: any): string {
  if (!dateValue) return "";
  const normalized =
    typeof dateValue === "string" ? dateValue.trim() : String(dateValue);
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function normalizeBooking(b: any): BookingPayload {
  return {
    id: String(b._id ?? b.id ?? ""),
    userId: normalizeUserId(b.user),
    userName: b.user?.name ?? b.userName ?? "",
    userEmail: b.user?.email ?? b.userEmail ?? "",
    dentistId: normalizeDentistId(b.dentist),
    dentistName: b.dentist?.name ?? b.dentistName ?? "",
    date: toISODate(b.bookingDate ?? b.date ?? ""),
    createdAt: b.createdAt ?? "",
    ...b,
  };
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * GET /bookings
 * Fetch all bookings for the authenticated user / dentist.
 */
export async function getBookings(token: string): Promise<BookingPayload[]> {
  const res = await fetch(`${BASE_URL}/bookings`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse<{ data: any[] }>(res);
  return (data.data ?? []).map(normalizeBooking);
}

/**
 * POST /bookings
 * Create a new booking.
 */
export async function createBooking(
  token: string,
  payload: { dentistId: string; date: string }
): Promise<BookingPayload> {
  const res = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      bookingDate: payload.date,
      dentist: payload.dentistId,
    }),
  });
  const data = await handleResponse<{ data: any }>(res);
  return normalizeBooking(data.data);
}

/**
 * PUT /bookings/:id
 * Update an existing booking.
 */
export async function updateBooking(
  token: string,
  bookingId: string,
  payload: { dentistId: string; date: string }
): Promise<BookingPayload> {
  const res = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({
      bookingDate: payload.date,
      dentist: payload.dentistId,
    }),
  });
  const data = await handleResponse<{ data: any }>(res);
  return normalizeBooking(data.data);
}

/**
 * DELETE /bookings/:id
 * Delete a booking by ID. Returns the deleted booking's ID.
 */
export async function deleteBooking(
  token: string,
  bookingId: string
): Promise<string> {
  const res = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  await handleResponse<unknown>(res);
  return bookingId;
}

/**
 * GET /dentist  (NEXT_PUBLIC_API_DENTISTS_URL)
 * Fetch all dentists from the backend.
 * Uses the dentist-specific URL from .env so it can differ from the booking base.
 */
export async function getDentists(token: string): Promise<Dentist[]> {
  const res = await fetch(DENTISTS_URL as string, {
    headers: authHeaders(token),
  });
  const data = await handleResponse<any>(res);
  // Backend may return { success, data: [...] } or a plain array
  const list: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];
  return list.map((d: any) => ({
    _id: String(d._id ?? d.id ?? ""),
    name: d.name ?? "",
    yearsOfExperience: d.yearsOfExperience ?? 0,
    areaOfExpertise: d.areaOfExpertise ?? "",
  }));
}
