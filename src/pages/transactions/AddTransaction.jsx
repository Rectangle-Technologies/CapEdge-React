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
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import store from 'store';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { showErrorSnackbar, showSuccessSnackbar } from 'store/utils';
import { get, post, put } from 'utils/apiUtil';
import MainCard from 'components/MainCard';
import SecurityAutocomplete from 'components/SecurityAutocomplete';
import QuickCreateSecurityDialog from 'components/QuickCreateSecurityDialog';
import ContractPickerDialog from 'components/ContractPickerDialog';
import { formatCurrency } from '../../utils/formatCurrency';
import { saveDraft, getDraft, deleteDraft } from 'utils/transactionDrafts';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const transactionTypes = ['BUY', 'SELL'];
const deliveryTypes = ['Delivery', 'Intraday'];

const AddTransaction = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const userAccount = useSelector((state) => state.app.currentUserAccount);

  const editData = location.state?.editTransaction;
  const isEditMode = !!editData;
  const editTransactionId = editData?._id;
  const isIpoMode = isEditMode ? (editData?.isIpo || false) : location.pathname === '/ipo';

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
  const [addSecurityDialogOpen, setAddSecurityDialogOpen] = useState(false);
  const [loadedDraftId, setLoadedDraftId] = useState(null);

  // Contract upload state
  const fileInputRef = useRef(null);
  const [pendingContracts, setPendingContracts] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [quickCreateForRow, setQuickCreateForRow] = useState(null);

  const fetchDematAccounts = async () => {
    try {
      dispatch(showLoader());
      const response = await get(`/demat-account/get-all?userAccountId=${userAccount._id}`);
      setDematAccounts(response.dematAccounts || []);
      // In edit mode, the demat account is pre-filled from the transaction data.
      if (!isEditMode && response.dematAccounts && response.dematAccounts.length > 0) {
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

  // Pre-fill form fields when in edit mode.
  useEffect(() => {
    if (isEditMode && editData) {
      setTransactionDate(dayjs(editData.date));
      setReferenceNumber(editData.referenceNumber || '');
      const dematId = editData.dematAccountId?._id || editData.dematAccountId;
      setSelectedDematAccount(dematId);
      const security = editData.securityId;
      if (editData.deliveryType === 'Intraday') {
        // transactionCost is stored halved (split between BUY+SELL); restore the total.
        setTransactions([{
          id: 1,
          type: 'BUY',
          quantity: editData.quantity,
          buyPrice: editData.price,
          sellPrice: location.state?.editSellPrice ?? '',
          transactionCost: (editData.transactionCost || 0) * 2,
          security,
          deliveryType: 'Intraday'
        }]);
      } else {
        const isBuy = editData.type === 'BUY';
        setTransactions([{
          id: 1,
          type: editData.type,
          quantity: editData.quantity,
          buyPrice: isBuy ? editData.price : '',
          sellPrice: !isBuy ? editData.price : '',
          transactionCost: editData.transactionCost || 0,
          security,
          deliveryType: 'Delivery'
        }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

// Load draft when navigated from drafts list (overrides edit/sessionStorage pre-fill).
  useEffect(() => {
    const draftId = location.state?.draftId;
    if (!draftId || !userAccount?._id || loadedDraftId === draftId) return;
    const draft = getDraft(userAccount._id, draftId);
    if (!draft) return;
    if (draft.transactionDate) setTransactionDate(dayjs(draft.transactionDate));
    setReferenceNumber(draft.referenceNumber || '');
    if (draft.selectedDematAccount) setSelectedDematAccount(draft.selectedDematAccount);
    if (Array.isArray(draft.transactions) && draft.transactions.length > 0) {
      setTransactions(draft.transactions);
      setNextId(Math.max(...draft.transactions.map((t) => t.id || 0)) + 1);
    }
    setLoadedDraftId(draftId);
  }, [location.state, userAccount, loadedDraftId]);

  useEffect(() => {
    const total = transactions.reduce((sum, transaction) => {
      const buyAmount = transaction.quantity && transaction.buyPrice ? Number(transaction.quantity) * Number(transaction.buyPrice) : 0;

      const sellAmount = transaction.quantity && transaction.sellPrice ? Number(transaction.quantity) * Number(transaction.sellPrice) : 0;

      const cost = transaction.transactionCost ? Number(transaction.transactionCost) : 0;

      return sum + buyAmount - sellAmount + cost;
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
        if (!t.buyPrice || t.buyPrice < 0) {
          showErrorSnackbar(`Transaction ${i + 1}: Valid buy price is required for Intraday`);
          return false;
        }
        if (!t.sellPrice || t.sellPrice < 0) {
          showErrorSnackbar(`Transaction ${i + 1}: Valid sell price is required for Intraday`);
          return false;
        }
      } else {
        // For Delivery: only validate the price based on transaction type
        if (t.type === 'BUY' && (!t.buyPrice || t.buyPrice < 0)) {
          showErrorSnackbar(`Transaction ${i + 1}: Valid buy price is required`);
          return false;
        }

        if (t.type === 'SELL' && (!t.sellPrice || t.sellPrice < 0)) {
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

  /**
   * Pre-fill the form with a parsed contract. Charges always default to 0
   * (per product decision — no proration). User can edit before saving.
   */
  const prefillFromContract = (contract) => {
    if (contract.tradeDate) setTransactionDate(dayjs(contract.tradeDate));
    setReferenceNumber(contract.contractNoteNo || '');
    if (contract.matchedDematAccount?._id) {
      setSelectedDematAccount(contract.matchedDematAccount._id);
    }

    const newRows = (contract.lines || []).map((line, idx) => {
      const security = line.matchedSecurityId
        ? { _id: line.matchedSecurityId, name: line.matchedSecurityName || '(matched)' }
        : null;
      const isIntraday = line.deliveryType === 'Intraday';
      return {
        id: idx + 1,
        type: line.type || (isIntraday ? 'BUY' : 'BUY'),
        quantity: line.quantity || '',
        buyPrice: isIntraday
          ? (line.buyPrice ?? '')
          : (line.type === 'BUY' ? (line.price ?? '') : ''),
        sellPrice: isIntraday
          ? (line.sellPrice ?? '')
          : (line.type === 'SELL' ? (line.price ?? '') : ''),
        transactionCost: 0,
        security,
        deliveryType: line.deliveryType || 'Delivery'
      };
    });

    if (newRows.length > 0) {
      setTransactions(newRows);
      setNextId(newRows.length + 1);
    }

    if (contract.warnings?.length) {
      contract.warnings.forEach((w) => showErrorSnackbar(w));
    }
  };

  const handleUploadContract = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      dispatch(showLoader());
      const formData = new FormData();
      formData.append('file', file);
      const token = store.getState().auth?.token;
      const response = await axios.post(`${API_BASE}/transaction/upload-contract`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        timeout: 30000
      });
      const data = response.data?.data;
      const contracts = data?.contracts || [];
      if (contracts.length === 0) {
        showErrorSnackbar('No contracts could be parsed from this PDF');
        return;
      }
      if (contracts.length === 1) {
        prefillFromContract(contracts[0]);
        showSuccessSnackbar('Contract loaded — review and save');
      } else {
        // Multi-client PDF: queue them and let the user pick
        setPendingContracts(contracts);
        setPickerOpen(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to parse contract';
      showErrorSnackbar(msg);
    } finally {
      dispatch(hideLoader());
    }
  };

  const handlePickContract = (contract, idx) => {
    prefillFromContract(contract);
    setPendingContracts((prev) => prev.filter((_, i) => i !== idx));
    setPickerOpen(false);
  };

  const handleSaveDraft = () => {
    if (!userAccount?._id) {
      showErrorSnackbar('User account not loaded — cannot save draft');
      return;
    }
    const draftPayload = {
      transactionDate: transactionDate ? transactionDate.toISOString() : null,
      referenceNumber,
      selectedDematAccount,
      transactions,
      isEditMode,
      editSnapshot: isEditMode ? editData : null
    };
    const stored = saveDraft(userAccount._id, draftPayload, { replaceId: loadedDraftId });
    if (stored) {
      setLoadedDraftId(stored.id);
      showSuccessSnackbar('Draft saved');
    }
  };

  const handleSaveTransactions = async () => {
    if (!validateTransactions()) {
      return;
    }

    try {
      dispatch(showLoader());

      if (isEditMode) {
        // Edit mode: single transaction, use PUT.
        const t = transactions[0];
        const basePayload = {
          date: transactionDate.format('YYYY-MM-DD'),
          type: t.type,
          quantity: Number(t.quantity),
          securityId: t.security._id,
          deliveryType: t.deliveryType,
          referenceNumber: referenceNumber,
          dematAccountId: selectedDematAccount,
          transactionCost: t.transactionCost ? Number(t.transactionCost) : 0,
          isIpo: isIpoMode
        };
        const editPayload = t.deliveryType === 'Intraday'
          ? { ...basePayload, buyPrice: Number(t.buyPrice), sellPrice: Number(t.sellPrice) }
          : { ...basePayload, price: t.type === 'BUY' ? Number(t.buyPrice) : Number(t.sellPrice) };

        await put(`/transaction/edit/${editTransactionId}`, editPayload);
        if (loadedDraftId && userAccount?._id) {
          deleteDraft(userAccount._id, loadedDraftId);
          setLoadedDraftId(null);
        }
        showSuccessSnackbar('Transaction updated successfully');
        navigate(-1);
      } else {
        // Create mode: one or more transactions, use POST.
        const payload = transactions.map((t) => {
          const basePayload = {
            date: transactionDate.format('YYYY-MM-DD'),
            type: t.type,
            quantity: Number(t.quantity),
            securityId: t.security._id,
            deliveryType: t.deliveryType,
            referenceNumber: referenceNumber,
            dematAccountId: selectedDematAccount,
            transactionCost: t.transactionCost ? Number(t.transactionCost) : 0,
            isIpo: isIpoMode
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
        if (loadedDraftId && userAccount?._id) {
          deleteDraft(userAccount._id, loadedDraftId);
          setLoadedDraftId(null);
        }
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

        // If more parsed contracts are queued from a multi-client upload,
        // re-open the picker so the user can load the next one.
        if (pendingContracts.length > 0) {
          setPickerOpen(true);
        }
      }
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
            {isEditMode ? 'Edit Transaction' : `Add ${isIpoMode ? 'IPO ' : ''}Transactions`}
          </Typography>
        }
        action={
          !isEditMode && !isIpoMode ? (
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={handleUploadContract}
            >
              Upload Contract
            </Button>
          ) : null
        }
      />
      <input
        type="file"
        accept="application/pdf,.pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
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
                {transactions.map((transaction, index) => (
                  <TableRow key={transaction.id} hover sx={{ backgroundColor: index % 2 === 1 ? 'rgba(0, 0, 0, 0.02)' : 'inherit' }}>
                    <TableCell sx={{ width: '12%' }}>
                      <TextField
                        select
                        size="small"
                        value={transaction.deliveryType}
                        onChange={(e) => handleTransactionChange(transaction.id, 'deliveryType', e.target.value)}
                        fullWidth
                        required
                        disabled={isIpoMode}
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
                        disabled={transaction.deliveryType === 'Intraday' || isIpoMode}
                      >
                        {transactionTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell sx={{ width: '22%' }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Box sx={{ flex: 1 }}>
                          <SecurityAutocomplete
                            value={transaction.security}
                            onChange={(newValue) => {
                              handleTransactionChange(transaction.id, 'security', newValue);
                            }}
                            size="small"
                            required={true}
                            fullWidth={true}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          title="Create new security"
                          onClick={() => setQuickCreateForRow(transaction.id)}
                        >
                          <AddCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
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
                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
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
                        slotProps={{ htmlInput: { min: 0, step: "any" } }}
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
                        slotProps={{ htmlInput: { min: 0, step: "any" } }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: '8%' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={transaction.transactionCost}
                        onChange={(e) => handleTransactionChange(transaction.id, 'transactionCost', e.target.value)}
                        fullWidth
                        slotProps={{ htmlInput: { step: "any" } }}
                        disabled={isIpoMode}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="h4">Total amount: {formatCurrency(totalAmount)}</Typography>
            </div>
            {!isEditMode && (
              <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={handleAddTransaction} size="medium" fullWidth>
                Add Transaction
              </Button>
            )}
            {!isIpoMode && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<BookmarkAddOutlinedIcon />}
                onClick={handleSaveDraft}
                size="medium"
                fullWidth
              >
                {loadedDraftId ? 'Update Draft' : 'Save as Draft'}
              </Button>
            )}
            <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} size="large" fullWidth>
              {isEditMode ? 'Update Transaction' : `Save All Transactions (${transactions.length})`}
            </Button>
          </Box>
        </form>
      </CardContent>

      <ContractPickerDialog
        open={pickerOpen && pendingContracts.length > 0}
        contracts={pendingContracts}
        onPick={handlePickContract}
        onClose={() => setPickerOpen(false)}
        title={
          pendingContracts.length === 1
            ? 'Load the next contract from the upload?'
            : `Pick a contract to load (${pendingContracts.length} remaining)`
        }
      />

      <QuickCreateSecurityDialog
        open={quickCreateForRow !== null}
        initialName=""
        initialIsin=""
        onClose={() => setQuickCreateForRow(null)}
        onCreated={(sec) => {
          if (quickCreateForRow !== null) {
            handleTransactionChange(quickCreateForRow, 'security', sec);
          }
        }}
      />
    </MainCard>
  );
};

export default AddTransaction;
