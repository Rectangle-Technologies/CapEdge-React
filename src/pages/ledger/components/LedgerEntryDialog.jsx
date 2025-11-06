import { Dialog, DialogContent, DialogTitle, Grid, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, DialogActions, Button } from "@mui/material"
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

const LedgerEntryDialog = ({
    open,
    formik,
    onClose
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    position: 'fixed',
                    top: '30%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    margin: 0
                }
            }}
        >
            <DialogTitle>Add Ledger Entry</DialogTitle>
            <form onSubmit={formik.handleSubmit}>
                <DialogContent>
                    <Grid container flexDirection='column' spacing={2} sx={{ mt: 2 }}>
                        {/* Date Picker */}
                        <Grid size={12}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Date"
                                    value={formik.values.date}
                                    format="DD/MM/YYYY"
                                    onChange={(value) => {
                                        formik.setFieldValue('date', value);
                                        formik.setFieldTouched('date', true, false);
                                    }}
                                    slotProps={{
                                        textField: {
                                            name: 'date',
                                            fullWidth: true,
                                            onBlur: () => formik.setFieldTouched('date', true),
                                            error: formik.touched.date && Boolean(formik.errors.date),
                                            helperText: formik.touched.date && formik.errors.date
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        {/* Entry Type Radio Button */}
                        <Grid size={12} sx={{ mt: 2 }}>
                            <FormControl component="fieldset" error={formik.touched.entryType && Boolean(formik.errors.entryType)}>
                                <FormLabel component="legend">Entry Type</FormLabel>
                                <RadioGroup
                                    row
                                    name="entryType"
                                    value={formik.values.entryType}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                >
                                    <FormControlLabel value="CREDIT" control={<Radio />} label="Credit" />
                                    <FormControlLabel value="DEBIT" control={<Radio />} label="Debit" />
                                </RadioGroup>
                                {formik.touched.entryType && formik.errors.entryType && (
                                    <FormLabel error>{formik.errors.entryType}</FormLabel>
                                )}
                            </FormControl>
                        </Grid>

                        {/* Transaction Amount */}
                        <Grid size={12} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Transaction Amount"
                                name="transactionAmount"
                                type="number"
                                value={formik.values.transactionAmount}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.transactionAmount && Boolean(formik.errors.transactionAmount)}
                                helperText={formik.touched.transactionAmount && formik.errors.transactionAmount}
                                inputProps={{
                                    step: "0.01",
                                    min: "0"
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ mt: 2 }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained">Add</Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default LedgerEntryDialog