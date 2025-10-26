import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Divider,
  FormHelperText,
  IconButton,
  Paper,
  Chip
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { get, post } from '../../utils/apiUtil';
import { showSuccessSnackbar, showErrorSnackbar } from '../../store/utils';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import MainCard from 'components/MainCard';
import { transactionValidationSchema, multipleTransactionsValidationSchema } from './utils/validation';
import { TRANSACTION_TYPES, DELIVERY_TYPES } from './utils/constants';

/**
 * AddTransaction Component - Create new transaction
 */
const AddTransaction = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // State for dropdowns
  const [securities, setSecurities] = useState([]);
  const [dematAccounts, setDematAccounts] = useState([]);

  // Fetch securities and demat accounts
  useEffect(() => {
    fetchSecurities();
    fetchDematAccounts();
  }, []);

  const fetchSecurities = async () => {
    try {
      dispatch(showLoader());
      const data = await get('/securities');
      setSecurities(data || []);
    } catch (error) {
      dispatch(showErrorSnackbar(error.message || 'Failed to fetch securities'));
    } finally {
      dispatch(hideLoader());
    }
  };

  const fetchDematAccounts = async () => {
    try {
      dispatch(showLoader());
      const data = await get('/demat-accounts');
      setDematAccounts(data || []);
    } catch (error) {
      dispatch(showErrorSnackbar(error.message || 'Failed to fetch demat accounts'));
    } finally {
      dispatch(hideLoader());
    }
  };

  // Form handling with Formik for multiple transactions
  const formik = useFormik({
    initialValues: {
      transactions: [
        {
          date: new Date(),
          type: '',
          quantity: '',
          price: '',
          securityId: '',
          deliveryType: '',
          referenceNumber: '',
          dematAccountId: ''
        }
      ]
    },
    validationSchema: multipleTransactionsValidationSchema,
    onSubmit: async (values) => {
      try {
        dispatch(showLoader());
        
        // Format the data for submission
        const transactionsData = values.transactions.map(transaction => ({
          ...transaction,
          date: transaction.date.toISOString(),
          quantity: parseInt(transaction.quantity, 10),
          price: parseFloat(transaction.price)
        }));

        // Submit all transactions
        await post('/transactions/bulk', { transactions: transactionsData });
        dispatch(showSuccessSnackbar(`${transactionsData.length} transaction(s) created successfully`));
        navigate('/transactions');
      } catch (error) {
        dispatch(showErrorSnackbar(error.message || 'Failed to create transactions'));
      } finally {
        dispatch(hideLoader());
      }
    }
  });

  // Add new transaction
  const handleAddTransaction = () => {
    const newTransaction = {
      date: new Date(),
      type: '',
      quantity: '',
      price: '',
      securityId: '',
      deliveryType: '',
      referenceNumber: '',
      dematAccountId: ''
    };
    formik.setFieldValue('transactions', [...formik.values.transactions, newTransaction]);
  };

  // Remove transaction
  const handleRemoveTransaction = (index) => {
    const updatedTransactions = formik.values.transactions.filter((_, i) => i !== index);
    formik.setFieldValue('transactions', updatedTransactions);
  };

  // Calculate total amount for a transaction
  const calculateTotal = (quantity, price) => {
    if (quantity && price) {
      return (parseFloat(quantity) * parseFloat(price)).toFixed(2);
    }
    return '0.00';
  };

  return (
    <MainCard>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/transactions')}
              variant="outlined"
              size="small"
            >
              Back
            </Button>
            <Typography variant="h4">Add New Transactions</Typography>
          </Box>
        }
      />
      <Divider sx={{ my: 2 }} />
      
      <CardContent>
        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            {/* Add Transaction Button */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" color="primary">
                Transactions ({formik.values.transactions.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddTransaction}
                size="medium"
              >
                Add Transaction
              </Button>
            </Box>

            {/* Transaction Forms */}
            {formik.values.transactions.map((transaction, index) => {
              const transactionErrors = formik.errors.transactions?.[index] || {};
              const transactionTouched = formik.touched.transactions?.[index] || {};
              const totalAmount = calculateTotal(transaction.quantity, transaction.price);

              return (
                <Card
                  key={index}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  <CardHeader
                    title={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={`#${index + 1}`} 
                          color="primary" 
                          size="small" 
                        />
                        <Typography variant="h6">Transaction Details</Typography>
                      </Box>
                    }
                    action={
                      formik.values.transactions.length > 1 && (
                        <Button
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={() => handleRemoveTransaction(index)}
                          size="small"
                        >
                          Remove
                        </Button>
                      )
                    }
                    sx={{ pb: 1 }}
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Date and Time */}
                      <Grid item xs={12} sm={6} md={4}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DateTimePicker
                            label="Date & Time"
                            value={transaction.date}
                            onChange={(newValue) => 
                              formik.setFieldValue(`transactions[${index}].date`, newValue)
                            }
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: transactionTouched.date && Boolean(transactionErrors.date),
                                helperText: transactionTouched.date && transactionErrors.date,
                                onBlur: formik.handleBlur,
                                name: `transactions[${index}].date`
                              }
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>

                      {/* Transaction Type */}
                      <Grid item xs={12} sm={6} md={4}>
                        <FormControl 
                          fullWidth 
                          error={transactionTouched.type && Boolean(transactionErrors.type)}
                        >
                          <InputLabel>Type *</InputLabel>
                          <Select
                            name={`transactions[${index}].type`}
                            value={transaction.type}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            label="Type *"
                          >
                            {TRANSACTION_TYPES.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {transactionTouched.type && transactionErrors.type && (
                            <FormHelperText>{transactionErrors.type}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      {/* Delivery Type */}
                      <Grid item xs={12} sm={6} md={4}>
                        <FormControl 
                          fullWidth 
                          error={transactionTouched.deliveryType && Boolean(transactionErrors.deliveryType)}
                        >
                          <InputLabel>Delivery Type *</InputLabel>
                          <Select
                            name={`transactions[${index}].deliveryType`}
                            value={transaction.deliveryType}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            label="Delivery Type *"
                          >
                            {DELIVERY_TYPES.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {transactionTouched.deliveryType && transactionErrors.deliveryType && (
                            <FormHelperText>{transactionErrors.deliveryType}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      {/* Security */}
                      <Grid item xs={12} sm={6}>
                        <FormControl 
                          fullWidth 
                          error={transactionTouched.securityId && Boolean(transactionErrors.securityId)}
                        >
                          <InputLabel>Security *</InputLabel>
                          <Select
                            name={`transactions[${index}].securityId`}
                            value={transaction.securityId}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            label="Security *"
                          >
                            {securities.map((security) => (
                              <MenuItem key={security._id} value={security._id}>
                                {security.name} ({security.type})
                              </MenuItem>
                            ))}
                          </Select>
                          {transactionTouched.securityId && transactionErrors.securityId && (
                            <FormHelperText>{transactionErrors.securityId}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      {/* Demat Account */}
                      <Grid item xs={12} sm={6}>
                        <FormControl 
                          fullWidth 
                          error={transactionTouched.dematAccountId && Boolean(transactionErrors.dematAccountId)}
                        >
                          <InputLabel>Demat Account *</InputLabel>
                          <Select
                            name={`transactions[${index}].dematAccountId`}
                            value={transaction.dematAccountId}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            label="Demat Account *"
                          >
                            {dematAccounts.map((account) => (
                              <MenuItem key={account._id} value={account._id}>
                                {account.accountNumber} - {account.userId?.name || 'N/A'}
                              </MenuItem>
                            ))}
                          </Select>
                          {transactionTouched.dematAccountId && transactionErrors.dematAccountId && (
                            <FormHelperText>{transactionErrors.dematAccountId}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      {/* Quantity */}
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          fullWidth
                          name={`transactions[${index}].quantity`}
                          label="Quantity *"
                          type="number"
                          value={transaction.quantity}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={transactionTouched.quantity && Boolean(transactionErrors.quantity)}
                          helperText={transactionTouched.quantity && transactionErrors.quantity}
                          placeholder="Enter quantity"
                          inputProps={{ min: 1, step: 1 }}
                        />
                      </Grid>

                      {/* Price */}
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          fullWidth
                          name={`transactions[${index}].price`}
                          label="Price per Unit *"
                          type="number"
                          value={transaction.price}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={transactionTouched.price && Boolean(transactionErrors.price)}
                          helperText={transactionTouched.price && transactionErrors.price}
                          placeholder="0.00"
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                          }}
                        />
                      </Grid>

                      {/* Total Amount (Read-only) */}
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          fullWidth
                          label="Total Amount"
                          value={totalAmount}
                          InputProps={{
                            readOnly: true,
                            startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                          }}
                          sx={{
                            '& .MuiInputBase-input': {
                              fontWeight: 'bold',
                              color: 'success.main'
                            }
                          }}
                        />
                      </Grid>

                      {/* Reference Number */}
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          fullWidth
                          name={`transactions[${index}].referenceNumber`}
                          label="Reference Number"
                          value={transaction.referenceNumber}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={transactionTouched.referenceNumber && Boolean(transactionErrors.referenceNumber)}
                          helperText={transactionTouched.referenceNumber && transactionErrors.referenceNumber}
                          placeholder="Optional"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}

            {/* Grand Total */}
            <Card
              sx={{
                bgcolor: 'primary.lighter',
                border: 2,
                borderColor: 'primary.main'
              }}
            >
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h5" color="primary">
                      Total Transactions: {formik.values.transactions.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h4" color="primary" textAlign={{ xs: 'left', sm: 'right' }}>
                      Grand Total: ₹{' '}
                      {formik.values.transactions
                        .reduce((sum, t) => sum + parseFloat(calculateTotal(t.quantity, t.price)), 0)
                        .toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/transactions')}
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                size="large"
                disabled={!formik.isValid || formik.isSubmitting}
              >
                Save All Transactions
              </Button>
            </Stack>
          </Stack>
        </form>
      </CardContent>
    </MainCard>
  );
};

export default AddTransaction;
