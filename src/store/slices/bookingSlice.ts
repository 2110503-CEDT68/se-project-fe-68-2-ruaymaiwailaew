import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchDentist } from "../../data/dentists";
import { RootState } from "..";

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  dentistId: string;
  dentistName: string;
  date: string;
  createdAt: string;
}

interface BookingState {
  items: Booking[];
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: BookingState = {
  items: [],
  status: "idle",
};

const STORAGE_KEY = "bookings";

const saveToStorage = (bookings: Booking[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));

const normalizeUserId = (user: any) => {
  if (!user) return "";
  if (typeof user === "string") return user;
  if (typeof user === "object") return String(user._id ?? user.id ?? "");
  return "";
};

const normalizeDentistId = (dentist: any) => {
  if (!dentist) return "";
  if (typeof dentist === "string") return dentist;
  if (typeof dentist === "object")
    return String(dentist._id ?? dentist.id ?? "");
  return "";
};

const toISODate = (dateValue: any) => {
  if (!dateValue) return "";
  const normalized =
    typeof dateValue === "string" ? dateValue.trim() : String(dateValue);
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
};

const normalizeBookingPayload = (b: any) => ({
  id: String(b._id ?? b.id ?? ""),
  userId: normalizeUserId(b.user),
  userName: b.user?.name ?? b.userName ?? "",
  userEmail: b.user?.email ?? b.userEmail ?? "",
  dentistId: normalizeDentistId(b.dentist),
  dentistName: b.dentist?.name ?? b.dentistName ?? "",
  date: toISODate(b.bookingDate ?? b.date ?? ""),
  createdAt: b.createdAt ?? "",
  ...b,
});

// ── Thunks ────────────────────────────────────────────────────────────────────

export const loadBookings = createAsyncThunk(
  "bookings/load",
  async (token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return (data.data || []).map((b: any) => normalizeBookingPayload(b));
  },
);

export const createBooking = createAsyncThunk(
  "bookings/create",
  async (
    payload: { dentistId: string; date: string; token: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.token}`,
        },
        body: JSON.stringify({
          bookingDate: payload.date,
          dentist: payload.dentistId,
        }),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return normalizeBookingPayload(data.data);
    } catch (err) {
      return rejectWithValue("Network error");
    }
  },
);

export const updateBooking = createAsyncThunk(
  "bookings/update",
  async (
    payload: {
      bookingId: string;
      dentistId: string;
      date: string;
      token: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${payload.bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${payload.token}`,
          },
          body: JSON.stringify({
            bookingDate: payload.date,
            dentist: payload.dentistId,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return normalizeBookingPayload(data.data);
    } catch (err) {
      return rejectWithValue("Network error");
    }
  },
);

export const deleteBooking = createAsyncThunk(
  "bookings/delete",
  async (
    payload: { bookingId: string; token: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${payload.bookingId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${payload.token}` },
        },
      );
      if (!res.ok) {
        const data = await res.json();
        return rejectWithValue(data.message);
      }
      return payload.bookingId;
    } catch (err) {
      return rejectWithValue("Network error");
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadBookings.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "succeeded";
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateBooking.fulfilled, (state, action) => {
        const idx = state.items.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteBooking.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload);
      });
  },
});

export default bookingSlice.reducer;

// Selectors
export const selectAllBookings = (state: RootState) => state.bookings.items;

export const selectUserBooking = (userId: string) => (state: RootState) =>
  state.bookings.items.find((b) => b.userId === userId) ?? null;
