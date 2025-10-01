import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  TextField,
  Button,
  Typography,
  Divider,
  Alert,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate, formatDateForFileName } from 'utils/formatDate';
import { useAppDispatch } from 'store/hooks';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';

// Main component
const Ledger = () => {
  // Redux dispatch
  const dispatch = useAppDispatch();

  // State management
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDematAccount, setSelectedDematAccount] = useState('ALL');
  const [isSearching, setIsSearching] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  // Mock demat accounts
  const dematAccounts = [
    { id: 1, name: 'Zerodha - 12345678', broker: 'Zerodha' },
    { id: 2, name: 'ICICI Direct - 87654321', broker: 'ICICI Direct' },
    { id: 3, name: 'Angel Broking - 55555555', broker: 'Angel Broking' }
  ];

  // Mock ledger entries - Replace with API call
  const [ledgerEntries, setLedgerEntries] = useState([
    {
      id: 1,
      date: '2024-09-15',
      dematAccountId: 1,
      dematAccountName: 'Zerodha - 12345678',
      tradeTransactionId: 'TXN001',
      securityName: 'Reliance Industries',
      transactionType: 'BUY',
      quantity: 100,
      price: 2450.5,
      transactionAmount: -245050,
      balance: 754950,
      remarks: 'Purchase of equity shares'
    },
    {
      id: 2,
      date: '2024-09-16',
      dematAccountId: 1,
      dematAccountName: 'Zerodha - 12345678',
      tradeTransactionId: 'TXN002',
      securityName: 'TCS',
      transactionType: 'BUY',
      quantity: 50,
      price: 3200.0,
      transactionAmount: -160000,
      balance: 594950,
      remarks: 'Purchase of equity shares'
    },
    {
      id: 3,
      date: '2024-09-18',
      dematAccountId: 1,
      dematAccountName: 'Zerodha - 12345678',
      tradeTransactionId: 'TXN003',
      securityName: 'Reliance Industries',
      transactionType: 'SELL',
      quantity: 50,
      price: 2890.75,
      transactionAmount: 144537.5,
      balance: 739487.5,
      remarks: 'Sale of equity shares'
    },
    {
      id: 4,
      date: '2024-09-20',
      dematAccountId: 2,
      dematAccountName: 'ICICI Direct - 87654321',
      tradeTransactionId: 'TXN004',
      securityName: 'Infosys',
      transactionType: 'BUY',
      quantity: 75,
      price: 1450.25,
      transactionAmount: -108768.75,
      balance: 391231.25,
      remarks: 'Purchase of equity shares'
    },
    {
      id: 5,
      date: '2024-09-22',
      dematAccountId: 2,
      dematAccountName: 'ICICI Direct - 87654321',
      tradeTransactionId: 'TXN005',
      securityName: 'HDFC Bank',
      transactionType: 'BUY',
      quantity: 120,
      price: 1580.5,
      transactionAmount: -189660,
      balance: 201571.25,
      remarks: 'Purchase of equity shares'
    },
    {
      id: 6,
      date: '2024-09-25',
      dematAccountId: 3,
      dematAccountName: 'Angel Broking - 55555555',
      tradeTransactionId: 'TXN006',
      securityName: 'Wipro',
      transactionType: 'BUY',
      quantity: 200,
      price: 420.25,
      transactionAmount: -84050,
      balance: 415950,
      remarks: 'Purchase of equity shares'
    },
    {
      id: 7,
      date: '2024-09-26',
      dematAccountId: 1,
      dematAccountName: 'Zerodha - 12345678',
      tradeTransactionId: 'TXN007',
      securityName: 'Dividend Credit',
      transactionType: 'CREDIT',
      quantity: 0,
      price: 0,
      transactionAmount: 5000,
      balance: 744487.5,
      remarks: 'Dividend received'
    },
    {
      id: 8,
      date: '2024-09-27',
      dematAccountId: 2,
      dematAccountName: 'ICICI Direct - 87654321',
      tradeTransactionId: 'TXN008',
      securityName: 'Infosys',
      transactionType: 'SELL',
      quantity: 75,
      price: 1380.0,
      transactionAmount: 103500,
      balance: 305071.25,
      remarks: 'Sale of equity shares'
    }
  ]);

  // Filtered ledger entries
  const [filteredEntries, setFilteredEntries] = useState(ledgerEntries);

  // Calculate summary statistics
  const calculateSummary = (records) => {
    const totalDebits = records.filter((r) => r.transactionAmount < 0).reduce((sum, r) => sum + Math.abs(r.transactionAmount), 0);
    const totalCredits = records.filter((r) => r.transactionAmount > 0).reduce((sum, r) => sum + r.transactionAmount, 0);
    const netAmount = totalCredits - totalDebits;

    return {
      totalDebits,
      totalCredits,
      netAmount,
      totalTransactions: records.length
    };
  };

  const summary = calculateSummary(filteredEntries);

  // Search function
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      let filtered = [...ledgerEntries];

      // Filter by date range
      if (startDate) {
        filtered = filtered.filter((entry) => new Date(entry.date) >= new Date(startDate));
      }
      if (endDate) {
        filtered = filtered.filter((entry) => new Date(entry.date) <= new Date(endDate));
      }

      // Filter by demat account
      if (selectedDematAccount !== 'ALL') {
        filtered = filtered.filter((entry) => entry.dematAccountId === parseInt(selectedDematAccount));
      }

      setFilteredEntries(filtered);
      setAlertMessage(`Found ${filtered.length} ledger entries`);
      setAlertSeverity('success');
    } catch (error) {
      setAlertMessage('Search failed. Please try again.');
      setAlertSeverity('error');
    } finally {
      setIsSearching(false);
    }
  };

  // Reset filters
  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedDematAccount('ALL');
    setFilteredEntries(ledgerEntries);
    setAlertMessage('Filters reset');
    setAlertSeverity('info');
  };

  // Export to Excel function
  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const exportData = filteredEntries.map((entry) => ({
        Date: formatDate(entry.date),
        'Demat Account': entry.dematAccountName,
        'Transaction ID': entry.tradeTransactionId,
        Security: entry.securityName,
        Type: entry.transactionType,
        Quantity: entry.quantity,
        Price: entry.price.toFixed(2),
        Amount: entry.transactionAmount.toFixed(2),
        Balance: entry.balance.toFixed(2),
        Remarks: entry.remarks
      }));

      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || '';
              return value.toString().includes(',') || value.toString().includes('"') ? `"${value.toString().replace(/"/g, '""')}"` : value;
            })
            .join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ledger_${formatDateForFileName()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAlertMessage('Ledger exported successfully!');
      setAlertSeverity('success');
    } catch (error) {
      setAlertMessage('Export failed. Please try again.');
      setAlertSeverity('error');
    } finally {
      dispatch(hideLoader());
    }
  };

  // Auto-hide alert
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Get transaction type color
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
    <Box sx={{ width: '100%', p: 3 }}>
      {alertMessage && (
        <Alert severity={alertSeverity} sx={{ mb: 2 }} onClose={() => setAlertMessage('')}>
          {alertMessage}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.lighter' }}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="error.darker">
                    Total Debits
                  </Typography>
                  <Typography variant="h4" color="error.darker">
                    {formatCurrency(summary.totalDebits)}
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 40, color: 'error.dark' }} />
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.lighter' }}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="success.darker">
                    Total Credits
                  </Typography>
                  <Typography variant="h4" color="success.darker">
                    {formatCurrency(summary.totalCredits)}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.dark' }} />
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: summary.netAmount >= 0 ? 'primary.lighter' : 'warning.lighter' }}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color={summary.netAmount >= 0 ? 'primary.darker' : 'warning.darker'}>
                    Net Amount
                  </Typography>
                  <Typography variant="h4" color={summary.netAmount >= 0 ? 'primary.darker' : 'warning.darker'}>
                    {formatCurrency(summary.netAmount)}
                  </Typography>
                </Box>
                <AccountBalanceIcon sx={{ fontSize: 40, color: summary.netAmount >= 0 ? 'primary.dark' : 'warning.dark' }} />
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Transactions
              </Typography>
              <Typography variant="h4">{summary.totalTransactions}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title="Ledger"
          subheader="View all financial transactions across demat accounts"
          action={
            <Stack direction="row" spacing={2} alignItems="center">
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
            </Stack>
          }
        />
        <Divider />

        {/* Filters */}
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Demat Account</InputLabel>
                <Select value={selectedDematAccount} onChange={(e) => setSelectedDematAccount(e.target.value)} label="Demat Account">
                  <MenuItem value="ALL">All Accounts</MenuItem>
                  {dematAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleSearch} disabled={isSearching} fullWidth>
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
                <Button variant="outlined" onClick={handleReset}>
                  Reset
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Date</strong>
                </TableCell>
                <TableCell>
                  <strong>Demat Account</strong>
                </TableCell>
                <TableCell>
                  <strong>Transaction ID</strong>
                </TableCell>
                <TableCell>
                  <strong>Security</strong>
                </TableCell>
                <TableCell>
                  <strong>Type</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Qty</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Price</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Amount</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Balance</strong>
                </TableCell>
                <TableCell>
                  <strong>Remarks</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {entry.dematAccountName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {entry.tradeTransactionId}
                      </Typography>
                    </TableCell>
                    <TableCell>{entry.securityName}</TableCell>
                    <TableCell>
                      <Chip label={entry.transactionType} size="small" color={getTransactionColor(entry.transactionType)} />
                    </TableCell>
                    <TableCell align="right">{entry.quantity > 0 ? entry.quantity : '-'}</TableCell>
                    <TableCell align="right">{entry.price > 0 ? formatCurrency(entry.price) : '-'}</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ color: entry.transactionAmount >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {entry.transactionAmount >= 0 ? '+' : ''}
                        {formatCurrency(entry.transactionAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(entry.balance)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }} noWrap>
                        {entry.remarks}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
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
    </Box>
  );
};

export default Ledger;
