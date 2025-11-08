import { Add } from '@mui/icons-material';
import { Box, Button, Card, CardHeader, Chip, Divider, Grid, MenuItem, Pagination, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import SecurityAutocomplete from 'components/SecurityAutocomplete';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { hideLoader, showLoader } from '../../../store/slices/loaderSlice';
import { showErrorSnackbar } from '../../../store/utils';
import { get } from '../../../utils/apiUtil';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getTransactionTypeColor } from '../../securities/utils/helpers';
import { getAllTransactions } from '../../transactions/services/transactionService';
import TransactionsTableHead from './TransactionsTableHead';

const ITEMS_PER_PAGE = 50;

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [dematAccounts, setDematAccounts] = useState([]);
  const [selectedDematAccount, setSelectedDematAccount] = useState('');
  const [selectedSecurity, setSelectedSecurity] = useState(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userAccount = useSelector((state) => state.app.currentUserAccount);
  const financialYear = useSelector((state) => state.app.financialYear);

  // Handle keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Handle Alt+N / Option+N for adding transaction
      if (event.altKey && event.code === 'KeyN' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        navigate('/add-transaction');
        return;
      }

      // Handle Alt+left/right arrow keys for pagination
      if (event.altKey && event.key === 'ArrowLeft' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (page > 1) {
          setPage(page - 1);
        }
      } else if (event.altKey && event.key === 'ArrowRight' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (page < totalPages) {
          setPage(page + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, totalPages, navigate]);

  const fetchDematAccounts = async () => {
    dispatch(showLoader());
    try {
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

  const fetchTransactions = async () => {
    if (!selectedDematAccount) {
      return;
    }
    
    dispatch(showLoader());
    try {
      const securityId = selectedSecurity?._id || null;
      const data = await getAllTransactions(ITEMS_PER_PAGE, page, selectedDematAccount, securityId, financialYear);
      setTransactions(data.transactions || []);
      setTotalPages(Math.ceil(data.pagination.total / ITEMS_PER_PAGE) || 1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showErrorSnackbar('Failed to fetch transactions');
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    if (userAccount && userAccount._id) {
      fetchDematAccounts();
    }
  }, [userAccount]);

  useEffect(() => {
    if (selectedDematAccount) {
      fetchTransactions();
    }
  }, [selectedDematAccount, selectedSecurity, page, financialYear]);

  // Detect platform for keyboard shortcut hint
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutHint = isMac ? '⌥N' : 'Alt+N';

    return (
      <Grid size={12}>
        <Card>
          <CardHeader
            title="All Transactions"
            subheader="View and filter all transactions across demat accounts"
            action={
              <Tooltip title={`Add Transaction (${shortcutHint})`} arrow>
                <Button 
                  variant="contained" 
                  startIcon={<Add />} 
                  onClick={() => navigate('/add-transaction')}
                >
                  Add Transaction
                </Button>
              </Tooltip>
            }
          />
          <Divider />

          {/* Filters */}
          <Box sx={{ p: 2, bgcolor: 'background.default' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  label="Demat Account"
                  value={selectedDematAccount}
                  onChange={(e) => {
                    setSelectedDematAccount(e.target.value);
                    setPage(1); // Reset to first page when changing account
                  }}
                  fullWidth
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
                <SecurityAutocomplete
                  value={selectedSecurity}
                  onChange={(newValue) => {
                    setSelectedSecurity(newValue);
                    setPage(1); // Reset to first page when changing security
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

          <Box>
            <TableContainer
              sx={{
                width: '100%',
                overflowX: 'auto',
                position: 'relative',
                display: 'block',
                maxWidth: '100%',
                '& td, & th': { whiteSpace: 'nowrap' }
              }}
            >
              <Table>
                <TransactionsTableHead />
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                        <Typography variant="h6" color="text.secondary">
                          No transactions found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => {
                      const quantity = transaction.quantity || 0;
                      const price = transaction.price || 0;
                      const amount = quantity * price;
                      const formattedDate = transaction.date 
                        ? new Date(transaction.date).toLocaleDateString('en-GB')
                        : '-';
                      
                      return (
                        <TableRow
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          key={transaction._id}
                        >
                          <TableCell>...{transaction._id?.slice(-8) || '-'}</TableCell>
                          <TableCell>{transaction.referenceNumber || '-'}</TableCell>
                          <TableCell>
                            {transaction.securityId?.name || transaction.securityId?.symbol || '-'}
                          </TableCell>
                          <TableCell align="center">{formattedDate}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={transaction.type}
                              color={getTransactionTypeColor(transaction.type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">{transaction.deliveryType}</TableCell>
                          <TableCell align="right">{quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(price)}</TableCell>
                          <TableCell align="right">{formatCurrency(amount)}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>
        <Box width="100%" sx={{
          mt: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Pagination count={totalPages} page={page} onChange={(_, value) => {
            setPage(value);
          }} />
        </Box>
      </Grid>
    )
  }

  export default TransactionsTable