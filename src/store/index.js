import { configureStore } from '@reduxjs/toolkit';

// slices
import loaderSlice from './slices/loaderSlice';
import snackbarSlice from './slices/snackbarSlice';
import authSlice from './slices/authSlice';

// ==============================|| REDUX TOOLKIT - STORE ||============================== //

const store = configureStore({
  reducer: {
    loader: loaderSlice,
    snackbar: snackbarSlice,
    auth: authSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;
