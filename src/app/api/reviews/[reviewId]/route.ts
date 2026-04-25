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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
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

    const { reviewId } = await params;
    const payload = await request.json();

    const upstream = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: "PUT",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonSafe(upstream);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to update review" },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Reviews PUT proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
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

    const { reviewId } = await params;

    const upstream = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: "DELETE",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
    });

    const data = await parseJsonSafe(upstream);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to delete review" },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Reviews DELETE proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
