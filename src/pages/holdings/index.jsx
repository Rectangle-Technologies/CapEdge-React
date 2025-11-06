import React, { useState, useEffect } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'utils/apiUtil';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate, formatDateForFileName } from 'utils/formatDate';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { showErrorSnackbar } from 'store/utils';
import { fetchHoldings, transformHoldingData } from './services/holdingsService';
import SecurityAutocomplete from 'components/SecurityAutocomplete';
import ExportToExcelButton from 'components/ExportToExcelButton';

const HOLDINGS_LIMIT = 50;

const Holdings = () => {
  const dispatch = useDispatch();
  const userAccount = useSelector((state) => state.app.currentUserAccount);
  
  const [holdings, setHoldings] = useState([]);
  const [expandedSecurity, setExpandedSecurity] = useState(null);
  const [dematAccounts, setDematAccounts] = useState([]);
  const [selectedDematAccount, setSelectedDematAccount] = useState('');
  const [selectedSecurity, setSelectedSecurity] = useState(null);

  const toggleExpand = (securityId) => {
    setExpandedSecurity((prev) => (prev === securityId ? null : securityId));
  };

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
          totalInvestment: 0,
          holdings: []
        };
      }
      
      grouped[key].holdings.push(holding);
      grouped[key].totalQuantity += holding.quantity;
      grouped[key].totalInvestment += holding.totalInvestment;
    });

    // Calculate average buy price for each group
    Object.values(grouped).forEach((group) => {
      group.avgBuyPrice = group.totalQuantity > 0 ? group.totalInvestment / group.totalQuantity : 0;
    });

    return Object.values(grouped);
  };

  const calculateSummary = (groupedHoldings) => {
    const totalInvestment = groupedHoldings.reduce((sum, group) => sum + group.totalInvestment, 0);
    const totalHoldings = groupedHoldings.length;

    return { totalInvestment, totalHoldings };
  };

  const groupedHoldings = groupHoldingsBySecurity(holdings);
  const summary = calculateSummary(groupedHoldings);

  const fetchDematAccounts = async () => {
    try {
      const response = await get(`/demat-account/get-all?userAccountId=${userAccount._id}`);
      const accounts = response.dematAccounts || [];
      
      setDematAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedDematAccount(accounts[0]._id);
      }
    } catch (error) {
      console.error('Error fetching demat accounts:', error);
      showErrorSnackbar('Failed to fetch demat accounts');
    }
  };

  const loadHoldings = async () => {
    if (!selectedDematAccount) return;
    
    dispatch(showLoader());
    try {
      const securityId = selectedSecurity?._id || null;
      const data = await fetchHoldings(HOLDINGS_LIMIT, 0, selectedDematAccount, securityId);
      
      if (data?.holdings) {
        const transformedHoldings = data.holdings.map(transformHoldingData);
        setHoldings(transformedHoldings);      
      }
    } catch (error) {
      showErrorSnackbar(error.message || 'Failed to load holdings. Please try again.');
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    if (userAccount?._id) {
      fetchDematAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAccount]);

  useEffect(() => {
    if (selectedDematAccount) {
      loadHoldings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDematAccount, selectedSecurity]);

  const getExportData = () => {
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                label="Demat Account"
                value={selectedDematAccount}
                onChange={(e) => setSelectedDematAccount(e.target.value)}
              >
                {dematAccounts.length === 0 ? (
                  <MenuItem value="">No Demat Accounts</MenuItem>
                ) : (
                  dematAccounts.map((account) => (
                    <MenuItem key={account._id} value={account._id}>
                      {account.brokerId?.name || account.accountNumber || account._id}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <SecurityAutocomplete
                value={selectedSecurity}
                onChange={setSelectedSecurity}
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
              {groupedHoldings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No holdings found. Buy securities to see them here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                groupedHoldings.map((group) => (
                  <React.Fragment key={group.securityId}>
                    {/* Main row - Aggregated by security */}
                    <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                      <TableCell>
                        <IconButton size="small" onClick={() => toggleExpand(group.securityId)}>
                          {expandedSecurity === group.securityId ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
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
                        <Collapse in={expandedSecurity === group.securityId} timeout="auto" unmountOnExit>
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
                                {group.holdings.map((holding) => (
                                  <TableRow key={holding.id}>
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
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default Holdings;
