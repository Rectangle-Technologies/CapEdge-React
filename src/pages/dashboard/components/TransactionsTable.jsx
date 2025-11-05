import { Box, Chip, Grid, Pagination, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import MainCard from 'components/MainCard';
import TransactionsTableHead from './TransactionsTableHead';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getTransactionTypeColor } from '../../securities/utils/helpers';
import { useState, useEffect } from 'react';
import { getAllTransactions } from '../../transactions/services/transactionService';
import Loader from 'components/Loader';
import { useDispatch } from 'react-redux';
import { hideLoader, showLoader } from '../../../store/slices/loaderSlice';

const ITEMS_PER_PAGE = 50;

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const dispatch = useDispatch();

  const fetchTransactions = async () => {
    dispatch(showLoader());
    try {
      const data = await getAllTransactions(ITEMS_PER_PAGE, page);
      setTransactions(data.transactions || []);
      setTotalPages(Math.ceil(data.pagination.total / ITEMS_PER_PAGE) || 1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Keep existing data on error
    } finally {
      dispatch(hideLoader());
    }
  };

    useEffect(() => {
      fetchTransactions();
    }, [page]);

    return (
      <Grid size={12}>
        <MainCard content={false}>
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
                      <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
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
                          <TableCell>{transaction.dematAccountId?.brokerId?.name || '-'}</TableCell>
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