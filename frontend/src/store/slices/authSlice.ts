import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  organizationMemberships?: Array<{
    role: string;
    organizationId: string;
    organization: { id: string; name: string; slug: string };
  }>;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: Cookies.get('accessToken') ?? null,
  isLoading: false,
  error: null,
};

// ── Async thunks ─────────────────────────────────────────────

export const register = createAsyncThunk(
  'auth/register',
  async (
    payload: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      organizationSlug?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post('/auth/register', payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Registration failed');
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Login failed');
    }
  },
);

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/me');
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch user');
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const refreshToken = Cookies.get('refreshToken');
  if (refreshToken) {
    await api.post('/auth/logout', { refreshToken }).catch(() => {});
  }
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
});

// ── Helpers ──────────────────────────────────────────────────

function persistTokens(accessToken: string, refreshToken: string) {
  Cookies.set('accessToken', accessToken, { expires: 1 / 96, secure: true, sameSite: 'strict' });
  Cookies.set('refreshToken', refreshToken, { expires: 7, secure: true, sameSite: 'strict' });
}

// ── Slice ────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        persistTokens(action.payload.accessToken, action.payload.refreshToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        persistTokens(action.payload.accessToken, action.payload.refreshToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchMe
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
      });

    // logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
    });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
