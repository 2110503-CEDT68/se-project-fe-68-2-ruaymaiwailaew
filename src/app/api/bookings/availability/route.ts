import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get("authorization");
}

async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return { message: "Invalid JSON response from upstream" };
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!API_BASE_URL) {
      return NextResponse.json(
        { error: "Backend API URL is not configured" },
        { status: 500 }
      );
    }

    const auth = getAuthHeader(request);
    if (!auth) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const upstream = await fetch(`${API_BASE_URL}/bookings/availability`, {
      method: "GET",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await parseJsonSafe(upstream);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to fetch bookings" },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Bookings availability proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
