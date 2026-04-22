export interface Dentist {
  _id: string;
  name: string;
  yearsOfExperience: number;
  areaOfExpertise: string;
  __v?: number;
}

function normalizeDentist(raw: any): Dentist {
  const name =
    typeof raw?.name === "string" && raw.name.trim().length > 0
      ? raw.name.trim()
      : "Unknown Dentist";
  const years =
    typeof raw?.yearsOfExperience === "number" && raw.yearsOfExperience >= 0
      ? raw.yearsOfExperience
      : Number(raw?.yearsOfExperience) >= 0
      ? Number(raw.yearsOfExperience)
      : 0;
  const expertise =
    typeof raw?.areaOfExpertise === "string" &&
    raw.areaOfExpertise.trim().length > 0
      ? raw.areaOfExpertise.trim()
      : "General Dentistry";

  return {
    _id: String(raw?._id ?? ""),
    name,
    yearsOfExperience: years,
    areaOfExpertise: expertise,
    __v: typeof raw?.__v === "number" ? raw.__v : undefined,
  };
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

    return normalized
      .map((item) => normalizeDentist(item))
      .filter((d) => d._id.length > 0);
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
    return data ? normalizeDentist(data) : null;
  } catch (error) {
    console.error('Error fetching dentist:', error);
    return null;
  }
}
