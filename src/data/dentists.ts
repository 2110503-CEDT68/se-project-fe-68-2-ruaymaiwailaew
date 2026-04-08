export interface Dentist {
  _id: string;
  name: string;
  yearsOfExperience: number;
  areaOfExpertise: string;
  __v?: number;
}

// Function to fetch dentists from API
export async function fetchDentists(): Promise<Dentist[]> {
  try {
    const response = await fetch('/api/dentist');
    if (!response.ok) {
      // Can include API-level error body for debugging
      const errorBody = await response.json().catch(() => null);
      console.error('Failed to fetch dentists', response.status, errorBody);
      return [];
    }
    const data = await response.json();

    const normalized = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'data' in (data as any) && Array.isArray((data as any).data)
      ? (data as any).data
      : null;

    if (!Array.isArray(normalized)) {
      console.error('Dentist API returned unexpected data type:', data);
      return [];
    }

    return normalized;
  } catch (error) {
    console.error('Error fetching dentists:', error);
    return [];
  }
}

// Function to fetch single dentist from API
export async function fetchDentist(id: string): Promise<Dentist | null> {
  try {
    const response = await fetch(`/api/dentist/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dentist');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dentist:', error);
    return null;
  }
}
