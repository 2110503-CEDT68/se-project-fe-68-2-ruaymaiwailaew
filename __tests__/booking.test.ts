import { configureStore } from '@reduxjs/toolkit';
import bookingReducer, { loadBookings, createBooking, updateBooking, selectAllBookings } from '@/store/slices/bookingSlice';

describe('bookingSlice', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('normalizes booking payload from API and stores user/dentist ids correctly', async () => {
    const fakeBooking = {
      _id: 'b1',
      user: { _id: 'u1', name: 'Alice', email: 'alice@example.com' },
      dentist: { _id: 'd1', name: 'Dr. Smile' },
      bookingDate: '2026-03-26T00:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [fakeBooking] }),
    } as any);

    const store = configureStore({ reducer: { bookings: bookingReducer } });

    await store.dispatch(loadBookings('dummy-token') as any);

    const result = selectAllBookings(store.getState() as any);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'b1',
      userId: 'u1',
      dentistId: 'd1',
      date: '2026-03-26T00:00:00.000Z',
      dentistName: 'Dr. Smile',
    });
  });

  it('createBooking sends bookingDate as raw date string (no malformed T00:00 invalid format)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { _id: 'b2', user: 'u1', dentist: 'd1', bookingDate: '2026-03-26T00:00:00.000Z' } }),
    } as any);

    const store = configureStore({ reducer: { bookings: bookingReducer } });

    await store.dispatch(createBooking({ dentistId: 'd1', date: '2026-03-26', token: 'dummy-token' }) as any);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bookings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer dummy-token',
        }),
        body: JSON.stringify({ bookingDate: '2026-03-26', dentist: 'd1' }),
      }),
    );
  });

  it('updateBooking sends bookingDate as raw date string and updates store', async () => {
    const existingBooking = {
      _id: 'b3',
      user: { _id: 'u1', name: 'Alice', email: 'alice@example.com' },
      dentist: { _id: 'd1', name: 'Dr. Smile' },
      bookingDate: '2026-03-20T00:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [existingBooking] }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...existingBooking, bookingDate: '2026-03-26T00:00:00.000Z', dentist: { _id: 'd2', name: 'Dr. New' } } }),
      } as any);

    const store = configureStore({ reducer: { bookings: bookingReducer } });

    await store.dispatch(loadBookings('dummy-token') as any);
    await store.dispatch(updateBooking({ bookingId: 'b3', dentistId: 'd2', date: '2026-03-26', token: 'dummy-token' }) as any);

    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/bookings/b3',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ bookingDate: '2026-03-26', dentist: 'd2' }),
      }),
    );

    const result = selectAllBookings(store.getState() as any);
    expect(result[0].dentistId).toBe('d2');
    expect(result[0].date).toBe('2026-03-26T00:00:00.000Z');
  });
});