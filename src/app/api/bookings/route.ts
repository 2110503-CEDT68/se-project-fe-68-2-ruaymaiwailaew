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

export async function POST(request: NextRequest) {
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

    const payload = await request.json();

    const upstream = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonSafe(upstream);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to create booking" },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Bookings POST proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
