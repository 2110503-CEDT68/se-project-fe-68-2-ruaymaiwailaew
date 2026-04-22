import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const API_AUTH_URL = process.env.NEXT_PUBLIC_API_URL + "/auth";

const ALLOWED_ROLES = ["user", "admin", "dentist"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { name, email, password, telephone, role } = await request.json();

    if (!name || !email || !password || !telephone || !role) {
      return NextResponse.json(
        { error: "Name, email, password, telephone and role are required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be user, admin or dentist" },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_AUTH_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, telephone, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Registration failed" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin create account API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
