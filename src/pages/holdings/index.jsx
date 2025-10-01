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
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate, formatDateForFileName } from 'utils/formatDate';
import { useAppDispatch } from 'store/hooks';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';

// Main component
const Holdings = () => {
  // Redux dispatch
  const dispatch = useAppDispatch();

  // State management
  const [searchSecurity, setSearchSecurity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  // Mock data - Replace with API call (UnMatchedRecords from DB)
  const [holdings, setHoldings] = useState([
    {
      id: 1,
      buyDate: '2024-01-15',
      securityName: 'Reliance Industries',
      securityType: 'EQUITY',
      quantity: 50,
      buyPrice: 2450.5,
      currentPrice: 2890.75,
      totalInvestment: 122525,
      currentValue: 144537.5,
      unrealizedPnL: 22012.5,
      pnlPercentage: 17.96
    },
    {
      id: 2,
      buyDate: '2023-11-22',
      securityName: 'TCS',
      securityType: 'EQUITY',
      quantity: 30,
      buyPrice: 3500.0,
      currentPrice: 4100.5,
      totalInvestment: 105000,
      currentValue: 123015,
      unrealizedPnL: 18015,
      pnlPercentage: 17.16
    },
    {
      id: 3,
      buyDate: '2024-03-10',
      securityName: 'Infosys',
      securityType: 'EQUITY',
      quantity: 100,
      buyPrice: 1450.25,
      currentPrice: 1380.0,
      totalInvestment: 145025,
      currentValue: 138000,
      unrealizedPnL: -7025,
      pnlPercentage: -4.84
    },
    {
      id: 4,
      buyDate: '2023-08-05',
      securityName: 'HDFC Bank',
      securityType: 'EQUITY',
      quantity: 75,
      buyPrice: 1580.5,
      currentPrice: 1720.75,
      totalInvestment: 118537.5,
      currentValue: 129056.25,
      unrealizedPnL: 10518.75,
      pnlPercentage: 8.87
    },
    {
      id: 5,
      buyDate: '2024-05-18',
      securityName: 'Wipro',
      securityType: 'EQUITY',
      quantity: 150,
      buyPrice: 420.25,
      currentPrice: 395.5,
      totalInvestment: 63037.5,
      currentValue: 59325,
      unrealizedPnL: -3712.5,
      pnlPercentage: -5.89
    },
    {
      id: 6,
      buyDate: '2024-02-28',
      securityName: 'NIFTY 50 CALL Option',
      securityType: 'OPTIONS',
      quantity: 500,
      buyPrice: 125.5,
      currentPrice: 185.75,
      totalInvestment: 62750,
      currentValue: 92875,
      unrealizedPnL: 30125,
      pnlPercentage: 48.01
    }
  ]);

  // Filtered holdings
  const [filteredHoldings, setFilteredHoldings] = useState(holdings);

  // Calculate summary statistics
  const calculateSummary = (records) => {
    const totalInvestment = records.reduce((sum, r) => sum + r.totalInvestment, 0);
    const currentValue = records.reduce((sum, r) => sum + r.currentValue, 0);
    const unrealizedPnL = currentValue - totalInvestment;
    const pnlPercentage = totalInvestment > 0 ? (unrealizedPnL / totalInvestment) * 100 : 0;
    const profitableHoldings = records.filter((r) => r.unrealizedPnL > 0).length;
    const losingHoldings = records.filter((r) => r.unrealizedPnL < 0).length;

    return {
      totalInvestment,
      currentValue,
      unrealizedPnL,
      pnlPercentage,
      profitableHoldings,
      losingHoldings,
      totalHoldings: records.length
    };
  };

  const summary = calculateSummary(filteredHoldings);

  // Search function
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (searchSecurity) {
        const filtered = holdings.filter((holding) => holding.securityName.toLowerCase().includes(searchSecurity.toLowerCase()));
        setFilteredHoldings(filtered);
        setAlertMessage(`Found ${filtered.length} holdings matching "${searchSecurity}"`);
      } else {
        setFilteredHoldings(holdings);
        setAlertMessage('All holdings loaded');
      }
      setAlertSeverity('success');
    } catch (error) {
      setAlertMessage('Search failed. Please try again.');
      setAlertSeverity('error');
    } finally {
      setIsSearching(false);
    }
  };

  // Export to Excel function
  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const exportData = filteredHoldings.map((holding) => ({
        'Buy Date': formatDate(holding.buyDate),
        Security: holding.securityName,
        Type: holding.securityType,
        Quantity: holding.quantity,
        'Buy Price': holding.buyPrice.toFixed(2),
        'Current Price': holding.currentPrice.toFixed(2),
        Investment: holding.totalInvestment.toFixed(2),
        'Current Value': holding.currentValue.toFixed(2),
        'Unrealized P&L': holding.unrealizedPnL.toFixed(2),
        'P&L %': holding.pnlPercentage.toFixed(2)
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
      link.setAttribute('download', `holdings_${formatDateForFileName()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAlertMessage('Holdings exported successfully!');
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
          <Card>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    Total Investment
                  </Typography>
                  <Typography variant="h4">{formatCurrency(summary.totalInvestment)}</Typography>
                </Box>
                <ShowChartIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    Current Value
                  </Typography>
                  <Typography variant="h4">{formatCurrency(summary.currentValue)}</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: summary.unrealizedPnL >= 0 ? 'success.lighter' : 'error.lighter' }}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color={summary.unrealizedPnL >= 0 ? 'success.darker' : 'error.darker'}>
                    Unrealized P&L
                  </Typography>
                  <Typography variant="h4" color={summary.unrealizedPnL >= 0 ? 'success.darker' : 'error.darker'}>
                    {formatCurrency(summary.unrealizedPnL)}
                  </Typography>
                  <Typography variant="body2" color={summary.unrealizedPnL >= 0 ? 'success.dark' : 'error.dark'}>
                    {summary.pnlPercentage >= 0 ? '+' : ''}
                    {summary.pnlPercentage.toFixed(2)}%
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
                Total Holdings
              </Typography>
              <Typography variant="h4">{summary.totalHoldings}</Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="success.main">
                Profitable
              </Typography>
              <Typography variant="h4" color="success.main">
                {summary.profitableHoldings}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="error.main">
                Losing
              </Typography>
              <Typography variant="h4" color="error.main">
                {summary.losingHoldings}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title="Current Holdings"
          subheader="View your unmatched buy transactions and unrealized profit/loss"
          action={
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Search security..."
                value={searchSecurity}
                onChange={(e) => setSearchSecurity(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  minWidth: 250,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </Box>
                  )
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />

              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={isSearching}
                size="small"
                sx={{ minWidth: 100 }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>

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

        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Buy Date</strong>
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
                  <strong>Buy Price</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Current Price</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Investment</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Current Value</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Unrealized P&L</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>P&L %</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHoldings.length > 0 ? (
                filteredHoldings.map((holding) => (
                  <TableRow key={holding.id} hover>
                    <TableCell>{formatDate(holding.buyDate)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {holding.securityName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={holding.securityType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{holding.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(holding.buyPrice)}</TableCell>
                    <TableCell align="right">{formatCurrency(holding.currentPrice)}</TableCell>
                    <TableCell align="right">{formatCurrency(holding.totalInvestment)}</TableCell>
                    <TableCell align="right">{formatCurrency(holding.currentValue)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" sx={{ color: getPnLColor(holding.unrealizedPnL) }}>
                        {formatCurrency(holding.unrealizedPnL)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${holding.pnlPercentage >= 0 ? '+' : ''}${holding.pnlPercentage.toFixed(2)}%`}
                        size="small"
                        color={holding.pnlPercentage >= 0 ? 'success' : 'error'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      {searchSecurity
                        ? `No holdings found matching "${searchSecurity}"`
                        : 'No holdings found. Buy securities to see them here.'}
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

export default Holdings;
