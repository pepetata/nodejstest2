import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../services/authService';

// Utility functions for storage
const storage = {
  set: (key, value, rememberMe) => {
    if (rememberMe) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  get: (key) => {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  },
  remove: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const data = await authService.login(email, password);
      storage.set('token', data.token, rememberMe);
      storage.set('rememberMe', rememberMe ? 'true' : '', rememberMe);
      return { ...data, rememberMe };
    } catch (err) {
      // Show backend error message in Portuguese if present
      let errorMsg =
        err.response?.data?.error?.message || err.response?.data?.message || err.message;
      if (err.response?.status === 429) {
        errorMsg = err.response?.data?.erro?.mensagem || errorMsg;
      }
      return rejectWithValue(errorMsg);
    }
  }
);

export const rehydrate = createAsyncThunk('auth/rehydrate', async (_, { rejectWithValue }) => {
  try {
    const token = storage.get('token');
    const rememberMe = storage.get('rememberMe') === 'true';
    if (!token) return { user: null, token: null, rememberMe };
    // Set token in axios headers (api.js already does this)
    const data = await authService.getCurrentUser();
    return { user: data.user, token, rememberMe };
  } catch (err) {
    storage.remove('token');
    storage.remove('rememberMe');
    return rejectWithValue(null);
  }
});

const initialState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
  rememberMe: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      state.rememberMe = false;
      storage.remove('token');
      storage.remove('rememberMe');
    },
    setUser(state, action) {
      state.user = action.payload;
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
        state.rememberMe = !!action.payload.rememberMe;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(rehydrate.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.rememberMe = !!action.payload.rememberMe;
        state.status = 'idle';
      })
      .addCase(rehydrate.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.status = 'idle';
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export { storage };
export default authSlice.reducer;
