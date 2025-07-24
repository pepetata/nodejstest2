import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../services/authService';

// Utility functions for storage with better remember me handling
const storage = {
  set: (key, value, rememberMe = null) => {
    // If rememberMe is explicitly set, use that preference
    // Otherwise, check if we have a stored preference
    const shouldUseLocal =
      rememberMe !== null ? rememberMe : localStorage.getItem('rememberMe') === 'true';

    if (shouldUseLocal) {
      localStorage.setItem(key, value);
      // Clear from sessionStorage if we're storing in localStorage
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      // Clear from localStorage if we're storing in sessionStorage (unless it's rememberMe flag itself)
      if (key !== 'rememberMe') {
        localStorage.removeItem(key);
      }
    }
  },
  get: (key) => {
    // First check localStorage, then sessionStorage
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  },
  remove: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
  clear: () => {
    // Clear all auth-related data
    const authKeys = ['token', 'user', 'rememberMe', 'persist:auth', 'persist:root'];
    authKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  },
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const data = await authService.login(email, password);

      // Store remember me preference first
      storage.set('rememberMe', rememberMe ? 'true' : 'false', true); // Always store in localStorage

      // Then store token with the remember me preference
      storage.set('token', data.token, rememberMe);

      return { ...data, rememberMe };
    } catch (err) {
      console.log('AuthSlice error:', err.response?.data); // Debug
      // Handle pending confirmation error specifically
      if (err.response?.data?.code === 'PENDING_CONFIRMATION') {
        console.log('AuthSlice found PENDING_CONFIRMATION'); // Debug
        return rejectWithValue({
          error: err.response.data.error,
          code: err.response.data.code,
          email: err.response.data.email,
        });
      }

      // Show backend error message in Portuguese if present
      let errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      if (err.response?.status === 429) {
        errorMsg = err.response?.data?.erro?.mensagem || errorMsg;
      }
      return rejectWithValue({ error: errorMsg });
    }
  }
);

export const rehydrate = createAsyncThunk('auth/rehydrate', async (_, { rejectWithValue }) => {
  try {
    const token = storage.get('token');
    const rememberMe = storage.get('rememberMe') === 'true';

    if (!token) {
      // No token found, return empty state
      return { user: null, token: null, restaurant: null, rememberMe: false };
    }

    // Set token in axios headers (api.js already does this)
    const data = await authService.getCurrentUser();

    // If we successfully got user data, return the full auth state
    return {
      user: data.user,
      token,
      restaurant: data.restaurant || null,
      rememberMe,
    };
  } catch (err) {
    // If token validation fails, clear stored data
    console.warn('Token validation failed during rehydration:', err.message);
    storage.clear();
    return rejectWithValue({ user: null, token: null, restaurant: null, rememberMe: false });
  }
});

const initialState = {
  user: null,
  token: null,
  restaurant: null,
  status: 'idle',
  error: null,
  rememberMe: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      // Store restaurant URL before clearing state for redirect
      const restaurantUrl = state.restaurant?.url;

      state.user = null;
      state.token = null;
      state.restaurant = null;
      state.status = 'idle';
      state.error = null;
      state.rememberMe = false;

      // Clear all auth-related storage
      storage.clear();

      // Store logout info for redirect (all users go to login page)
      if (restaurantUrl) {
        storage.set(
          'logoutRedirect',
          JSON.stringify({
            restaurantUrl,
            timestamp: Date.now(),
          }),
          true
        ); // Always store in localStorage
      }
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    simulateAuth(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.restaurant = action.payload.restaurant;
      state.status = 'succeeded';
      state.error = null;
      state.rememberMe = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.restaurant = action.payload.restaurant || null;
        state.rememberMe = !!action.payload.rememberMe;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.error || action.payload;
      })
      .addCase(rehydrate.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.restaurant = action.payload.restaurant || null;
        state.rememberMe = !!action.payload.rememberMe;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(rehydrate.rejected, (state) => {
        // Clear state on rehydration failure
        state.user = null;
        state.token = null;
        state.restaurant = null;
        state.rememberMe = false;
        state.status = 'idle';
        state.error = null;
      });
  },
});

export const { logout, setUser, simulateAuth } = authSlice.actions;
export { storage };
export default authSlice.reducer;
