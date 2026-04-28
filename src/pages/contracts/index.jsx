import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  IconButton,
  Pagination,
  Tooltip,
  Button
} from '@mui/material';
import {
  ReceiptLong as ReceiptLongIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Delete as DeleteIcon,
  Add
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { get, del } from 'utils/apiUtil';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate } from 'utils/formatDate';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { showErrorSnackbar } from 'store/utils';
import SecurityAutocomplete from 'components/SecurityAutocomplete';
import { getTransactionTypeColor } from '../securities/utils/helpers';
import { fetchContracts } from './services/contractsService';

const CONTRACTS_LIMIT = 50;
const REF_DEBOUNCE_MS = 350;

const Contracts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userAccount = useSelector((state) => state.app.currentUserAccount);
  const financialYear = useSelector((state) => state.app.financialYear);

  const [contracts, setContracts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, count: 0, limit: CONTRACTS_LIMIT, pageNo: 1 });
  const [page, setPage] = useState(1);

  const [dematAccounts, setDematAccounts] = useState([]);
  const [selectedDematAccount, setSelectedDematAccount] = useState('');
  const [selectedSecurity, setSelectedSecurity] = useState(null);
  const [refNumberInput, setRefNumberInput] = useState('');
  const [refNumberQuery, setRefNumberQuery] = useState('');

  const [expandedKey, setExpandedKey] = useState(null);
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const tableContainerRef = useRef(null);
  const rowRefs = useRef([]);

  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / CONTRACTS_LIMIT));

  const getContractKey = (contract) => `${contract.referenceNumber}::${contract.dematAccountId?._id || ''}`;

  const toggleExpand = useCallback((key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const summary = useMemo(() => {
    const totalNetBuy = contracts.reduce((sum, c) => sum + (c.netBuyAmount || 0), 0);
    const totalNetSell = contracts.reduce((sum, c) => sum + (c.netSellAmount || 0), 0);
    const totalCost = contracts.reduce((sum, c) => sum + (c.totalCost || 0), 0);
    return {
      totalContracts: pagination.total || 0,
      totalNetBuy,
      totalNetSell,
      totalCost
    };
  }, [contracts, pagination.total]);

  // Debounce reference-number text input
  useEffect(() => {
    const handle = setTimeout(() => {
      setRefNumberQuery(refNumberInput.trim());
      setPage(1);
    }, REF_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [refNumberInput]);

  // Keyboard navigation: Alt+ArrowUp/Down move active row, Enter expands,
  // Alt+ArrowLeft/Right paginate.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (activeRowIndex !== -1 && contracts.length > 0) {
          toggleExpand(getContractKey(contracts[activeRowIndex]));
        }
        return;
      }

      if (event.altKey && event.key === 'ArrowLeft' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (page > 1) setPage(page - 1);
        return;
      }
      if (event.altKey && event.key === 'ArrowRight' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (page < totalPages) setPage(page + 1);
        return;
      }

      if (contracts.length === 0) return;

      if (event.altKey && event.key === 'ArrowDown' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex < contracts.length - 1 ? prevIndex + 1 : prevIndex;
          rowRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return newIndex;
        });
      } else if (event.altKey && event.key === 'ArrowUp' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex > 0 ? prevIndex - 1 : 0;
          rowRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return newIndex;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contracts, activeRowIndex, page, totalPages, toggleExpand]);

  // Reset row tracking on data change
  useEffect(() => {
    setActiveRowIndex(-1);
    rowRefs.current = [];
  }, [contracts]);

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

  const onDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      dispatch(showLoader());
      try {
        await del(`/transaction/delete/${transactionId}`);
        loadContracts();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        showErrorSnackbar(error.message || 'Failed to delete transaction');
      } finally {
        dispatch(hideLoader());
      }
    }
  };

  const loadContracts = async () => {
    if (!selectedDematAccount) return;

    dispatch(showLoader());
    try {
      const data = await fetchContracts({
        limit: CONTRACTS_LIMIT,
        pageNo: page,
        dematAccountId: selectedDematAccount,
        securityId: selectedSecurity?._id || null,
        referenceNumber: refNumberQuery,
        financialYearId: financialYear?._id || ''
      });

      setContracts(data?.contracts || []);
      setPagination(data?.pagination || { total: 0, count: 0, limit: CONTRACTS_LIMIT, pageNo: page });
      setExpandedKey(null);
    } catch (error) {
      showErrorSnackbar(error.message || 'Failed to load contracts. Please try again.');
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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDematAccount, selectedSecurity, financialYear]);

  useEffect(() => {
    if (selectedDematAccount) {
      loadContracts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDematAccount, selectedSecurity, refNumberQuery, financialYear, page]);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    Total Contracts
                  </Typography>
                  <Typography variant="h4">{summary.totalContracts}</Typography>
                </Box>
                <ReceiptLongIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Net Buy (page)
              </Typography>
              <Typography variant="h5">{formatCurrency(summary.totalNetBuy)}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Net Sell (page)
              </Typography>
              <Typography variant="h5">{formatCurrency(summary.totalNetSell)}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Total Cost (page)
              </Typography>
              <Typography variant="h5">{formatCurrency(summary.totalCost)}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          sx={{ bgcolor: '#FFD700', color: '#000', '&:hover': { bgcolor: '#FFC700' } }}
          onClick={() => navigate('/ipo')}
          startIcon={<Add />}
        >
          IPO
        </Button>
        <Tooltip title="Add Transaction (⌥N)" arrow>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/add-transaction')}>
            Add Transaction
          </Button>
        </Tooltip>
      </Box>

      <Card>
        <CardHeader title="Contracts" subheader="Trades grouped by reference number" />
        <Divider />

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

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Reference No"
                value={refNumberInput}
                onChange={(e) => setRefNumberInput(e.target.value)}
                placeholder="Search by reference number"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <TableContainer component={Paper} sx={{ maxHeight: 600 }} ref={tableContainerRef}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={50} />
                <TableCell>
                  <strong>Reference No</strong>
                </TableCell>
                <TableCell>
                  <strong>Date</strong>
                </TableCell>
                <TableCell>
                  <strong>Broker</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Entries</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Securities</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Net Buy</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Net Sell</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Total Cost</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Total Amount</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No contracts found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract, index) => {
                  const key = getContractKey(contract);
                  const brokerName =
                    contract.dematAccountId?.brokerId?.name || contract.dematAccountId?.accountNumber || 'N/A';
                  return (
                    <React.Fragment key={key}>
                      <TableRow
                        hover
                        selected={activeRowIndex === index}
                        sx={{
                          '& > *': { borderBottom: 'unset' },
                          cursor: 'pointer',
                          backgroundColor: index % 2 === 1 ? 'rgba(0, 0, 0, 0.02)' : 'inherit'
                        }}
                        ref={(el) => (rowRefs.current[index] = el)}
                        onClick={() => setActiveRowIndex(index)}
                      >
                        <TableCell>
                          <IconButton size="small" onClick={() => toggleExpand(key)}>
                            {expandedKey === key ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {contract.referenceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(contract.date)}</TableCell>
                        <TableCell>{brokerName}</TableCell>
                        <TableCell align="right">{contract.totalTrades}</TableCell>
                        <TableCell align="right">{contract.securityCount}</TableCell>
                        <TableCell align="right">{formatCurrency(contract.netBuyAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(contract.netSellAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(contract.totalCost)}</TableCell>
                        <TableCell align="right">{formatCurrency(contract.netBuyAmount - contract.netSellAmount + contract.totalCost)}</TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                          <Collapse in={expandedKey === key} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2 }}>
                                Trades ({contract.trades.length})
                              </Typography>
                              <Table size="small" aria-label="contract trades">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: 'background.neutral' }}>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Security</TableCell>
                                    <TableCell align="center">Type</TableCell>
                                    <TableCell align="center">Delivery Type</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Price</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell align="right">Cost</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {contract.trades.map((trade, tIdx) => {
                                    const qty = trade.quantity || 0;
                                    const price = trade.price || 0;
                                    const amount = qty * price;
                                    const type = trade.type?.toUpperCase();
                                    return (
                                      <TableRow
                                        key={trade._id}
                                        sx={{ backgroundColor: tIdx % 2 === 1 ? 'rgba(0, 0, 0, 0.02)' : 'inherit' }}
                                      >
                                        <TableCell>{formatDate(trade.date)}</TableCell>
                                        <TableCell>
                                          {trade.securityId?.name || trade.securityId?.symbol || '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                          <Chip label={type} color={getTransactionTypeColor(type)} size="small" />
                                        </TableCell>
                                        <TableCell align="center">{trade.deliveryType}</TableCell>
                                        <TableCell align="right">{qty}</TableCell>
                                        <TableCell align="right">{formatCurrency(price)}</TableCell>
                                        <TableCell align="right">{formatCurrency(amount)}</TableCell>
                                        <TableCell align="right">{formatCurrency(trade.transactionCost || 0)}</TableCell>
                                        <TableCell align="center">
                                          <Tooltip title="Delete transaction" arrow>
                                            <IconButton
                                              size="small"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteTransaction(trade._id);
                                              }}
                                            >
                                              <DeleteIcon fontSize="small" color="error" />
                                            </IconButton>
                                          </Tooltip>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box width="100%" sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} />
      </Box>
    </Box>
  );
};

export default Contracts;
