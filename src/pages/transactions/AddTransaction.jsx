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
  CardContent,
  CardHeader,
  Divider
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
import SecurityAutocomplete from 'components/SecurityAutocomplete';
import { formatCurrency } from '../../utils/formatCurrency';

const transactionTypes = ['BUY', 'SELL'];
const deliveryTypes = ['Delivery', 'Intraday'];

const AddTransaction = () => {
  const dispatch = useDispatch();
  const userAccount = useSelector((state) => state.app.currentUserAccount);

  const [transactionDate, setTransactionDate] = useState(dayjs());
  const [referenceNumber, setReferenceNumber] = useState('');
  const [selectedDematAccount, setSelectedDematAccount] = useState('');
  const [dematAccounts, setDematAccounts] = useState([]);
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: 'BUY',
      quantity: '',
      buyPrice: '',
      sellPrice: '',
      transactionCost: '',
      security: null,
      deliveryType: 'Delivery'
    }
  ]);
  const [nextId, setNextId] = useState(2);
  const [totalAmount, setTotalAmount] = useState(0);

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

  useEffect(() => {
    if (userAccount && userAccount._id) {
      fetchDematAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAccount]);

  useEffect(() => {
    const total = transactions.reduce((sum, transaction) => {
      const buyAmount = transaction.quantity && transaction.buyPrice
        ? Number(transaction.quantity) * Number(transaction.buyPrice)
        : 0;
      
      const sellAmount = transaction.quantity && transaction.sellPrice
        ? Number(transaction.quantity) * Number(transaction.sellPrice)
        : 0;
      
      const cost = transaction.transactionCost ? Number(transaction.transactionCost) : 0;
      
      return sum + buyAmount - sellAmount - cost;
    }, 0);
    
    setTotalAmount(total);
  }, [transactions]);

  const handleAddTransaction = () => {
    setTransactions([
      ...transactions,
      {
        id: nextId,
        type: 'BUY',
        quantity: '',
        buyPrice: '',
        sellPrice: '',
        transactionCost: '',
        security: null,
        deliveryType: 'Delivery'
      }
    ]);
    setNextId(nextId + 1);
  };

  const handleRemoveTransaction = (id) => {
    if (transactions.length === 1) {
      showErrorSnackbar('At least one transaction is required');
      return;
    }
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const handleTransactionChange = (id, field, value) => {
    setTransactions(
      transactions.map((t) => {
        if (t.id !== id) return t;

        // If transaction type changes, reset the price fields for Delivery type
        if (field === 'type' && t.deliveryType === 'Delivery') {
          return { ...t, [field]: value, buyPrice: '', sellPrice: '' };
        }

        // If delivery type changes to Delivery, reset both price fields
        if (field === 'deliveryType' && value === 'Delivery') {
          return { ...t, [field]: value, buyPrice: '', sellPrice: '' };
        }

        return { ...t, [field]: value };
      })
    );
  };

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

  const handleSaveTransactions = async () => {
    if (!validateTransactions()) {
      return;
    }

    try {
      dispatch(showLoader());

      const payload = transactions.map((t) => {
        const basePayload = {
          date: transactionDate.format('YYYY-MM-DD'),
          type: t.type,
          quantity: Number(t.quantity),
          securityId: t.security._id,
          deliveryType: t.deliveryType,
          referenceNumber: referenceNumber,
          dematAccountId: selectedDematAccount,
          transactionCost: t.transactionCost ? Number(t.transactionCost) : 0
        };

        if (t.deliveryType === 'Intraday') {
          return {
            ...basePayload,
            buyPrice: Number(t.buyPrice),
            sellPrice: Number(t.sellPrice)
          };
        } else {
          const price = t.type === 'BUY' ? Number(t.buyPrice) : Number(t.sellPrice);
          return {
            ...basePayload,
            price: price
          };
        }
      });

      const response = await post('/transaction/create', payload);

      showSuccessSnackbar(response.message || `${transactions.length} transaction(s) added successfully`);

      setReferenceNumber('');
      setTransactionDate(dayjs());
      setTransactions([
        {
          id: 1,
          type: 'BUY',
          quantity: '',
          buyPrice: '',
          sellPrice: '',
          transactionCost: '',
          security: null,
          deliveryType: 'Delivery'
        }
      ]);
      setNextId(2);
    } catch (error) {
      console.error('Error saving transactions:', error);
      showErrorSnackbar(error.message || 'Failed to save transactions');
    } finally {
      dispatch(hideLoader());
    }
  };

  return (
    <MainCard sx={{ mt: 3 }}>
      <CardHeader
        title={
          <Typography variant="h5" component="div">
            Add Transactions
          </Typography>
        }
      />
      <Divider />
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveTransactions();
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Demat Account"
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
              <Grid size={{ xs: 12, md: 4 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Transaction Date"
                    value={transactionDate}
                    format="DD/MM/YYYY"
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
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Reference Number"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  required
                  autoFocus
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Transaction Details</Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 1400 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.lighter' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '12%' }}>Delivery Type *</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '8%' }}>Type *</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '22%' }}>Security *</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Quantity *</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Buy Price *</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Sell Price *</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Charges *</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '9%' }}>Buy Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '9%' }}>Sell Amount</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: '8%' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
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
                    <TableCell sx={{ width: '8%' }}>
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
                    <TableCell sx={{ width: '22%' }}>
                      <SecurityAutocomplete
                        value={transaction.security}
                        onChange={(newValue) => {
                          handleTransactionChange(transaction.id, 'security', newValue);
                        }}
                        size="small"
                        required={true}
                        fullWidth={true}
                      />
                    </TableCell>
                    <TableCell sx={{ width: '10%' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={transaction.quantity}
                        onChange={(e) => handleTransactionChange(transaction.id, 'quantity', e.target.value)}
                        fullWidth
                        required
                        placeholder="0"
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: '10%' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={transaction.buyPrice}
                        onChange={(e) => handleTransactionChange(transaction.id, 'buyPrice', e.target.value)}
                        fullWidth
                        required={transaction.deliveryType === 'Intraday' || transaction.type === 'BUY'}
                        disabled={transaction.deliveryType === 'Delivery' && transaction.type === 'SELL'}
                        slotProps={{ htmlInput: { min: 0} }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: '10%' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={transaction.sellPrice}
                        onChange={(e) => handleTransactionChange(transaction.id, 'sellPrice', e.target.value)}
                        fullWidth
                        required={transaction.deliveryType === 'Intraday' || transaction.type === 'SELL'}
                        disabled={transaction.deliveryType === 'Delivery' && transaction.type === 'BUY'}
                        slotProps={{ htmlInput: { min: 0} }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: '8%' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={transaction.transactionCost}
                        onChange={(e) => handleTransactionChange(transaction.id, 'transactionCost', e.target.value)}
                        fullWidth
                        slotProps={{ htmlInput: { min: 0} }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: '10%' }}>
                      <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 500 }}>
                        {transaction.quantity && transaction.buyPrice
                          ? formatCurrency(Number(transaction.quantity) * Number(transaction.buyPrice))
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ width: '10%' }}>
                      <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 500 }}>
                        {transaction.quantity && transaction.sellPrice
                          ? formatCurrency(Number(transaction.quantity) * Number(transaction.sellPrice))
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ width: '8%' }}>
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

          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end'}}>
              <Typography variant="h4">
                Total amount: {formatCurrency(totalAmount)}
              </Typography>
            </div>
            <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={handleAddTransaction} size="medium" fullWidth>
              Add Transaction
            </Button>
            <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} size="large" fullWidth>
              Save All Transactions ({transactions.length})
            </Button>
          </Box>
        </form>
      </CardContent>
    </MainCard>
  );
};

export default AddTransaction;
