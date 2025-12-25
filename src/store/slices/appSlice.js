import { createSlice } from '@reduxjs/toolkit';

// Load persisted state from localStorage
const loadPersistedState = () => {
  try {
    const persistedState = localStorage.getItem('capedge_app_state');
    if (persistedState) {
      return JSON.parse(persistedState);
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
  }
  return null;
};

// Save state to localStorage
const saveStateToLocalStorage = (state) => {
  try {
    localStorage.setItem('capedge_app_state', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

const persistedState = loadPersistedState();

const initialState = persistedState || {
  currentUserAccount: {
    _id: null,
    name: null
  },
  financialYear: {
    _id: null,
    startDate: null,
    endDate: null,
    title: null
  }
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentUserAccount: (state, action) => {
      state.currentUserAccount = action.payload;
      saveStateToLocalStorage(state);
    },
    setFinancialYear: (state, action) => {
      state.financialYear = action.payload;
      saveStateToLocalStorage(state);
    }
  }
});

export const { setCurrentUserAccount, setFinancialYear } = appSlice.actions;

export default appSlice.reducer;
