import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import { useDispatch } from 'react-redux';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { showErrorSnackbar, showSuccessSnackbar } from 'store/utils';
import { get, post } from 'utils/apiUtil';
import MainCard from 'components/MainCard';

// Constants
const transactionTypes = ['BUY', 'SELL'];
const deliveryTypes = ['Delivery', 'Intraday'];

const AddTransaction = () => {
  const dispatch = useDispatch();

  // Common fields (shared across all transactions)
  const [transactionDate, setTransactionDate] = useState(dayjs());
  const [referenceNumber, setReferenceNumber] = useState('');

  // Dropdown data
  const [securities, setSecurities] = useState([]);
  const [securitiesLoading, setSecuritiesLoading] = useState({});
  const [dematAccounts, setDematAccounts] = useState([]);

  // Transaction rows
  const [transactions, setTransactions] = useState([
    {
      id: Date.now(),
      type: 'BUY',
      quantity: '',
      buyPrice: '',
      sellPrice: '',
      security: null,
      deliveryType: 'Delivery',
      dematAccountId: ''
    }
  ]);

  const fetchDematAccounts = async () => {
    try {
      dispatch(showLoader());
      const response = await get('/demat-account/get-all?pageNo=1&limit=1000');
      setDematAccounts(response.dematAccounts || []);
    } catch (error) {
      console.error('Error fetching demat accounts:', error);
      showErrorSnackbar('Failed to fetch demat accounts');
    } finally {
      dispatch(hideLoader());
    }
  };

  const fetchSecuritiesForDropdown = async (searchTerm = '', transactionId) => {
    try {
      setSecuritiesLoading((prev) => ({ ...prev, [transactionId]: true }));
      const response = await get(`/security/get-all?name=&pageNo=1&limit=20&search=${encodeURIComponent(searchTerm)}`);
      return response.securities || [];
    } catch (error) {
      console.error('Error fetching securities:', error);
      showErrorSnackbar('Failed to fetch securities');
      return [];
    } finally {
      setSecuritiesLoading((prev) => ({ ...prev, [transactionId]: false }));
    }
  };

  // Fetch demat accounts on component mount
  useEffect(() => {
    fetchDematAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add new transaction row
  const handleAddTransaction = () => {
    setTransactions([
      ...transactions,
      {
        id: Date.now(),
        type: 'BUY',
        quantity: '',
        buyPrice: '',
        sellPrice: '',
        security: null,
        deliveryType: 'Delivery',
        dematAccountId: ''
      }
    ]);
  };

  // Remove transaction row
  const handleRemoveTransaction = (id) => {
    if (transactions.length === 1) {
      showErrorSnackbar('At least one transaction is required');
      return;
    }
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  // Update transaction field
  const handleTransactionChange = (id, field, value) => {
    setTransactions(transactions.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  // Validate transactions
  const validateTransactions = () => {
    if (!referenceNumber.trim()) {
      showErrorSnackbar('Reference Number is required');
      return false;
    }

    if (!transactionDate) {
      showErrorSnackbar('Transaction Date is required');
      return false;
    }

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];

      if (!t.type) {
        showErrorSnackbar(`Transaction ${i + 1}: Type is required`);
        return false;
      }

      if (!t.quantity || t.quantity <= 0) {
        showErrorSnackbar(`Transaction ${i + 1}: Valid quantity is required`);
        return false;
      }

      if (t.type === 'BUY' && (!t.buyPrice || t.buyPrice <= 0)) {
        showErrorSnackbar(`Transaction ${i + 1}: Valid buy price is required`);
        return false;
      }

      if (t.type === 'SELL' && (!t.sellPrice || t.sellPrice <= 0)) {
        showErrorSnackbar(`Transaction ${i + 1}: Valid sell price is required`);
        return false;
      }

      if (!t.security) {
        showErrorSnackbar(`Transaction ${i + 1}: Security is required`);
        return false;
      }

      if (!t.deliveryType) {
        showErrorSnackbar(`Transaction ${i + 1}: Delivery type is required`);
        return false;
      }

      if (!t.dematAccountId) {
        showErrorSnackbar(`Transaction ${i + 1}: Demat Account is required`);
        return false;
      }
    }

    return true;
  };

  // Save all transactions
  const handleSaveTransactions = async () => {
    if (!validateTransactions()) {
      return;
    }

    try {
      dispatch(showLoader());

      // Prepare payload with common fields
      const payload = transactions.map((t) => ({
        date: transactionDate.format('YYYY-MM-DD'),
        type: t.type,
        quantity: Number(t.quantity),
        buyPrice: Number(t.buyPrice),
        sellPrice: Number(t.sellPrice),
        securityId: t.security._id,
        deliveryType: t.deliveryType,
        referenceNumber: referenceNumber,
        dematAccountId: t.dematAccountId
      }));

      await post('/transaction/create', payload);

      showSuccessSnackbar(`${transactions.length} transaction(s) added successfully`);

      // Reset form
      setReferenceNumber('');
      setTransactionDate(dayjs());
      setTransactions([
        {
          id: Date.now(),
          type: 'BUY',
          quantity: '',
          buyPrice: '',
          sellPrice: '',
          security: null,
          deliveryType: 'Delivery',
          dematAccountId: ''
        }
      ]);
    } catch (error) {
      console.error('Error saving transactions:', error);
      showErrorSnackbar(error.message || 'Failed to save transactions');
    } finally {
      dispatch(hideLoader());
    }
  };

  return (
    <MainCard>
      <CardHeader
        title={
          <Typography variant="h5" component="div">
            Add Transactions
          </Typography>
        }
      />
      <Divider />
      <CardContent>
        {/* Common Fields Section */}
        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Common Transaction Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Transaction Date *"
                    value={transactionDate}
                    onChange={(newValue) => setTransactionDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reference Number"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  required
                  placeholder="e.g., REF001"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Transaction Details</Typography>
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleAddTransaction} size="small">
            Add Transaction
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.lighter' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Type *</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Security *</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Demat Account *</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Quantity *</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Buy Price *</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sell Price *</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Delivery Type *</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={transaction.type}
                      onChange={(e) => handleTransactionChange(transaction.id, 'type', e.target.value)}
                      fullWidth
                      required
                    >
                      {transactionTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      size="small"
                      value={transaction.security}
                      onChange={(event, newValue) => {
                        handleTransactionChange(transaction.id, 'security', newValue);
                      }}
                      onOpen={async () => {
                        if (securities.length === 0) {
                          const fetchedSecurities = await fetchSecuritiesForDropdown('', transaction.id);
                          setSecurities(fetchedSecurities);
                        }
                      }}
                      onInputChange={async (event, newInputValue, reason) => {
                        if (reason === 'input') {
                          const fetchedSecurities = await fetchSecuritiesForDropdown(newInputValue, transaction.id);
                          setSecurities(fetchedSecurities);
                        }
                      }}
                      options={securities}
                      getOptionLabel={(option) => option.name || ''}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      loading={securitiesLoading[transaction.id]}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search Security"
                          required
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {securitiesLoading[transaction.id] ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      noOptionsText="Type to search securities"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={transaction.dematAccountId}
                      onChange={(e) => handleTransactionChange(transaction.id, 'dematAccountId', e.target.value)}
                      fullWidth
                      required
                      placeholder="Select Account"
                    >
                      {dematAccounts.map((account) => (
                        <MenuItem key={account._id} value={account._id}>
                          {account.accountNumber || account._id}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={transaction.quantity}
                      onChange={(e) => handleTransactionChange(transaction.id, 'quantity', e.target.value)}
                      fullWidth
                      required
                      placeholder="0"
                      inputProps={{ min: 0, step: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={transaction.buyPrice}
                      onChange={(e) => handleTransactionChange(transaction.id, 'buyPrice', e.target.value)}
                      fullWidth
                      required={transaction.type === 'BUY'}
                      disabled={transaction.type === 'SELL'}
                      placeholder="0.00"
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={transaction.sellPrice}
                      onChange={(e) => handleTransactionChange(transaction.id, 'sellPrice', e.target.value)}
                      fullWidth
                      required={transaction.type === 'SELL'}
                      disabled={transaction.type === 'BUY'}
                      placeholder="0.00"
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={transaction.deliveryType}
                      onChange={(e) => handleTransactionChange(transaction.id, 'deliveryType', e.target.value)}
                      fullWidth
                      required
                    >
                      {deliveryTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleRemoveTransaction(transaction.id)}
                      disabled={transactions.length === 1}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSaveTransactions} size="large">
            Save All Transactions ({transactions.length})
          </Button>
        </Box>
      </CardContent>
    </MainCard>
  );
};

export default AddTransaction;
