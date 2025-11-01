import { Box, Button, FormControl, Grid, InputAdornment, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { showErrorSnackbar, showSuccessSnackbar } from '../../store/utils'
import { useDispatch } from 'react-redux';
import { hideLoader, showLoader } from '../../store/slices/loaderSlice';
import { get, put } from '../../utils/apiUtil';
import { formatDate } from '../../utils/formatDate';

// Validation schema
const ratesValidationSchema = Yup.object({
    startDate: Yup.date()
        .required('Start Date is required')
        .nullable(),
    endDate: Yup.date()
        .required('End Date is required')
        .nullable(),
    stcgRate: Yup.number()
        .required('STCG Rate is required')
        .min(0, 'STCG Rate must be at least 0')
        .max(100, 'STCG Rate must not exceed 100'),
    ltcgRate: Yup.number()
        .required('LTCG Rate is required')
        .min(0, 'LTCG Rate must be at least 0')
        .max(100, 'LTCG Rate must not exceed 100')
});

const FinancialYears = () => {
    const dispatch = useDispatch();
    const [financialYears, setFinancialYears] = useState([]);
    const [financialYear, setFinancialYear] = useState(null);

    // Form handler with Formik
    const formik = useFormik({
        initialValues: {
            startDate: '',
            endDate: '',
            stcgRate: '',
            ltcgRate: ''
        },
        validationSchema: ratesValidationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!financialYear) {
                showErrorSnackbar('Please select a financial year.');
                setSubmitting(false);
                return;
            }

            dispatch(showLoader());
            try {
                const payload = {
                    startDate: values.startDate,
                    endDate: values.endDate,
                    stcgRate: parseFloat(values.stcgRate),
                    ltcgRate: parseFloat(values.ltcgRate)
                };

                await put(`/financial-year/update/${financialYear._id}`, payload);
                showSuccessSnackbar('Financial year updated successfully.');

                // Refresh financial years
                await fetchFinancialYears(financialYear);
            } catch (error) {
                console.error('Error updating financial year:', error);
                showErrorSnackbar(error.message || 'Failed to update financial year.');
            } finally {
                dispatch(hideLoader());
                setSubmitting(false);
            }
        }
    });

    const fetchFinancialYears = async (financialYear = null) => {
        dispatch(showLoader());
        try {
            const data = await get('/financial-year/get-all')
            setFinancialYears(data.financialYears || []);
            // Set first year as default
            if (data.financialYears?.length > 0) {
                if (financialYear) {
                    const selectedYear = data.financialYears.find(year => year._id === financialYear._id);
                    if (selectedYear) {
                        setFinancialYear(selectedYear);
                        formik.setValues({
                            startDate: formatDate(selectedYear.startDate, 'input'),
                            endDate: formatDate(selectedYear.endDate, 'input'),
                            stcgRate: (selectedYear.stcgRate * 100) || '',
                            ltcgRate: (selectedYear.ltcgRate * 100) || ''
                        });
                        formik.setTouched({}, false);
                        formik.setErrors({});
                        return;
                    }
                }
                const firstYear = data.financialYears[0];
                setFinancialYear(firstYear);
                formik.setValues({
                    startDate: formatDate(firstYear.startDate, 'input'),
                    endDate: formatDate(firstYear.endDate, 'input'),
                    stcgRate: (firstYear.stcgRate * 100) || '',
                    ltcgRate: (firstYear.ltcgRate * 100) || ''
                });
                formik.setTouched({}, false);
                formik.setErrors({});
            }
        } catch (error) {
            console.error('Error fetching financial years:', error)
            showErrorSnackbar('Failed to fetch financial years.')
        } finally {
            dispatch(hideLoader());
        }
    }

    const handleFinancialYearChange = (event) => {
        const selectedYearId = event.target.value;
        const selectedYear = financialYears.find(year => year._id === selectedYearId);

        if (selectedYear) {
            setFinancialYear(selectedYear);
            formik.setValues({
                startDate: formatDate(selectedYear.startDate, 'input'),
                endDate: formatDate(selectedYear.endDate, 'input'),
                stcgRate: (selectedYear.stcgRate * 100) || '',
                ltcgRate: (selectedYear.ltcgRate * 100) || ''
            });
            formik.setTouched({}, false);
            formik.setErrors({});
        }
    };

    useEffect(() => {
        fetchFinancialYears();
    }, [dispatch])

    return (
        <Grid container rowSpacing={4.5} columnSpacing={3}>
            <Grid container size={12} sx={{ mt: 4 }}>
                <Typography variant="h4">Financial Years</Typography>
            </Grid>
            <Grid container size={12} columnSpacing={3}>
                <Grid item size={{ xs: 12 }}>
                    <Box>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel id="financial-year-select-label">Financial Year</InputLabel>
                            <Select
                                labelId="financial-year-select-label"
                                id="financial-year-select"
                                value={financialYear?._id || ''}
                                label="Financial Year"
                                onChange={handleFinancialYearChange}
                            >
                                {financialYears.map((year) => (
                                    <MenuItem key={year._id} value={year._id}>
                                        {year.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Grid>
                <form onSubmit={formik.handleSubmit} style={{ display: 'contents' }}>
                    <Grid item size={{ xs: 12, md: 3 }}>
                        <TextField
                            fullWidth
                            name='startDate'
                            type="date"
                            label="Start Date"
                            value={formik.values.startDate}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                            helperText={formik.touched.startDate && formik.errors.startDate}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                        <TextField
                            fullWidth
                            name='endDate'
                            type="date"
                            label="End Date"
                            value={formik.values.endDate}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                            helperText={formik.touched.endDate && formik.errors.endDate}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                        <TextField
                            fullWidth
                            name="stcgRate"
                            label="STCG Rate"
                            type="number"
                            value={formik.values.stcgRate}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.stcgRate && Boolean(formik.errors.stcgRate)}
                            helperText={formik.touched.stcgRate && formik.errors.stcgRate}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                        />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 3 }}>
                        <TextField
                            fullWidth
                            name="ltcgRate"
                            label="LTCG Rate"
                            type="number"
                            value={formik.values.ltcgRate}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.ltcgRate && Boolean(formik.errors.ltcgRate)}
                            helperText={formik.touched.ltcgRate && formik.errors.ltcgRate}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                        />
                    </Grid>
                    <Grid item size={{ xs: 12 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Button type="submit" variant='contained' disabled={formik.isSubmitting}>
                            Submit
                        </Button>
                    </Grid>
                </form>
            </Grid>
        </Grid>
    )
}

export default FinancialYears