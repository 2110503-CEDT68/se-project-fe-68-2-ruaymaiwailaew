/**
 * Authentication and Navigation hooks for the Dentist Booking app
 *
 * Session API (mirrors NextAuth v5):
 *   const { data: session, status } = useSession();
 *   const signIn = useSignIn();   → await signIn({ email, password })
 *   const signOut = useSignOut(); → signOut()
 *   const { user, isAuthenticated, isAdmin, status, error } = useAuthUser();
 */

import { useRouter as useNextRouter } from "next/navigation";
import { useParams as useNextParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "./index";
import {
  signInCredentials,
  signOut as signOutAction,
  selectUser,
  selectAuthStatus,
  selectAuthError,
  selectIsAdmin,
} from "./slices/authSlice";

// ──────────────────────────────────────────────────────────────────────────────
// ROUTING HOOKS — Next.js router wrappers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get a Next.js router instance for navigation
 * Usage: const router = useRouter(); router.push('/path')
 */
export function useRouter() {
  return useNextRouter();
}

/**
 * Navigate to a path (React Router-like API)
 * Usage: const navigate = useNavigate(); navigate('/path')
 */
export function useNavigate() {
  const router = useNextRouter();
  return (path: string, options?: any) => {
    router.push(path);
  };
}

/**
 * Get route params (React Router-like API)
 * Usage: const { id } = useParams<{ id: string }>();
 */
export function useParams<
  T extends Record<string, any> = Record<string, string>,
>(): T {
  const params = useNextParams();
  return params as T;
}

// ──────────────────────────────────────────────────────────────────────────────
// SESSION HOOKS — NextAuth-style authentication
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get current session data and auth status
 * Returns: { data: { user } | null, status: 'authenticated' | 'unauthenticated' | 'loading' }
 */
export function useSession() {
  const user = useAppSelector(selectUser);
  const status = useAppSelector(selectAuthStatus);

  return {
    data: user ? { user } : null,
    status,
  };
}

/**
 * Get signIn function for email/password authentication
 * Usage: const signIn = useSignIn(); await signIn({ email, password })
 */
export function useSignIn() {
  const dispatch = useAppDispatch();
  return async (credentials: { email: string; password: string }) => {
    const result = await dispatch(signInCredentials(credentials));
    if (signInCredentials.rejected.match(result)) {
      throw new Error(result.payload as string);
    }
    return result.payload;
  };
}

/**
 * Get signOut function to logout
 * Usage: const signOut = useSignOut(); signOut()
 */
export function useSignOut() {
  const dispatch = useAppDispatch();
  return () => dispatch(signOutAction());
}

/**
 * Convenience hook — returns current user, auth status, and helper booleans
 * Returns: { user, isAuthenticated, isAdmin, status, error }
 */
export function useAuthUser() {
  const user = useAppSelector(selectUser);
  const status = useAppSelector(selectAuthStatus);
  const isAdmin = useAppSelector(selectIsAdmin);
  const error = useAppSelector(selectAuthError);

  return {
    user,
    isAuthenticated: status === "authenticated",
    isAdmin,
    status,
    error,
  };
}
