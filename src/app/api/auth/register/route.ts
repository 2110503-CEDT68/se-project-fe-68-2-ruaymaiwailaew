import { NextRequest, NextResponse } from "next/server";

const API_AUTH_URL = process.env.NEXT_PUBLIC_API_URL + "/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, telephone, privacyPolicyAccepted } =
      await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Call backend register API
    const response = await fetch(`${API_AUTH_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        telephone,
        privacyPolicyAccepted,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Registration failed" },
        { status: response.status }
      );
    }

    // Return user data and token
    return NextResponse.json(data);
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}