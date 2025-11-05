import { Box, Card, FormControl, Grid, InputLabel, MenuItem, Pagination, Select, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'store/hooks';
import { hideLoader, showLoader } from 'store/slices/loaderSlice';
import { get } from '../../utils/apiUtil';
import LedgerTable from './components/LedgerTable';
import { exportToExcel as exportLedgerToExcel } from './utils/exportToExcel';
import { AccountBalance } from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';

// Main component
const Ledger = () => {
  // Redux dispatch
  const dispatch = useAppDispatch();

  // Redux state
  const userAccount = useSelector((state) => state.app.currentUserAccount);
  const financialYear = useSelector((state) => state.app.financialYear);

  // State management
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDematAccount, setSelectedDematAccount] = useState(null);
  const [dematAccounts, setDematAccounts] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ROWS_PER_PAGE = 50;

  // Export to Excel function
  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      await exportLedgerToExcel(ledgerEntries);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      dispatch(hideLoader());
    }
  };

  const fetchDematAccounts = async () => {
    dispatch(showLoader());
    try {
      const data = await get(`/demat-account/get-all?userAccountId=${userAccount._id}`);
      setDematAccounts(data.dematAccounts || []);
      setSelectedDematAccount(data.dematAccounts.length > 0 ? data.dematAccounts[0] : null);
    } catch (error) {
      console.error('Error fetching demat accounts:', error);
    } finally {
      dispatch(hideLoader());
    }
  };

  const fetchLedgerEntries = async () => {
    dispatch(showLoader());
    try {
      const data = await get(`/ledger/get/${selectedDematAccount?._id}?pageNo=${page}&limit=${ROWS_PER_PAGE}&startDate=${startDate.format('YYYY-MM-DD')}&endDate=${endDate.format('YYYY-MM-DD')}`);
      setLedgerEntries(data.entries || []);
      setTotalPages(Math.ceil((data.pagination.total) / ROWS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
    } finally {
      dispatch(hideLoader());
    }
  }

  useEffect(() => {
    fetchDematAccounts();
  }, [userAccount]);

  useEffect(() => {
    setStartDate(dayjs(financialYear.startDate.split('T')[0]));
    setEndDate(dayjs(financialYear.endDate.split('T')[0]));
  }, [financialYear]);

  useEffect(() => {
      fetchLedgerEntries();
  }, [selectedDematAccount, page, startDate, endDate]);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {selectedDematAccount && <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ bgcolor: selectedDematAccount.balance >= 0 ? 'primary.lighter' : 'warning.lighter' }}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color={selectedDematAccount.balance >= 0 ? 'primary.darker' : 'warning.darker'}>
                    Balance
                  </Typography>
                  <Typography variant="h4" color={selectedDematAccount.balance >= 0 ? 'primary.darker' : 'warning.darker'}>
                    {formatCurrency(selectedDematAccount.balance)}
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 40, color: selectedDematAccount.balance >= 0 ? 'primary.dark' : 'warning.dark' }} />
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>
      }

      {/* Main Table */}
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
      />
      <Box width='100%' sx={{
        mt: 4,
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Pagination count={totalPages} onChange={(event, value) => setPage(value)} />
      </Box>
    </Box>
  );
};

export default Ledger;
