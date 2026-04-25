import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Review {
  id: string;
  dentistId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

interface ReviewState {
  items: Review[];
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: ReviewState = {
  items: [],
  status: "idle",
};

const STORAGE_KEY = "reviews";

const saveToStorage = (reviews: Review[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));

// ── Thunks ────────────────────────────────────────────────────────────────────

export const loadReviews = createAsyncThunk(
  "reviews/load",
  async (payload: { dentistId: string; token: string }) => {
    const res = await fetch(
      `/api/dentist/${payload.dentistId}/reviews`,
      { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    const data = await res.json();
    return data.data.map((r: any) => ({
      id: r._id,
      dentistId: r.dentist?._id || r.dentist,
      userId: r.user?._id || r.user,
      userName: r.user?.name || "",
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
  }
);

export const addReview = createAsyncThunk(
  "reviews/add",
  async (
    payload: { dentistId: string; userId: string; userName: string; rating: number; comment: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(
        `/api/dentist/${payload.dentistId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${payload.token}`,
          },
          body: JSON.stringify({ rating: payload.rating, comment: payload.comment }),
        }
      );
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return {
        id: data.data._id,
        dentistId: payload.dentistId,
        userId: payload.userId,
        userName: payload.userName,
        rating: payload.rating,
        comment: payload.comment,
        createdAt: data.data.createdAt,
      };
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

export const updateReview = createAsyncThunk(
  "reviews/update",
  async (
    payload: { reviewId: string; rating: number; comment: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(
        `/api/reviews/${payload.reviewId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${payload.token}`,
          },
          body: JSON.stringify({ rating: payload.rating, comment: payload.comment }),
        }
      );
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return {
        id: data.data._id,
        rating: data.data.rating,
        comment: data.data.comment,
        updatedAt: new Date().toISOString()
      };
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

export const deleteReview = createAsyncThunk(
  "reviews/delete",
  async (payload: { reviewId: string; token: string }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `/api/reviews/${payload.reviewId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${payload.token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        return rejectWithValue(data.message);
      }
      return payload.reviewId;
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const reviewSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Load reviews
      .addCase(loadReviews.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadReviews.fulfilled, (state, action) => {
        // Merge new reviews with existing ones and avoid duplicates by ID.
        const merged = new Map(state.items.map((item) => [item.id, item]));
        action.payload.forEach((review: Review) => {
          merged.set(review.id, review);
        });
        state.items = Array.from(merged.values());
        state.status = "succeeded";
      })
      .addCase(loadReviews.rejected, (state) => {
        state.status = "failed";
        // Keep existing reviews if desired; do not wipe to avoid losing state on partial failure.
      })
      // Add review
      .addCase(addReview.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.status = "succeeded";
      })
      .addCase(addReview.rejected, (state) => {
        state.status = "failed";
      })
      // Update review
      .addCase(updateReview.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { 
          ...state.items[idx],
          ...action.payload
        };
        state.status = "succeeded";
      })
      .addCase(updateReview.rejected, (state) => {
        state.status = "failed";
      })
      // Delete review
      .addCase(deleteReview.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
        state.status = "succeeded";
      })
      .addCase(deleteReview.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default reviewSlice.reducer;

// Selectors
export const selectAllReviews = (state: { reviews: ReviewState }) =>
  state.reviews.items;

export const selectReviewsByDentist =
  (dentistId: string) => (state: { reviews: ReviewState }) =>
    state.reviews.items.filter((r) => r.dentistId === dentistId);

export const selectUserReviewForDentist =
  (userId: string, dentistId: string) => (state: { reviews: ReviewState }) =>
    state.reviews.items.find(
      (r) => r.userId === userId && r.dentistId === dentistId,
    );

export const selectAverageRating =
  (dentistId: string) => (state: { reviews: ReviewState }) => {
    const reviews = state.reviews.items.filter(
      (r) => r.dentistId === dentistId,
    );
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  };

export const selectReviewStatus = (state: { reviews: ReviewState }) =>
  state.reviews.status;
