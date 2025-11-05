import { Box, Chip, Grid, MenuItem, Pagination, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';
import MainCard from 'components/MainCard';
import SecurityAutocomplete from 'components/SecurityAutocomplete';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoader, showLoader } from '../../../store/slices/loaderSlice';
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
  const userAccount = useSelector((state) => state.app.currentUserAccount);

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
    }
  };

  const fetchTransactions = async () => {
    if (!selectedDematAccount) {
      return;
    }
    
    dispatch(showLoader());
    try {
      const securityId = selectedSecurity?._id || null;
      const data = await getAllTransactions(ITEMS_PER_PAGE, page, selectedDematAccount, securityId);
      setTransactions(data.transactions || []);
      setTotalPages(Math.ceil(data.pagination.total / ITEMS_PER_PAGE) || 1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Keep existing data on error
    } finally {
      dispatch(hideLoader());
    }
  };

  // Fetch demat accounts on component mount
  useEffect(() => {
    if (userAccount && userAccount._id) {
      fetchDematAccounts();
    }
  }, [userAccount]);

  // Fetch transactions when demat account, security or page changes
  useEffect(() => {
    if (selectedDematAccount) {
      fetchTransactions();
    }
  }, [selectedDematAccount, selectedSecurity, page]);

    return (
      <Grid size={12}>
        <MainCard content={false}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={3}>
                <TextField
                  select
                  size="small"
                  label="Demat Account"
                  value={selectedDematAccount}
                  onChange={(e) => {
                    setSelectedDematAccount(e.target.value);
                    setPage(1); // Reset to first page when changing account
                  }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.paper'
                    }
                  }}
                >
                  {dematAccounts.length === 0 && <MenuItem value="">No Demat Accounts</MenuItem>}
                  {dematAccounts.map((account) => (
                    <MenuItem key={account._id} value={account._id}>
                      {account.brokerId?.name || account.accountNumber || account._id}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={4}>
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.paper'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
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
              <Table aria-labelledby="tableTitle">
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
                    transactions.map((transaction, index) => {
                      const amount = transaction.quantity * (transaction.price || 0);
                      return (
                        <TableRow
                          hover
                          role="checkbox"
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          key={transaction._id}
                        >
                          <TableCell>{transaction._id}</TableCell>
                          <TableCell>{transaction.referenceNumber || '-'}</TableCell>
                          <TableCell>
                            {transaction.securityId?.name || transaction.securityId?.symbol || '-'}
                          </TableCell>
                          <TableCell align='center'>{new Date(transaction.date).toLocaleDateString('en-GB')}</TableCell>
                          <TableCell align='center'>
                            <Chip
                              label={transaction.type}
                              color={getTransactionTypeColor(transaction.type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align='center'>{transaction.deliveryType}</TableCell>
                          <TableCell align='right'>{transaction.quantity}</TableCell>
                          <TableCell align='right'>{formatCurrency(transaction.price)}</TableCell>
                          <TableCell align='right'>{formatCurrency(amount)}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </MainCard>
        <Box width='100%' sx={{
          mt: 4,
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Pagination count={totalPages} page={page} onChange={(event, value) => {
            setPage(value);
          }} />
        </Box>
      </Grid>
    )
  }

  export default TransactionsTable