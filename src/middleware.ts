import { withAuth } from "next-auth/middleware";
import { NextRequest } from "next/server";

export const middleware = withAuth(
  function middleware(req: NextRequest) {
    return;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without session
        if (
          req.nextUrl.pathname.startsWith("/login") ||
          req.nextUrl.pathname.startsWith("/register") ||
          req.nextUrl.pathname === "/"
        ) {
          return true;
        }

        // Require session for protected routes
        if (
          req.nextUrl.pathname.startsWith("/dashboard") ||
          req.nextUrl.pathname.startsWith("/create-booking") ||
          req.nextUrl.pathname.startsWith("/my-booking") ||
          req.nextUrl.pathname.startsWith("/dentist-appointments")
        ) {
          return !!token;
        }

        // Admin-only routes
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return token?.role === "admin";
        }

        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
