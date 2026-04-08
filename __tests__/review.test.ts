import { configureStore } from "@reduxjs/toolkit";
import reviewReducer, {
  loadReviews,
  addReview,
  updateReview,
  deleteReview,
  selectAllReviews,
  selectReviewsByDentist,
  selectUserReviewForDentist,
  selectAverageRating,
  Review,
} from "../src/store/slices/reviewSlice";

// --- Setup Mock Fetch ---
global.fetch = jest.fn();

describe("reviewSlice", () => {
  let store: any;

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();

    store = configureStore({
      reducer: {
        reviews: reviewReducer,
      },
    });
  });

  describe("Reducers & Thunks", () => {
    it("should handle initial state", () => {
      const state = store.getState().reviews;
      expect(state.items).toEqual([]);
      expect(state.status).toEqual("idle");
    });

    it("should handle loadReviews successfully", async () => {
      const mockApiResponse = {
        data: [
          {
            _id: "rev1",
            dentist: { _id: "den1" },
            user: { _id: "usr1", name: "John Doe" },
            rating: 5,
            comment: "Excellent dentist!",
            createdAt: "2023-10-01T12:00:00Z",
          },
        ],
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockApiResponse),
      });

      await store.dispatch(loadReviews({ dentistId: "den1", token: "mock-token" }));

      const state = store.getState().reviews;
      expect(state.status).toBe("succeeded");
      expect(state.items.length).toBe(1);
      expect(state.items[0].id).toBe("rev1");
      expect(state.items[0].userName).toBe("John Doe");
    });

    it("should handle addReview successfully", async () => {
      const mockApiResponse = {
        data: {
          _id: "rev2",
          createdAt: "2023-10-02T12:00:00Z",
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockApiResponse),
      });

      await store.dispatch(
        addReview({
          dentistId: "den1",
          userId: "usr2",
          userName: "Jane Smith",
          rating: 4,
          comment: "Very good",
          token: "mock-token",
        })
      );

      const state = store.getState().reviews;
      expect(state.status).toBe("succeeded");
      expect(state.items.length).toBe(1);
      expect(state.items[0].id).toBe("rev2");
      expect(state.items[0].rating).toBe(4);
    });

    it("should handle updateReview successfully", async () => {
      store = configureStore({
        reducer: { reviews: reviewReducer },
        preloadedState: {
          reviews: {
            items: [{ id: "rev1", dentistId: "den1", userId: "usr1", userName: "John", rating: 3, comment: "Okay", createdAt: "2023-10-01" }],
            status: "succeeded",
          },
        },
      });

      const mockApiResponse = {
        data: {
          _id: "rev1",
          rating: 5,
          comment: "Much better now!",
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockApiResponse),
      });

      await store.dispatch(updateReview({ reviewId: "rev1", rating: 5, comment: "Much better now!", token: "mock-token" }));

      const state = store.getState().reviews;
      expect(state.items[0].rating).toBe(5);
      expect(state.items[0].comment).toBe("Much better now!");
      expect(state.items[0].updatedAt).toBeDefined();
    });

    it("should handle deleteReview successfully", async () => {
      store = configureStore({
        reducer: { reviews: reviewReducer },
        preloadedState: {
          reviews: {
            items: [{ id: "rev1", dentistId: "den1", userId: "usr1", userName: "John", rating: 3, comment: "Okay", createdAt: "2023-10-01" }],
            status: "succeeded",
          },
        },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await store.dispatch(deleteReview({ reviewId: "rev1", token: "mock-token" }));

      const state = store.getState().reviews;
      expect(state.items.length).toBe(0);
    });
  });

  describe("Selectors", () => {
    const mockState = {
      reviews: {
        items: [
          { id: "1", dentistId: "d1", userId: "u1", userName: "A", rating: 5, comment: "G", createdAt: "2023" },
          { id: "2", dentistId: "d1", userId: "u2", userName: "B", rating: 3, comment: "O", createdAt: "2023" },
          { id: "3", dentistId: "d2", userId: "u1", userName: "A", rating: 4, comment: "V", createdAt: "2023" },
        ],
        status: "succeeded" as const,
      },
    };

    it("selectAllReviews should return all items", () => {
      expect(selectAllReviews(mockState).length).toBe(3);
    });

    it("selectReviewsByDentist should filter correctly", () => {
      const d1Reviews = selectReviewsByDentist("d1")(mockState);
      expect(d1Reviews.length).toBe(2);
      expect(d1Reviews[0].dentistId).toBe("d1");
    });

    it("selectUserReviewForDentist should find specific review", () => {
      const review = selectUserReviewForDentist("u1", "d2")(mockState);
      expect(review?.id).toBe("3");
    });

    it("selectAverageRating should calculate correct average", () => {
      const avgD1 = selectAverageRating("d1")(mockState);
      expect(avgD1).toBe(4);

      const avgD3 = selectAverageRating("d3")(mockState);
      expect(avgD3).toBe(0);
    });
  });
});