"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useCallback } from "react";

/**
 * Custom hook to get auth user info from NextAuth session
 * Returns: { user, isAuthenticated, isAdmin, status, error, accessToken }
 */
export function useAuthUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    isAuthenticated: status === "authenticated",
    isAdmin: session?.user?.role === "admin",
    status: status as "authenticated" | "unauthenticated" | "loading",
    accessToken: session?.accessToken,
    error: null,
  };
}

/**
 * Custom hook to sign out user
 * Returns: signOut function that calls backend logout API
 */
export function useSignOut() {
  const { accessToken } = useAuthUser();

  return useCallback(async () => {
    try {
      // Call backend logout API if we have a token
      if (accessToken) {
        await fetch("/api/auth/logout", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Always sign out from NextAuth regardless of API call result
      await nextAuthSignOut({ redirect: false });
    }
  }, [accessToken]);
}
