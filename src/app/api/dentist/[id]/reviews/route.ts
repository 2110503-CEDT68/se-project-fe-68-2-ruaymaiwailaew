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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const upstream = await fetch(`${API_BASE_URL}/dentist/${id}/reviews`, {
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
        { error: data?.message || "Failed to fetch reviews" },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Dentist reviews GET proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const payload = await request.json();

    const upstream = await fetch(`${API_BASE_URL}/dentist/${id}/reviews`, {
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
        { error: data?.message || "Failed to create review" },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Dentist reviews POST proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
