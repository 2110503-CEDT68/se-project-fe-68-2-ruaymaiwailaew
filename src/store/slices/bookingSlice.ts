import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "..";
import {
  getBookings,
  createBooking as apiCreateBooking,
  updateBooking as apiUpdateBooking,
  deleteBooking as apiDeleteBooking,
  type BookingPayload,
} from "../../lib/bookingApi";

// Re-export the canonical type from the lib so consumers can import from one place
export type Booking = BookingPayload;

interface BookingState {
  items: Booking[];
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: BookingState = {
  items: [],
  status: "idle",
};

// Normalisation helpers have been moved to src/lib/bookingApi.ts

// ── Thunks ────────────────────────────────────────────────────────────────────

// ── Thunks (delegate to src/lib/bookingApi.ts) ────────────────────────────────

export const loadBookings = createAsyncThunk(
  "bookings/load",
  async (token: string) => getBookings(token),
);

export const createBooking = createAsyncThunk(
  "bookings/create",
  async (
    payload: { dentistId: string; date: string; token: string },
    { rejectWithValue },
  ) => {
    try {
      return await apiCreateBooking(payload.token, {
        dentistId: payload.dentistId,
        date: payload.date,
      });
    } catch (err: any) {
      return rejectWithValue(err.message ?? "Network error");
    }
  },
);

export const updateBooking = createAsyncThunk(
  "bookings/update",
  async (
    payload: { bookingId: string; dentistId: string; date: string; token: string },
    { rejectWithValue },
  ) => {
    try {
      return await apiUpdateBooking(payload.token, payload.bookingId, {
        dentistId: payload.dentistId,
        date: payload.date,
      });
    } catch (err: any) {
      return rejectWithValue(err.message ?? "Network error");
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
      return await apiDeleteBooking(payload.token, payload.bookingId);
    } catch (err: any) {
      return rejectWithValue(err.message ?? "Network error");
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
