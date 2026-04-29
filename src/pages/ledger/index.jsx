import { AccountBalance } from '@mui/icons-material';
import { Box, Card, Grid, Pagination, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'store/hooks';
import { hideLoader, showLoader } from 'store/slices/loaderSlice';
import { showErrorSnackbar } from 'store/utils';
import { get } from '../../utils/apiUtil';
import { formatCurrency } from '../../utils/formatCurrency';
import LedgerTable from './components/LedgerTable';
import { exportToExcel as exportLedgerToExcel } from './utils/exportToExcel';

const Ledger = () => {
  const dispatch = useAppDispatch();
  const userAccount = useSelector((state) => state.app.currentUserAccount);
  const financialYear = useSelector((state) => state.app.financialYear);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDematAccount, setSelectedDematAccount] = useState(null);
  const [dematAccounts, setDematAccounts] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ROWS_PER_PAGE = 50;

  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      const response = await get(
        `/report/ledger/export/${selectedDematAccount._id}?startDate=${startDate.format('YYYY-MM-DD')}&endDate=${endDate.format('YYYY-MM-DD')}`,
        true,
        { responseType: 'arraybuffer' }
      );
      const brokerName = dematAccounts.find((acc) => acc._id === selectedDematAccount._id)?.brokerId?.name;
      const filename = `Ledger_${userAccount?.name || 'user'}_${brokerName || 'broker'}.xlsx`;
      // Create Blob and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showErrorSnackbar('Export failed. Please try again.');
      console.error('Export failed:', error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    const fetchDematAccounts = async () => {
      if (!userAccount?._id) {
        return;
      }

      dispatch(showLoader());
      try {
        const data = await get(`/demat-account/get-all?userAccountId=${userAccount._id}`);
        setDematAccounts(data.dematAccounts || []);
        setSelectedDematAccount(data.dematAccounts.length > 0 ? data.dematAccounts[0] : null);
      } catch (error) {
        showErrorSnackbar(error.message || 'Failed to fetch demat accounts. Please try again.');
        console.error('Error fetching demat accounts:', error);
      } finally {
        dispatch(hideLoader());
      }
    };

    fetchDematAccounts();
  }, [userAccount]);

  const fetchLedgerEntries = async () => {
    if (!selectedDematAccount || !startDate || !endDate || !startDate.isValid() || !endDate.isValid()) {
      return;
    }

    dispatch(showLoader());
    try {
      const data = await get(
        `/ledger/get/${selectedDematAccount._id}?pageNo=${page}&limit=${ROWS_PER_PAGE}&startDate=${startDate.format('YYYY-MM-DD')}&endDate=${endDate.format('YYYY-MM-DD')}`
      );
      setLedgerEntries(data.entries || []);
      setOpeningBalance(data.openingBalance || 0);
      setClosingBalance(data.closingBalance || 0);
      setTotalPages(Math.ceil(data.pagination.total / ROWS_PER_PAGE));
    } catch (error) {
      showErrorSnackbar(error.message || 'Failed to fetch ledger entries. Please try again.');
      console.error('Error fetching ledger entries:', error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    if (financialYear?.startDate && financialYear?.endDate) {
      setStartDate(dayjs(financialYear.startDate.split('T')[0]));
      setEndDate(dayjs(financialYear.endDate.split('T')[0]));
    }
  }, [financialYear]);

  useEffect(() => {
    setPage(1);
  }, [selectedDematAccount?._id, startDate, endDate]);

  useEffect(() => {
    fetchLedgerEntries();
  }, [selectedDematAccount, startDate, endDate, page]);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {selectedDematAccount && (
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ bgcolor: openingBalance >= 0 ? 'primary.lighter' : 'warning.lighter' }}>
              <Box sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color={openingBalance >= 0 ? 'primary.darker' : 'warning.darker'}>
                      Opening Balance
                    </Typography>
                    <Typography variant="h4" color={openingBalance >= 0 ? 'primary.darker' : 'warning.darker'}>
                      {formatCurrency(openingBalance)}
                    </Typography>
                    {startDate && startDate.isValid && startDate.isValid() && (
                      <Typography variant="caption" color={openingBalance >= 0 ? 'primary.darker' : 'warning.darker'}>
                        as of {startDate.format('DD/MM/YYYY')}
                      </Typography>
                    )}
                  </Box>
                  <AccountBalance sx={{ fontSize: 40, color: openingBalance >= 0 ? 'primary.dark' : 'warning.dark' }} />
                </Stack>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ bgcolor: closingBalance >= 0 ? 'primary.lighter' : 'warning.lighter' }}>
              <Box sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color={closingBalance >= 0 ? 'primary.darker' : 'warning.darker'}>
                      Closing Balance
                    </Typography>
                    <Typography variant="h4" color={closingBalance >= 0 ? 'primary.darker' : 'warning.darker'}>
                      {formatCurrency(closingBalance)}
                    </Typography>
                    {endDate && endDate.isValid && endDate.isValid() && (
                      <Typography variant="caption" color={closingBalance >= 0 ? 'primary.darker' : 'warning.darker'}>
                        as of {endDate.format('DD/MM/YYYY')}
                      </Typography>
                    )}
                  </Box>
                  <AccountBalance sx={{ fontSize: 40, color: closingBalance >= 0 ? 'primary.dark' : 'warning.dark' }} />
                </Stack>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      <LedgerTable
        ledgerEntries={ledgerEntries}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        exportToExcel={exportToExcel}
        selectedDematAccount={selectedDematAccount}
        setSelectedDematAccount={setSelectedDematAccount}
        dematAccounts={dematAccounts}
        fetchLedgerEntries={fetchLedgerEntries}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
      <Box
        width="100%"
        sx={{
          mt: 4,
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Pagination count={totalPages} page={page} onChange={(event, value) => setPage(value)} />
      </Box>
    </Box>
  );
};

export default Ledger;
