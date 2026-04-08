import { fetchDentists, fetchDentist } from '@/data/dentists';

// Mock fetch globally
const mockFetch = jest.fn();

describe('fetchDentists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = fetch; // Restore original fetch
  });

  it('returns dentists array on successful fetch', async () => {
    const mockDentists = [
      {
        _id: '1',
        name: 'Dr. John Doe',
        yearsOfExperience: 10,
        areaOfExpertise: 'General Dentistry'
      },
      {
        _id: '2',
        name: 'Dr. Jane Smith',
        yearsOfExperience: 8,
        areaOfExpertise: 'Orthodontics'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDentists,
    } as Response);

    const result = await fetchDentists();

    expect(mockFetch).toHaveBeenCalledWith('/api/dentist');
    expect(result).toEqual(mockDentists);
  });

  it('handles API response with success wrapper', async () => {
    const mockDentists = [
      {
        _id: '1',
        name: 'Dr. John Doe',
        yearsOfExperience: 10,
        areaOfExpertise: 'General Dentistry'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockDentists }),
    } as Response);

    const result = await fetchDentists();

    expect(result).toEqual(mockDentists);
  });

  it('handles API response with data wrapper', async () => {
    const mockDentists = [
      {
        _id: '1',
        name: 'Dr. John Doe',
        yearsOfExperience: 10,
        areaOfExpertise: 'General Dentistry'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockDentists }),
    } as Response);

    const result = await fetchDentists();

    expect(result).toEqual(mockDentists);
  });

  it('returns empty array on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' }),
    } as Response);

    const result = await fetchDentists();

    expect(result).toEqual([]);
  });

  it('returns empty array on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchDentists();

    expect(result).toEqual([]);
  });

  it('returns empty array for unexpected data type', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unexpected: 'data' }),
    } as Response);

    const result = await fetchDentists();

    expect(result).toEqual([]);
  });
});

describe('fetchDentist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = fetch; // Restore original fetch
  });

  it('returns dentist on successful fetch', async () => {
    const mockDentist = {
      _id: '1',
      name: 'Dr. John Doe',
      yearsOfExperience: 10,
      areaOfExpertise: 'General Dentistry'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDentist,
    } as Response);

    const result = await fetchDentist('1');

    expect(mockFetch).toHaveBeenCalledWith('/api/dentist/1');
    expect(result).toEqual(mockDentist);
  });

  it('returns null on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Dentist not found' }),
    } as Response);

    const result = await fetchDentist('1');

    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchDentist('1');

    expect(result).toBeNull();
  });
});