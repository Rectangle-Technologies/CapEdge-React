import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// ==============================|| AUTH SLICE ||============================== //
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Async thunk for login API call
export const login = createAsyncThunk('auth/login', async ({ username, password }, { rejectWithValue }) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        username,
        password
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    return rejectWithValue(errorMessage);
  }
});

// Async thunk for token validation API call
export const validateToken = createAsyncThunk('auth/validateToken', async (_, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    const token = auth.token;

    if (!token) {
      return rejectWithValue('No token found');
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/validate-token`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      return rejectWithValue('Token expired');
    }
    const errorMessage = error.response?.data?.message || error.message || 'Token validation failed';
    return rejectWithValue(errorMessage);
  }
});

// Helper function to safely access localStorage
const getStoredToken = () => {
  try {
    return localStorage.getItem('authToken') || null;
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    return null;
  }
};

const initialState = {
  token: getStoredToken()
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Logout action - clears token and localStorage
    logout: (state) => {
      state.token = null;

      try {
        localStorage.removeItem('authToken');
      } catch (error) {
        console.error('Failed to clear token during logout:', error);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle login success
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.data.token;

        try {
          localStorage.setItem('authToken', action.payload.data.token);
        } catch (error) {
          console.error('Failed to save login token to localStorage:', error);
        }
      })
      // Handle login error
      .addCase(login.rejected, (state, action) => {
        state.token = null;

        try {
          localStorage.removeItem('authToken');
        } catch (error) {
          console.error('Failed to remove token during login error:', error);
        }
      })
      // Handle token validation error (token expired or invalid)
      .addCase(validateToken.rejected, (state) => {
        state.token = null;

        try {
          localStorage.removeItem('authToken');
        } catch (error) {
          console.error('Failed to clear expired token from localStorage:', error);
        }
      });
  }
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
