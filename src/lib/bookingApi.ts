/**
 * bookingApi.ts
 *
 * Centralized API client for booking and dentist endpoints.
 *
 * Important:
 * - Client code calls internal Next.js API routes (`/api/...`).
 * - Server routes then read backend base URL from runtime env.
 *
 * This keeps Docker runtime configuration working without rebuilding images.
 */

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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    // Try to extract a readable message without assuming JSON
    let message = `Request failed with status ${res.status}`;
    if (isJson) {
      try {
        const errData = await res.json();
        message = errData?.message ?? message;
      } catch {
        // ignore parse errors
      }
    }
    throw new Error(message);
  }

  if (!isJson) {
    // Non-JSON success (e.g. 204 No Content or unexpected HTML)
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
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
    ...b,                                              // ✅ spread ก่อน
    id: String(b._id ?? b.id ?? ""),
    userId: normalizeUserId(b.user),
    userName: b.user?.name ?? b.userName ?? "",
    userEmail: b.user?.email ?? b.userEmail ?? "",
    dentistId: normalizeDentistId(b.dentist),
    dentistName: b.dentist?.name ?? b.dentistName ?? "",
    date: toISODate(b.bookingDate ?? b.date ?? ""),    // ✅ override ทีหลัง
    createdAt: b.createdAt ?? "",
  };
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * GET /bookings
 * Fetch all bookings for the authenticated user / dentist.
 */
export async function getBookings(token: string): Promise<BookingPayload[]> {
  const res = await fetch("/api/bookings/availability", {
    headers: authHeaders(token),
  });

  const data = await handleResponse<{ data: any[] }>(res);

  const mapped = (data.data ?? []).map(normalizeBooking);

  return mapped;
}

/**
 * POST /bookings
 * Create a new booking.
 */
export async function createBooking(
  token: string,
  payload: { dentistId: string; date: string }
): Promise<BookingPayload> {
  const res = await fetch("/api/bookings", {
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
  // Backend ต้องการแค่ YYYY-MM-DD
  const dateOnly = payload.date.slice(0, 10);

  const res = await fetch(`/api/bookings/${bookingId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({
      bookingDate: dateOnly,      
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
  const res = await fetch(`/api/bookings/${bookingId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  await handleResponse<unknown>(res);
  return bookingId;
}

/**
 * GET /api/dentist
 * Fetch all dentists via internal API route proxy.
 */
export async function getDentists(token: string): Promise<Dentist[]> {
  const res = await fetch("/api/dentist");
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

// เพิ่มหลัง getDentists และก่อน User Types

/**
 * GET /dentists/:id
 * Fetch a single dentist by ID.
 */
export async function getDentistById(token: string, id: string): Promise<Dentist | null> {
  const res = await fetch(`${BASE_URL}/dentists/${id}`, { headers: authHeaders(token) });
  const data = await handleResponse<any>(res);
  const d = data?.data ?? data;
  return {
    _id: String(d._id ?? d.id ?? ""),
    name: d.name ?? "",
    yearsOfExperience: d.yearsOfExperience ?? 0,
    areaOfExpertise: d.areaOfExpertise ?? "",
  };
}

/**
 * PUT /dentists/:id
 * Update a dentist's professional details.
 */
export async function updateDentist(
  token: string,
  id: string,
  payload: { yearsOfExperience: number; areaOfExpertise: string }
): Promise<void> {
  const res = await fetch(`${BASE_URL}/dentists/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  await handleResponse(res);
}

// ─── User Types ───────────────────────────────────────────────────────────────

export interface UserPayload {
  _id: string;
  name: string;
  email: string;
  telephone?: string;
  role: string;
  isBanned?: boolean;
  banReason?: string;
}

// ─── User API Calls ───────────────────────────────────────────────────────────

/**
 * GET /auth/users
 * Fetch all registered users (admin only).
 */
export async function getUsers(token: string): Promise<UserPayload[]> {
  const res = await fetch(`${BASE_URL}/auth/getusers`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse<any>(res);
  const list: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];
  return list.map((u: any) => ({
    _id: String(u._id ?? u.id ?? ""),
    name: u.name ?? "",
    email: u.email ?? "",
    telephone: u.telephone ?? "",
    role: u.role ?? "user",
    isBanned: u.isBanned ?? false,
    banReason: u.banReason ?? "",
  }));
}

/**
 * POST /auth/ban
 * Ban a user by ID with a reason.
 */
export async function banUser(
  token: string,
  userId: string,
  reason: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/ban`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ userId, reason }),
  });
  await handleResponse<unknown>(res);
}

/**
 * POST /auth/unban
 * Unban a previously banned user.
 */
export async function unbanUser(
  token: string,
  userId: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/unban`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ userId }),
  });
  await handleResponse<unknown>(res);
}


