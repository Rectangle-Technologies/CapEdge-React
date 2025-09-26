import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ==============================|| AUTH SLICE ||============================== //

// Async thunk for login API call
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      //TODO: Replace this with your actual API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Login failed');
      }

      const data = await response.json();
      return data; 
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async thunk for token validation API call
export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const token = auth.token;
      
      if (!token) {
        return rejectWithValue('No token found');
      }

      //TODO: Replace this with your actual token validation endpoint
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return rejectWithValue('Token expired');
        }
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Token validation failed');
      }

      const data = await response.json();
      return data; 
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

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
        state.token = action.payload.token;
        
        try {
          localStorage.setItem('authToken', action.payload.token);
        } catch (error) {
          console.error('Failed to save login token to localStorage:', error);
        }
      })
      // Handle login error
      .addCase(login.rejected, (state) => {
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

// Selector helpers
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => !!state.auth.token;

export default authSlice.reducer;