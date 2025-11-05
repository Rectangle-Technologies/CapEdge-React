import { useState, useEffect, useRef } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { showErrorSnackbar, showSuccessSnackbar } from 'store/utils';
import { get, post } from 'utils/apiUtil';
import MainCard from 'components/MainCard';

// Constants
const transactionTypes = ['BUY', 'SELL'];
const deliveryTypes = ['Delivery', 'Intraday'];
const SECURITY_SEARCH_MIN_CHARS = 3;
const SECURITY_SEARCH_DEBOUNCE_MS = 750;

const AddTransaction = () => {
  const dispatch = useDispatch();
  
  // Get userAccount from Redux
  const userAccount = useSelector((state) => state.app.currentUserAccount);

  // Common fields (shared across all transactions)
  const [transactionDate, setTransactionDate] = useState(dayjs());
  const [referenceNumber, setReferenceNumber] = useState('');
  const [selectedDematAccount, setSelectedDematAccount] = useState('');

  // Dropdown data
  const [securities, setSecurities] = useState([]);
  const [securitiesLoading, setSecuritiesLoading] = useState({});
  const [dematAccounts, setDematAccounts] = useState([]);

  // Debounce timer ref for security search
  const debounceTimerRef = useRef(null);

  // Transaction rows
  const [transactions, setTransactions] = useState([
    {
      id: Date.now(),
      type: 'BUY',
      quantity: '',
      buyPrice: '',
      sellPrice: '',
      security: null,
      deliveryType: 'Delivery'
    }
  ]);

  const fetchDematAccounts = async () => {
    try {
      dispatch(showLoader());
      const response = await get(`/demat-account/get-all?userAccountId=${userAccount._id}`);
      setDematAccounts(response.dematAccounts || []);
      if (response.dematAccounts && response.dematAccounts.length > 0) {
        setSelectedDematAccount(response.dematAccounts[0]._id);
      }
    } catch (error) {
      console.error('Error fetching demat accounts:', error);
      showErrorSnackbar('Failed to fetch demat accounts');
    } finally {
      dispatch(hideLoader());
    }
  };

  const fetchSecuritiesForDropdown = async (searchTerm = '', transactionId) => {
    // Check minimum character requirement
    if (searchTerm && searchTerm.length < SECURITY_SEARCH_MIN_CHARS) {
      setSecurities([]);
      return [];
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Return a promise that resolves after debounce
    return new Promise((resolve) => {
      debounceTimerRef.current = setTimeout(async () => {
        try {
          setSecuritiesLoading((prev) => ({ ...prev, [transactionId]: true }));
          const response = await get(`/security/get-all?name=&pageNo=1&limit=20&search=${encodeURIComponent(searchTerm)}`);
          const fetchedSecurities = response.securities || [];
          setSecurities(fetchedSecurities);
          resolve(fetchedSecurities);
        } catch (error) {
          console.error('Error fetching securities:', error);
          showErrorSnackbar('Failed to fetch securities');
          resolve([]);
        } finally {
          setSecuritiesLoading((prev) => ({ ...prev, [transactionId]: false }));
        }
      }, SECURITY_SEARCH_DEBOUNCE_MS);
    });
  };

  // Fetch demat accounts on component mount
  useEffect(() => {
    if (userAccount && userAccount._id) {
      fetchDematAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAccount]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
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
        deliveryType: 'Delivery'
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

    if (!selectedDematAccount) {
      showErrorSnackbar('Demat Account is required');
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

      // For Intraday: both buy and sell prices are required
      if (t.deliveryType === 'Intraday') {
        if (!t.buyPrice || t.buyPrice <= 0) {
          showErrorSnackbar(`Transaction ${i + 1}: Valid buy price is required for Intraday`);
          return false;
        }
        if (!t.sellPrice || t.sellPrice <= 0) {
          showErrorSnackbar(`Transaction ${i + 1}: Valid sell price is required for Intraday`);
          return false;
        }
      } else {
        // For Delivery: only validate the price based on transaction type
        if (t.type === 'BUY' && (!t.buyPrice || t.buyPrice <= 0)) {
          showErrorSnackbar(`Transaction ${i + 1}: Valid buy price is required`);
          return false;
        }

        if (t.type === 'SELL' && (!t.sellPrice || t.sellPrice <= 0)) {
          showErrorSnackbar(`Transaction ${i + 1}: Valid sell price is required`);
          return false;
        }
      }

      if (!t.security) {
        showErrorSnackbar(`Transaction ${i + 1}: Security is required`);
        return false;
      }

      if (!t.deliveryType) {
        showErrorSnackbar(`Transaction ${i + 1}: Delivery type is required`);
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
      const payload = transactions.map((t) => {
        // Determine the price based on transaction type and delivery type
        let price;
        if (t.deliveryType === 'Intraday') {
          // For Intraday, use buyPrice (or you could calculate average or use both)
          price = Number(t.buyPrice);
        } else {
          // For Delivery, use the appropriate price based on type
          price = t.type === 'BUY' ? Number(t.buyPrice) : Number(t.sellPrice);
        }

        return {
          date: transactionDate.format('YYYY-MM-DD'),
          type: t.type,
          quantity: Number(t.quantity),
          price: price,
          securityId: t.security._id,
          deliveryType: t.deliveryType,
          referenceNumber: referenceNumber,
          dematAccountId: selectedDematAccount
        };
      });

      const response = await post('/transaction/create', payload);

      showSuccessSnackbar(response.message || `${transactions.length} transaction(s) added successfully`);

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
          deliveryType: 'Delivery'
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Common Transaction Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Demat Account *"
                value={selectedDematAccount}
                onChange={(e) => setSelectedDematAccount(e.target.value)}
                required
                placeholder="Select Account"
              >
                {dematAccounts.length === 0 && <MenuItem value="">No Demat Accounts</MenuItem>}
                {dematAccounts.map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.brokerId?.name || account.accountNumber || account._id}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Transaction Date *"
                  value={transactionDate}
                  onChange={(newValue) => setTransactionDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      size: 'small'
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Reference Number *"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                required
                placeholder="e.g., REF001"
              />
            </Grid>
          </Grid>
        </Box>

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
                <TableCell sx={{ fontWeight: 'bold', width: '12%' }}>Delivery Type *</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Type *</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Security *</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '12%' }}>Quantity *</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '12%' }}>Buy Price *</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '12%' }}>Sell Price *</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '12%' }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={transaction.id} hover>
                  <TableCell sx={{ width: '12%' }}>
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
                  <TableCell sx={{ width: '10%' }}>
                    <TextField
                      select
                      size="small"
                      value={transaction.type}
                      onChange={(e) => handleTransactionChange(transaction.id, 'type', e.target.value)}
                      fullWidth
                      required
                      disabled={transaction.deliveryType === 'Intraday'}
                    >
                      {transactionTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell sx={{ width: '30%' }}>
                    <Autocomplete
                      size="small"
                      value={transaction.security}
                      onChange={(event, newValue) => {
                        handleTransactionChange(transaction.id, 'security', newValue);
                      }}
                      onOpen={async () => {
                        if (securities.length === 0) {
                          // Load initial securities with empty search
                          await fetchSecuritiesForDropdown('', transaction.id);
                        }
                      }}
                      onInputChange={async (event, newInputValue, reason) => {
                        if (reason === 'input') {
                          await fetchSecuritiesForDropdown(newInputValue, transaction.id);
                        }
                      }}
                      options={securities}
                      getOptionLabel={(option) => option.name || ''}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      loading={securitiesLoading[transaction.id]}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Type at least 3 characters to search"
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
                      noOptionsText="Type at least 3 characters to search securities"
                    />
                  </TableCell>
                  <TableCell sx={{ width: '12%' }}>
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
                  <TableCell sx={{ width: '12%' }}>
                    <TextField
                      size="small"
                      type="number"
                      value={transaction.buyPrice}
                      onChange={(e) => handleTransactionChange(transaction.id, 'buyPrice', e.target.value)}
                      fullWidth
                      required={transaction.deliveryType === 'Intraday' || transaction.type === 'BUY'}
                      disabled={transaction.deliveryType === 'Delivery' && transaction.type === 'SELL'}
                      placeholder="0.00"
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </TableCell>
                  <TableCell sx={{ width: '12%' }}>
                    <TextField
                      size="small"
                      type="number"
                      value={transaction.sellPrice}
                      onChange={(e) => handleTransactionChange(transaction.id, 'sellPrice', e.target.value)}
                      fullWidth
                      required={transaction.deliveryType === 'Intraday' || transaction.type === 'SELL'}
                      disabled={transaction.deliveryType === 'Delivery' && transaction.type === 'BUY'}
                      placeholder="0.00"
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ width: '12%' }}>
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
