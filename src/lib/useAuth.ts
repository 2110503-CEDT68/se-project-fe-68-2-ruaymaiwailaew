"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useCallback, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data: T = text ? JSON.parse(text) : ({} as T);
  if (!res.ok) {
    const message = (data as any)?.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

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

export function useSignOut() {
  const { accessToken } = useAuthUser();

  return useCallback(async () => {
    try {
      if (accessToken) {
        await fetch("/api/auth/logout", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      await nextAuthSignOut({ redirect: false });
    }
  }, [accessToken]);
}

export interface UpdateProfilePayload {
  name?: string;
  telephone?: string;
  password: string;
}

export interface UpdateProfileResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

export function useUpdateProfile() {
  const { accessToken } = useAuthUser();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UpdateProfileResult | null>(null);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload): Promise<UpdateProfileResult> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch(`${BASE_URL}/auth/updateprofile`, {
          method: "PUT",
          headers: authHeaders(accessToken ?? ""),
          body: JSON.stringify(payload),
        });

        console.log("📡 [updateProfile] Status:", res.status, res.statusText);

        const data = await handleResponse<{ message?: string; data?: unknown }>(res);

        console.log("📦 [updateProfile] Raw data:", JSON.stringify(data, null, 2));

        await update({
          user: {
            name: payload.name,
            telephone: payload.telephone,
          },
        });

        const successResult: UpdateProfileResult = {
          success: true,
          message: data?.message ?? "Profile updated successfully",
          data,
        };

        console.log("✅ [updateProfile] Success:", successResult);

        setResult(successResult);
        window.location.reload();
        return successResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unexpected error occurred";
        console.error("❌ [updateProfile] Error:", errorMessage);
        setError(errorMessage);
        const failResult: UpdateProfileResult = { success: false, message: errorMessage };
        setResult(failResult);
        return failResult;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, update]
  );

  return { updateProfile, isLoading, error, result };
}

export function useDeleteAccount() {
  const { accessToken } = useAuthUser();
  const signOut = useSignOut();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = useCallback(
    async (password: string): Promise<boolean> => {
      if (!accessToken) {
        setError("Session expired. Please log in again.");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${BASE_URL}/auth/deleteaccount`, {
          method: "POST",
          headers: authHeaders(accessToken),
          body: JSON.stringify({ password }),
        });

        console.log("📡 [deleteAccount] Status:", res.status, res.statusText);

        await handleResponse(res);

        console.log("✅ [deleteAccount] Success — signing out");

        await signOut();
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unexpected error occurred";
        console.error("❌ [deleteAccount] Error:", errorMessage);
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, signOut]
  );

  return { deleteAccount, isLoading, error };
}