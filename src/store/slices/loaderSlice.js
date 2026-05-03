import { createSlice } from '@reduxjs/toolkit';

// ==============================|| LOADER SLICE ||============================== //

const initialState = {
  loadingCount: 0
};

const loaderSlice = createSlice({
  name: 'loader',
  initialState,
  reducers: {
    showLoader: (state) => {
      state.loadingCount += 1;
    },
    hideLoader: (state) => {
      state.loadingCount = Math.max(0, state.loadingCount - 1);
    }
  }
});

export const { showLoader, hideLoader } = loaderSlice.actions;
export default loaderSlice.reducer;
