import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  telephone: string;
  role: 'user' | 'admin';
}

export interface AuthState {
  user: SessionUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'loading',
  error: null,
};

const encodeStorage = (data: any) => btoa(encodeURIComponent(JSON.stringify(data)));
const decodeStorage = (encodedStr: string) => JSON.parse(decodeURIComponent(atob(encodedStr)));

const mockHash = (str: string) => btoa(`salt_${str}_secret`);

// ── Thunks (mirrors NextAuth signIn / signOut) ────────────────────────────────

export const initAuth = createAsyncThunk('auth/init', async () => {
  const stored = localStorage.getItem('currentUser');
  if (stored) return decodeStorage(stored) as SessionUser;
  return null;
});

export const signInCredentials = createAsyncThunk(
  'auth/signIn',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    // Admin short-circuit
    if (email === 'admin@dentist.com' && password === 'admin123') {
      const admin: SessionUser = {
        id: 'admin',
        name: 'Admin',
        email: 'admin@dentist.com',
        telephone: '',
        role: 'admin',
      };
      localStorage.setItem('currentUser', encodeStorage(admin));
      return admin;
    }

    const storedUsers = localStorage.getItem('users');
    const users: any[] = storedUsers ? decodeStorage(storedUsers) : [];
    
    const found = users.find(
      (u) => u.email === email && u.password === mockHash(password)
    );
    if (!found) return rejectWithValue('Invalid email or password');

    const user: SessionUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      telephone: found.telephone,
      role: found.role,
    };
    
    localStorage.setItem('currentUser', encodeStorage(user));
    return user;
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    {
      name,
      telephone,
      email,
      password,
    }: { name: string; telephone: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    const storedUsers = localStorage.getItem('users');
    const users: any[] = storedUsers ? decodeStorage(storedUsers) : [];
    
    if (users.some((u) => u.email === email)) {
      return rejectWithValue('Email already registered');
    }
    
    const newUser = {
      id: Date.now().toString(),
      name,
      telephone,
      email,
      password: mockHash(password), 
      role: 'user' as const,
    };
    
    users.push(newUser);
    localStorage.setItem('users', encodeStorage(users));
    return true;
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signOut(state) {
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
      localStorage.removeItem('currentUser');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // initAuth
      .addCase(initAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'unauthenticated';
      })
      // signIn
      .addCase(signInCredentials.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signInCredentials.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(signInCredentials.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload as string;
      })
      // register — doesn't change auth state
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { signOut, clearError } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthStatus = (state: { auth: AuthState }) => state.auth.status;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsAdmin = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'admin';