import { createSlice } from "@reduxjs/toolkit";

const initialState = {
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
}

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setCurrentUserAccount: (state, action) => {
            state.currentUserAccount = action.payload;
        },
        setFinancialYear: (state, action) => {
            state.financialYear = action.payload;
        }
    }
});

export const { setCurrentUserAccount, setFinancialYear } = appSlice.actions;

export default appSlice.reducer;