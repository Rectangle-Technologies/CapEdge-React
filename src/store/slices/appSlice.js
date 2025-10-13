import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { get } from "../../utils/apiUtil";

const initialState = {
    currentUserAccount: {
        _id: null,
        name: null
    },
    allUserAccounts: [], // Non-paginated list for dropdown
    financialYear: {
        start: null,
        end: null,
        title: null
    }
}

// Async thunk to fetch all user accounts (non-paginated) for dropdown
export const fetchAllUserAccounts = createAsyncThunk(
    'app/fetchAllUserAccounts',
    async (_, { rejectWithValue }) => {
        try {
            const data = await get('/user-account/get-all');
            return data.userAccounts || [];
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch user accounts');
        }
    }
);

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
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllUserAccounts.fulfilled, (state, action) => {
                state.allUserAccounts = action.payload;
            })
            .addCase(fetchAllUserAccounts.rejected, (state, action) => {
                console.error('Failed to fetch all user accounts:', action.payload);
            });
    }
});

export const { setCurrentUserAccount, setFinancialYear } = appSlice.actions;

export default appSlice.reducer;