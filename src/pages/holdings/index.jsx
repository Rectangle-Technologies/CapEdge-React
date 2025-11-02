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
  Select,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  ShowChart as ShowChartIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate, formatDateForFileName } from 'utils/formatDate';
import { useAppDispatch } from 'store/hooks';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { fetchHoldings, transformHoldingData } from './services/holdingsService';
import { showErrorSnackbar, showSuccessSnackbar } from 'store/utils';

// Main component
const Holdings = () => {
  // Redux dispatch
  const dispatch = useAppDispatch();

  // State management
  const [searchSecurity, setSearchSecurity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  
  // Pagination state
  const [limit] = useState(50);
  const [offset] = useState(0);

  // Holdings data from API
  const [holdings, setHoldings] = useState([]);

  // Filtered holdings
  const [filteredHoldings, setFilteredHoldings] = useState([]);

  // Expanded rows state
  const [expandedSecurities, setExpandedSecurities] = useState({});

  // Toggle expand/collapse for a security
  const toggleExpand = (securityId) => {
    setExpandedSecurities((prev) => ({
      ...prev,
      [securityId]: !prev[securityId]
    }));
  };

  // Group holdings by security
  const groupHoldingsBySecurity = (holdingsData) => {
    const grouped = {};
    
    holdingsData.forEach((holding) => {
      const key = holding.securityId;
      if (!grouped[key]) {
        grouped[key] = {
          securityId: key,
          securityName: holding.securityName,
          securityType: holding.securityType,
          totalQuantity: 0,
          avgBuyPrice: 0,
          totalInvestment: 0,
          currentValue: 0,
          unrealizedPnL: 0,
          pnlPercentage: 0,
          holdings: []
        };
      }
      
      grouped[key].holdings.push(holding);
      grouped[key].totalQuantity += holding.quantity;
      grouped[key].totalInvestment += holding.totalInvestment;
      grouped[key].currentValue += holding.currentValue;
    });

    // Calculate averages and P&L for each group
    Object.keys(grouped).forEach((key) => {
      const group = grouped[key];
      group.avgBuyPrice = group.totalInvestment / group.totalQuantity;
      group.unrealizedPnL = group.currentValue - group.totalInvestment;
      group.pnlPercentage = group.totalInvestment > 0 ? (group.unrealizedPnL / group.totalInvestment) * 100 : 0;
    });

    return Object.values(grouped);
  };

  // Calculate summary statistics from grouped holdings
  const calculateSummary = (groupedHoldings) => {
    const totalInvestment = groupedHoldings.reduce((sum, r) => sum + r.totalInvestment, 0);
    const currentValue = groupedHoldings.reduce((sum, r) => sum + r.currentValue, 0);
    const unrealizedPnL = currentValue - totalInvestment;
    const pnlPercentage = totalInvestment > 0 ? (unrealizedPnL / totalInvestment) * 100 : 0;
    const profitableHoldings = groupedHoldings.filter((r) => r.unrealizedPnL > 0).length;
    const losingHoldings = groupedHoldings.filter((r) => r.unrealizedPnL < 0).length;

    return {
      totalInvestment,
      currentValue,
      unrealizedPnL,
      pnlPercentage,
      profitableHoldings,
      losingHoldings,
      totalHoldings: groupedHoldings.length
    };
  };

  const groupedHoldings = groupHoldingsBySecurity(filteredHoldings);
  const summary = calculateSummary(groupedHoldings);

  // Load holdings from API
  const loadHoldings = async () => {
    dispatch(showLoader());
    try {
      const data = await fetchHoldings(limit, offset);
      
      if (data && data.holdings) {
        // Transform API data to component format
        const transformedHoldings = data.holdings.map(transformHoldingData);
        setHoldings(transformedHoldings);
        setFilteredHoldings(transformedHoldings);
        
        showSuccessSnackbar('Holdings loaded successfully');
      }
    } catch (error) {
      showErrorSnackbar(error.message || 'Failed to load holdings. Please try again.');
    } finally {
      dispatch(hideLoader());
    }
  };

  // Load holdings on component mount
  useEffect(() => {
    loadHoldings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]);

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
    } catch {
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

      // Flatten all holdings from grouped data
      const allHoldings = groupedHoldings.flatMap((group) => group.holdings);
      
      const exportData = allHoldings.map((holding) => ({
        'Buy Date': formatDate(holding.buyDate),
        Security: holding.securityName,
        Type: holding.securityType,
        Quantity: holding.quantity,
        'Buy Price': holding.buyPrice.toFixed(2),
        'Current Price': holding.currentPrice.toFixed(2),
        Investment: holding.totalInvestment.toFixed(2),
        'Current Value': holding.currentValue.toFixed(2),
        'Unrealized P&L': holding.unrealizedPnL.toFixed(2),
        'P&L %': holding.pnlPercentage.toFixed(2),
        Broker: holding.broker || 'N/A',
        'Demat Account': holding.dematAccountId || 'N/A'
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
    } catch (err) {
      setAlertMessage('Export failed. Please try again.');
      setAlertSeverity('error');
      console.error('Export error:', err);
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

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {alertMessage && (
        <Alert severity={alertSeverity} sx={{ mb: 2 }} onClose={() => setAlertMessage('')}>
          {alertMessage}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={6}>
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

        <Grid item xs={12} sm={6} md={6}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Total Holdings
              </Typography>
              <Typography variant="h4">{summary.totalHoldings}</Typography>
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
                <TableCell width={50} />
                <TableCell>
                  <strong>Security</strong>
                </TableCell>
                <TableCell>
                  <strong>Type</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Total Qty</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Avg Buy Price</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Total Investment</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedHoldings.length > 0 ? (
                groupedHoldings.map((group) => (
                  <>
                    {/* Main row - Aggregated by security */}
                    <TableRow key={group.securityId} hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                      <TableCell>
                        <IconButton size="small" onClick={() => toggleExpand(group.securityId)}>
                          {expandedSecurities[group.securityId] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {group.securityName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={group.securityType} size="small" variant="outlined" color="primary" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {group.totalQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(group.avgBuyPrice)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(group.totalInvestment)}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    {/* Expanded rows - Individual holdings */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={expandedSecurities[group.securityId]} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2 }}>
                              Individual Holdings ({group.holdings.length})
                            </Typography>
                            <Table size="small" aria-label="holdings detail">
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'background.neutral' }}>
                                  <TableCell>Buy Date</TableCell>
                                  <TableCell>Broker</TableCell>
                                  <TableCell align="right">Quantity</TableCell>
                                  <TableCell align="right">Buy Price</TableCell>
                                  <TableCell align="right">Investment</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {group.holdings.map((holding, index) => (
                                  <TableRow key={`${holding.id}-${index}`}>
                                    <TableCell>{formatDate(holding.buyDate)}</TableCell>
                                    <TableCell>{holding.broker || 'N/A'}</TableCell>
                                    <TableCell align="right">{holding.quantity}</TableCell>
                                    <TableCell align="right">{formatCurrency(holding.buyPrice)}</TableCell>
                                    <TableCell align="right">{formatCurrency(holding.totalInvestment)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
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
