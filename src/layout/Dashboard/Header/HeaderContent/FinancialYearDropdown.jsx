import { useEffect, useState } from "react"
import { showErrorSnackbar } from "../../../../store/utils";
import { get } from "../../../../utils/apiUtil";
import { useDispatch, useSelector } from "react-redux";
import { setFinancialYear } from "../../../../store/slices/appSlice";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";


const FinancialYearDropdown = () => {
    const dispatch = useDispatch();
    const [financialYears, setFinancialYears] = useState([]);
    const financialYear = useSelector((state) => state.app.financialYear);

    const handleChange = (event) => {
        const selectedYear = financialYears.find(year => year._id === event.target.value);
        if (selectedYear) {
            dispatch(setFinancialYear({
                _id: selectedYear._id || null,
                startDate: selectedYear.startDate || null,
                endDate: selectedYear.endDate || null,
                title: selectedYear.title || null
            }));
        }
    };

    useEffect(() => {
        const fetchFinancialYears = async () => {
            try {
                const data = await get('/financial-year/get-all');
                const years = data.financialYears || [];
                setFinancialYears(years);

                // Set first year as default if available and no year is currently selected
                if (years.length > 0 && !financialYear?.title) {
                    dispatch(setFinancialYear({
                        _id: years[0]._id || null,
                        startDate: years[0].startDate || null,
                        endDate: years[0].endDate || null,
                        title: years[0].title || null
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch financial years:', error);
                showErrorSnackbar(error.message || 'Failed to fetch financial years');
            }
        }
        fetchFinancialYears()
    }, [dispatch, financialYear?.title]);

    return (
        <Box sx={{ width: 150, m: 2 }}>
            <FormControl fullWidth>
                <InputLabel id="financial-year-select-label">Financial Year</InputLabel>
                <Select
                    labelId="financial-year-select-label"
                    id="financial-year-select"
                    value={financialYear?._id || ''}
                    label="Financial Year"
                    onChange={handleChange}
                    size="small"
                >
                    {financialYears.map((year) => (
                        <MenuItem key={year._id} value={year._id}>
                            {year.title}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    )
}

export default FinancialYearDropdown