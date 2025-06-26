import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }) => {
    // Simulate API call
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        // Generate a fake token
        const token = `token_${Math.random().toString(36).substring(7)}`;
        AsyncStorage.setItem('token', token);
        resolve(token);
      }, 1000);
    });
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem('token');
});

export const checkAuth = createAsyncThunk('auth/check', async () => {
  const token = await AsyncStorage.getItem('token');
  return token;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.token = action.payload;
      });
  },
});

export default authSlice.reducer;
