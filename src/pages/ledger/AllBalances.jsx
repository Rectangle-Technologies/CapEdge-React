import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAppDispatch } from 'store/hooks';
import { hideLoader, showLoader } from 'store/slices/loaderSlice';
import { showErrorSnackbar } from 'store/utils';
import { get } from '../../utils/apiUtil';
import { formatCurrency } from '../../utils/formatCurrency';

const AllBalances = () => {
  const dispatch = useAppDispatch();
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    const fetchBalances = async () => {
      dispatch(showLoader());
      try {
        const data = await get('/ledger/all-closing-balances');
        setBalances(data.balances || []);
      } catch (error) {
        showErrorSnackbar(error.message || 'Failed to fetch balances. Please try again.');
        console.error('Error fetching closing balances:', error);
      } finally {
        dispatch(hideLoader());
      }
    };

    fetchBalances();
  }, []);

  // Build matrix: rows = unique user accounts, columns = unique brokers
  const userAccounts = [...new Map(balances.map((b) => [b.userAccountId?.toString(), b.userAccountName])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1])
  );

  const brokers = [...new Map(balances.map((b) => [b.brokerId?.toString(), b.brokerName])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1])
  );

  // balanceMap[userAccountId][brokerId] = closingBalance
  const balanceMap = {};
  balances.forEach((b) => {
    const uid = b.userAccountId?.toString();
    const bid = b.brokerId?.toString();
    if (!balanceMap[uid]) balanceMap[uid] = {};
    balanceMap[uid][bid] = b.closingBalance;
  });

  const rowTotal = (uid) => brokers.reduce((sum, [bid]) => sum + (balanceMap[uid]?.[bid] ?? 0), 0);
  const colTotal = (bid) => userAccounts.reduce((sum, [uid]) => sum + (balanceMap[uid]?.[bid] ?? 0), 0);
  const grandTotal = brokers.reduce((sum, [bid]) => sum + colTotal(bid), 0);

  const cellColor = (value) => {
    if (value === undefined || value === null) return 'text.disabled';
    return value >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        All Account Balances
      </Typography>

      {balances.length === 0 ? (
        <Typography color="text.secondary">No demat accounts found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: 'grey.100',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    minWidth: 160
                  }}
                >
                  User Account
                </TableCell>
                {brokers.map(([bid, brokerName]) => (
                  <TableCell
                    key={bid}
                    align="right"
                    sx={{ fontWeight: 700, bgcolor: 'grey.100', minWidth: 150 }}
                  >
                    {brokerName}
                  </TableCell>
                ))}
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    bgcolor: 'grey.200',
                    borderLeft: '2px solid',
                    borderColor: 'divider',
                    minWidth: 150
                  }}
                >
                  Total
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {userAccounts.map(([uid, uName]) => (
                <TableRow key={uid} hover>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      borderRight: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {uName}
                  </TableCell>
                  {brokers.map(([bid]) => {
                    const val = balanceMap[uid]?.[bid];
                    return (
                      <TableCell key={bid} align="right">
                        {val !== undefined ? (
                          <Typography sx={{ fontSize: '1rem' }} color={cellColor(val)} fontWeight={500}>
                            {formatCurrency(val)}
                          </Typography>
                        ) : (
                          <Typography sx={{ fontSize: '1rem' }} color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell
                    align="right"
                    sx={{ borderLeft: '2px solid', borderColor: 'divider' }}
                  >
                    <Typography sx={{ fontSize: '1rem' }} color={cellColor(rowTotal(uid))} fontWeight={700}>
                      {formatCurrency(rowTotal(uid))}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    borderRight: '1px solid',
                    borderTop: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  Total
                </TableCell>
                {brokers.map(([bid]) => (
                  <TableCell
                    key={bid}
                    align="right"
                    sx={{ borderTop: '2px solid', borderColor: 'divider' }}
                  >
                    <Typography sx={{ fontSize: '1rem' }} color={cellColor(colTotal(bid))} fontWeight={700}>
                      {formatCurrency(colTotal(bid))}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell
                  align="right"
                  sx={{
                    borderLeft: '2px solid',
                    borderTop: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography sx={{ fontSize: '1rem' }} color={cellColor(grandTotal)} fontWeight={700}>
                    {formatCurrency(grandTotal)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AllBalances;
