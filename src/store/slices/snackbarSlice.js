import { createSlice } from '@reduxjs/toolkit';

// ==============================|| SNACKBAR SLICE ||============================== //

const initialState = {
  open: false,
  message: '',
  severity: 'info', // 'success', 'error', 'warning', 'info'
  autoHideDuration: 6000,
  anchorOrigin: {
    vertical: 'top',
    horizontal: 'center'
  }
};

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    showSnackbar: (state, action) => {
      state.open = true;
      state.message = action.payload.message || '';
      state.severity = action.payload.severity || 'info';
      state.autoHideDuration = action.payload.autoHideDuration || 6000;
      if (action.payload.anchorOrigin) {
        state.anchorOrigin = action.payload.anchorOrigin;
      }
    },
    hideSnackbar: (state) => {
      state.open = false;
    },
    clearSnackbar: (state) => {
      state.open = false;
      state.message = '';
      state.severity = 'info';
    }
  }
});

export const { showSnackbar, hideSnackbar, clearSnackbar } = snackbarSlice.actions;
export default snackbarSlice.reducer;
