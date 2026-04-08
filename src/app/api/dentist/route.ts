import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://dental-management-api-seven.vercel.app/api";
const DENTIST_API_URL = process.env.NEXT_PUBLIC_API_DENTISTS_URL || API_BASE_URL + "/dentist";


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = session.accessToken;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const response = await fetch(DENTIST_API_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to fetch dentists" },
        { status: response.status }
      );
    }

    // Normalize backend payload structure to array
    let dentistsPayload: unknown = data;
    if (data && typeof data === "object" && "success" in (data as any)) {
      const d = (data as any).data;
      if (Array.isArray(d)) {
        dentistsPayload = d;
      }
    } else if (
      data &&
      typeof data === "object" &&
      "data" in (data as any) &&
      Array.isArray((data as any).data)
    ) {
      dentistsPayload = (data as any).data;
    }

    if (Array.isArray(dentistsPayload)) {
      return NextResponse.json(dentistsPayload);
    }

    // fallback: keep raw data for debugging, but downstream handles empty safely
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dentist API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to check if user is authenticated and is admin
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get token from session
    const token = session.accessToken;

    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const { name, yearsOfExperience, areaOfExpertise } = await request.json();

    if (!name || !yearsOfExperience || !areaOfExpertise) {
      return NextResponse.json(
        { error: "Name, yearsOfExperience and areaOfExpertise are required" },
        { status: 400 }
      );
    }

    // Call backend dentist API
    const response = await fetch(DENTIST_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, yearsOfExperience, areaOfExpertise }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to create dentist" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dentist POST API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}