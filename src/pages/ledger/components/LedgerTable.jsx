import { Add, Download as DownloadIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardHeader,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useState, useEffect, useRef } from 'react';
import LedgerEntryDialog from './LedgerEntryDialog';
import LedgerRow from './LedgerRow';
import * as yup from 'yup';
import { post } from '../../../utils/apiUtil';
import { showErrorSnackbar, showSuccessSnackbar } from '../../../store/utils';
import { useDispatch } from 'react-redux';
import { showLoader, hideLoader } from '../../../store/slices/loaderSlice';

const LedgerTable = ({
  ledgerEntries,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  exportToExcel,
  selectedDematAccount,
  setSelectedDematAccount,
  dematAccounts,
  fetchLedgerEntries,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const tableContainerRef = useRef(null);
  const rowRefs = useRef([]);
  const dispatch = useDispatch();

  const ledgerEntryValidationSchema = yup.object({
    date: yup
      .mixed()
      .required('Date is required')
      .test('is-valid-date', 'Date must be valid', (value) => {
        return value && dayjs(value).isValid();
      }),
    entryType: yup.string().required('Entry type is required'),
    transactionAmount: yup
      .number()
      .typeError('Amount must be a number')
      .positive('Amount must be positive')
      .required('Amount is required')
  })

  const formik = useFormik({
    initialValues: {
      date: dayjs(),
      entryType: '',
      transactionAmount: ''
    },
    validationSchema: ledgerEntryValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      dispatch(showLoader());
      try {
        const transactionAmount = values.entryType === 'DEBIT' 
          ? -Math.abs(values.transactionAmount)
          : values.transactionAmount;

        const data = await post('/ledger/add', {
          date: values.date.format('YYYY-MM-DD'),
          transactionAmount: transactionAmount,
          dematAccountId: selectedDematAccount._id
        });
        // After successful submission:
        resetForm();
        setOpenDialog(false);
        fetchLedgerEntries();
        showSuccessSnackbar('Ledger entry added successfully.');
        setSelectedDematAccount({
          ...selectedDematAccount,
          balance: data.latestBalance
        });
      } catch (error) {
        console.error('Error adding ledger entry:', error);
        showErrorSnackbar('Failed to add ledger entry. Please try again.');
      } finally {
        dispatch(hideLoader());
      }
    }
  });

  const handleAddLedgerEntry = () => {
    formik.resetForm();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    formik.resetForm();
    setOpenDialog(false);
  };

  const handleRowToggle = (entryId) => {
    setExpandedRowId(expandedRowId === entryId ? null : entryId);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Handle left/right arrow keys for pagination
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (currentPage > 1) {
          onPageChange(currentPage - 1);
        }
        return;
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1);
        }
        return;
      }

      // Handle Enter key to expand/collapse active row
      if (event.key === 'Enter') {
        event.preventDefault();
        if (activeRowIndex !== -1 && ledgerEntries.length > 0) {
          const entry = ledgerEntries[activeRowIndex];
          const hasTradeTransaction = !!(entry.tradeTransactionId && entry.tradeTransactionId._id);
          if (hasTradeTransaction) {
            handleRowToggle(entry._id);
          }
        }
        return;
      }

      // Handle up/down arrow keys for row navigation
      if (ledgerEntries.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex < ledgerEntries.length - 1 ? prevIndex + 1 : prevIndex;
          // Scroll to the active row
          if (rowRefs.current[newIndex]) {
            rowRefs.current[newIndex].scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest' 
            });
          }
          return newIndex;
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex > 0 ? prevIndex - 1 : 0;
          // Scroll to the active row
          if (rowRefs.current[newIndex]) {
            rowRefs.current[newIndex].scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest' 
            });
          }
          return newIndex;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ledgerEntries, currentPage, totalPages, onPageChange, activeRowIndex, expandedRowId]);

  // Reset active row when ledger entries change
  useEffect(() => {
    setActiveRowIndex(-1);
    rowRefs.current = [];
  }, [ledgerEntries]);

  const getTransactionColor = (type) => {
    switch (type) {
      case 'BUY':
        return 'error';
      case 'SELL':
        return 'success';
      case 'CREDIT':
        return 'info';
      case 'DEBIT':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Card sx={{ mt: 4 }}>
        <CardHeader
          title="Ledger"
          subheader="View all financial transactions across demat accounts"
          action={
            <Grid container spacing={2} alignItems="center">
              <Grid>
                <IconButton
                  onClick={exportToExcel}
                  color="primary"
                  title="Export to Excel"
                  sx={{
                    border: '1px solid',
                    borderColor: 'primary.main',
                    borderRadius: 1
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Grid>
              <Grid>
                <Button variant='contained' startIcon={<Add />} onClick={handleAddLedgerEntry}>Add Ledger Entry</Button>
              </Grid>
            </Grid>
          }
        />
        <Divider />

        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth sx={{ minWidth: 200 }}>
                  <InputLabel>Demat Account</InputLabel>
                  <Select
                    value={selectedDematAccount?._id || ''}
                    onChange={(e) => {
                      const selectedAccount = dematAccounts.find(account => account._id === e.target.value);
                      setSelectedDematAccount(selectedAccount || null);
                    }}
                    label="Demat Account"
                    fullWidth
                  >
                    {dematAccounts.length === 0 && (<MenuItem value="">No Demat Accounts</MenuItem>)}
                    {dematAccounts.map((account) => (
                      <MenuItem key={account._id} value={account._id}>
                        {account.brokerId.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="Start Date"
                  value={startDate ? dayjs(startDate) : null}
                  format="DD/MM/YYYY"
                  onChange={(newValue) => {
                    setStartDate(newValue);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="End Date"
                  value={endDate ? dayjs(endDate) : null}
                  format="DD/MM/YYYY"
                  onChange={(newValue) => {
                    setEndDate(newValue);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Box>

        <Divider />

        <TableContainer component={Paper} ref={tableContainerRef}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60, padding: '8px 16px 8px 16px' }} />
                <TableCell sx={{ padding: '8px 16px 8px 16px' }}>
                  <strong>Date</strong>
                </TableCell>
                <TableCell sx={{ padding: '8px 16px 8px 16px' }}>
                  <strong>Type</strong>
                </TableCell>
                <TableCell align="right" sx={{ padding: '8px 16px 8px 16px' }}>
                  <strong>Credit</strong>
                </TableCell>
                <TableCell align="right" sx={{ padding: '8px 16px 8px 16px' }}>
                  <strong>Debit</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerEntries.length > 0 ? (
                ledgerEntries.map((entry, index) => (
                  <LedgerRow
                    key={entry._id}
                    entry={entry}
                    isExpanded={expandedRowId === entry._id}
                    onToggleExpand={handleRowToggle}
                    getTransactionColor={getTransactionColor}
                    isActive={activeRowIndex === index}
                    onClick={() => setActiveRowIndex(index)}
                    rowRef={(el) => (rowRefs.current[index] = el)}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No ledger entries found. Adjust filters or check back later.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      <LedgerEntryDialog
        open={openDialog}
        formik={formik}
        onClose={handleCloseDialog}
      />
    </>
  );
};

export default LedgerTable;
