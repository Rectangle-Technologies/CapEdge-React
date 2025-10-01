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
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate, formatDateForFileName } from 'utils/formatDate';
import { useAppDispatch } from 'store/hooks';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';

// Capital gain types
const CAPITAL_GAIN_TYPES = ['STCG', 'LTCG'];

// Main component
const ProfitAndLoss = () => {
  // Redux dispatch
  const dispatch = useAppDispatch();

  // State management
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCapitalGainType, setSelectedCapitalGainType] = useState('ALL');
  const [isSearching, setIsSearching] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  // Mock data - Replace with API call
  const [pnlRecords, setPnlRecords] = useState([
    {
      id: 1,
      buyDate: '2024-01-15',
      sellDate: '2024-06-20',
      securityName: 'Reliance Industries',
      quantity: 100,
      buyPrice: 2450.5,
      sellPrice: 2890.75,
      profitAndLoss: 44025,
      capitalGainType: 'STCG',
      deliveryType: 'Delivery'
    },
    {
      id: 2,
      buyDate: '2023-03-10',
      sellDate: '2024-08-15',
      securityName: 'TCS',
      quantity: 50,
      buyPrice: 3200.0,
      sellPrice: 4100.5,
      profitAndLoss: 45025,
      capitalGainType: 'LTCG',
      deliveryType: 'Delivery'
    },
    {
      id: 3,
      buyDate: '2024-05-22',
      sellDate: '2024-09-10',
      securityName: 'Infosys',
      quantity: 75,
      buyPrice: 1450.25,
      sellPrice: 1380.0,
      profitAndLoss: -5268.75,
      capitalGainType: 'STCG',
      deliveryType: 'Delivery'
    },
    {
      id: 4,
      buyDate: '2023-01-08',
      sellDate: '2024-07-25',
      securityName: 'HDFC Bank',
      quantity: 120,
      buyPrice: 1580.5,
      sellPrice: 1720.75,
      profitAndLoss: 16830,
      capitalGainType: 'LTCG',
      deliveryType: 'Delivery'
    },
    {
      id: 5,
      buyDate: '2024-04-12',
      sellDate: '2024-08-30',
      securityName: 'Wipro',
      quantity: 200,
      buyPrice: 420.25,
      sellPrice: 395.5,
      profitAndLoss: -4950,
      capitalGainType: 'STCG',
      deliveryType: 'Intraday'
    }
  ]);

  // Filtered records based on search criteria
  const [filteredRecords, setFilteredRecords] = useState(pnlRecords);

  // Calculate summary statistics
  const calculateSummary = (records) => {
    const totalProfit = records.filter((r) => r.profitAndLoss > 0).reduce((sum, r) => sum + r.profitAndLoss, 0);
    const totalLoss = records.filter((r) => r.profitAndLoss < 0).reduce((sum, r) => sum + Math.abs(r.profitAndLoss), 0);
    const netProfitLoss = totalProfit - totalLoss;
    const stcg = records.filter((r) => r.capitalGainType === 'STCG').reduce((sum, r) => sum + r.profitAndLoss, 0);
    const ltcg = records.filter((r) => r.capitalGainType === 'LTCG').reduce((sum, r) => sum + r.profitAndLoss, 0);

    return {
      totalProfit,
      totalLoss,
      netProfitLoss,
      stcg,
      ltcg,
      totalTrades: records.length
    };
  };

  const summary = calculateSummary(filteredRecords);

  // Search function
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      let filtered = [...pnlRecords];

      // Filter by date range
      if (startDate) {
        filtered = filtered.filter((record) => new Date(record.sellDate) >= new Date(startDate));
      }
      if (endDate) {
        filtered = filtered.filter((record) => new Date(record.sellDate) <= new Date(endDate));
      }

      // Filter by capital gain type
      if (selectedCapitalGainType !== 'ALL') {
        filtered = filtered.filter((record) => record.capitalGainType === selectedCapitalGainType);
      }

      setFilteredRecords(filtered);
      setAlertMessage(`Found ${filtered.length} P&L records`);
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
    setSelectedCapitalGainType('ALL');
    setFilteredRecords(pnlRecords);
    setAlertMessage('Filters reset');
    setAlertSeverity('info');
  };

  // Export to Excel function
  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const exportData = filteredRecords.map((record) => ({
        'Buy Date': formatDate(record.buyDate),
        'Sell Date': formatDate(record.sellDate),
        Security: record.securityName,
        Quantity: record.quantity,
        'Buy Price': record.buyPrice.toFixed(2),
        'Sell Price': record.sellPrice.toFixed(2),
        'P&L': record.profitAndLoss.toFixed(2),
        'Gain Type': record.capitalGainType,
        'Delivery Type': record.deliveryType
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
      link.setAttribute('download', `pnl_report_${formatDateForFileName()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAlertMessage('P&L report exported successfully!');
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

  // Get color based on P&L value
  const getPnLColor = (value) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.secondary';
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
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'success.lighter' }}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="success.darker">
                    Total Profit
                  </Typography>
                  <Typography variant="h4" color="success.darker">
                    {formatCurrency(summary.totalProfit)}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.dark' }} />
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'error.lighter' }}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="error.darker">
                    Total Loss
                  </Typography>
                  <Typography variant="h4" color="error.darker">
                    {formatCurrency(summary.totalLoss)}
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 40, color: 'error.dark' }} />
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: summary.netProfitLoss >= 0 ? 'primary.lighter' : 'warning.lighter' }}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color={summary.netProfitLoss >= 0 ? 'primary.darker' : 'warning.darker'}>
                    Net P&L
                  </Typography>
                  <Typography variant="h4" color={summary.netProfitLoss >= 0 ? 'primary.darker' : 'warning.darker'}>
                    {formatCurrency(summary.netProfitLoss)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="text.secondary">
                STCG
              </Typography>
              <Typography variant="h4" color={getPnLColor(summary.stcg)}>
                {formatCurrency(summary.stcg)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="text.secondary">
                LTCG
              </Typography>
              <Typography variant="h4" color={getPnLColor(summary.ltcg)}>
                {formatCurrency(summary.ltcg)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Total Trades
              </Typography>
              <Typography variant="h4">{summary.totalTrades}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title="Profit & Loss Report"
          subheader="View detailed profit and loss from matched transactions"
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
                <InputLabel>Gain Type</InputLabel>
                <Select value={selectedCapitalGainType} onChange={(e) => setSelectedCapitalGainType(e.target.value)} label="Gain Type">
                  <MenuItem value="ALL">All Types</MenuItem>
                  <MenuItem value="STCG">STCG</MenuItem>
                  <MenuItem value="LTCG">LTCG</MenuItem>
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
                  <strong>Buy Date</strong>
                </TableCell>
                <TableCell>
                  <strong>Sell Date</strong>
                </TableCell>
                <TableCell>
                  <strong>Security</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Qty</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Buy Price</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Sell Price</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>P&L</strong>
                </TableCell>
                <TableCell>
                  <strong>Gain Type</strong>
                </TableCell>
                <TableCell>
                  <strong>Delivery Type</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>{formatDate(record.buyDate)}</TableCell>
                    <TableCell>{formatDate(record.sellDate)}</TableCell>
                    <TableCell>{record.securityName}</TableCell>
                    <TableCell align="right">{record.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(record.buyPrice)}</TableCell>
                    <TableCell align="right">{formatCurrency(record.sellPrice)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" sx={{ color: getPnLColor(record.profitAndLoss) }}>
                        {formatCurrency(record.profitAndLoss)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={record.capitalGainType} size="small" color={record.capitalGainType === 'LTCG' ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={record.deliveryType} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No P&L records found. Adjust filters or check back later.
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

export default ProfitAndLoss;
