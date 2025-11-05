import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  TextField,
  Typography,
  Divider,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Collapse,
  IconButton
} from '@mui/material';
import {
  ShowChart as ShowChartIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate, formatDateForFileName } from 'utils/formatDate';
import { useDispatch, useSelector } from 'react-redux';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { fetchHoldings, transformHoldingData } from './services/holdingsService';
import { showErrorSnackbar, showSuccessSnackbar } from 'store/utils';
import { get } from 'utils/apiUtil';
import SecurityAutocomplete from 'components/SecurityAutocomplete';
import ExportToExcelButton from 'components/ExportToExcelButton';

// Main component
const Holdings = () => {
  // Redux dispatch and selectors
  const dispatch = useDispatch();
  const userAccount = useSelector((state) => state.app.currentUserAccount);
  
  // Pagination state
  const [limit] = useState(50);
  const [offset] = useState(0);

  // Holdings data from API
  const [holdings, setHoldings] = useState([]);

  // Filtered holdings
  const [filteredHoldings, setFilteredHoldings] = useState([]);

  // Expanded rows state
  const [expandedSecurities, setExpandedSecurities] = useState({});

  // Demat account state
  const [dematAccounts, setDematAccounts] = useState([]);
  const [selectedDematAccount, setSelectedDematAccount] = useState('');
  
  // Security filter state
  const [selectedSecurity, setSelectedSecurity] = useState(null);

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

  // Fetch demat accounts
  const fetchDematAccounts = async () => {
    try {
      const response = await get(`/demat-account/get-all?userAccountId=${userAccount._id}`);
      setDematAccounts(response.dematAccounts || []);
      if (response.dematAccounts && response.dematAccounts.length > 0) {
        setSelectedDematAccount(response.dematAccounts[0]._id);
      }
    } catch (error) {
      console.error('Error fetching demat accounts:', error);
      showErrorSnackbar('Failed to fetch demat accounts');
    }
  };

  // Load holdings from API
  const loadHoldings = async () => {
    if (!selectedDematAccount) {
      return;
    }
    
    dispatch(showLoader());
    try {
      const securityId = selectedSecurity?._id || null;
      const data = await fetchHoldings(limit, offset, selectedDematAccount, securityId);
      
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

  // Fetch demat accounts on component mount
  useEffect(() => {
    if (userAccount && userAccount._id) {
      fetchDematAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAccount]);

  // Load holdings when demat account, security or pagination changes
  useEffect(() => {
    if (selectedDematAccount) {
      loadHoldings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDematAccount, selectedSecurity, limit, offset]);

  // Prepare export data
  const getExportData = () => {
    // Flatten all holdings from grouped data
    const allHoldings = groupedHoldings.flatMap((group) => group.holdings);
    
    return allHoldings.map((holding) => ({
      'Buy Date': formatDate(holding.buyDate),
      Security: holding.securityName,
      Type: holding.securityType,
      Quantity: holding.quantity,
      'Buy Price': holding.buyPrice.toFixed(2),
      Investment: holding.totalInvestment.toFixed(2),
      Broker: holding.broker || 'N/A'
    }));
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    Total Investment
                  </Typography>
                  <Typography variant="h4">{formatCurrency(summary.totalInvestment)}</Typography>
                </Box>
                <ShowChartIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
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
          subheader="View all of your holdings as of now"
          action={
            <ExportToExcelButton
              data={getExportData()}
              filename={`holdings_${formatDateForFileName()}`}
              title="Export Holdings to Excel"
            />
          }
        />
        <Divider />

        {/* Filters */}
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Demat Account"
                value={selectedDematAccount}
                onChange={(e) => setSelectedDematAccount(e.target.value)}
              >
                {dematAccounts.length === 0 && <MenuItem value="">No Demat Accounts</MenuItem>}
                {dematAccounts.map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.brokerId?.name || account.accountNumber || account._id}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <SecurityAutocomplete
                value={selectedSecurity}
                onChange={(newValue) => {
                  setSelectedSecurity(newValue);
                }}
                label="Security (Optional)"
                size="small"
                required={false}
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>

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
                      No holdings found. Buy securities to see them here.
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
