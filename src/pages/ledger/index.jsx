import { Box, FormControl, Grid, InputLabel, MenuItem, Pagination, Select } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'store/hooks';
import { hideLoader, showLoader } from 'store/slices/loaderSlice';
import { get } from '../../utils/apiUtil';
import LedgerTable from './components/LedgerTable';
import { exportToExcel as exportLedgerToExcel } from './utils/exportToExcel';

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

  // Filtered ledger entries
  const [filteredEntries, setFilteredEntries] = useState(ledgerEntries);

  // Search function
  const handleSearch = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      let filtered = [...ledgerEntries];

      // Filter by date range
      if (startDate) {
        filtered = filtered.filter((entry) => new Date(entry.date) >= new Date(startDate));
      }
      if (endDate) {
        filtered = filtered.filter((entry) => new Date(entry.date) <= new Date(endDate));
      }

      // Filter by demat account
      if (selectedDematAccount !== 'ALL') {
        filtered = filtered.filter((entry) => entry.dematAccountId === parseInt(selectedDematAccount));
      }

      setFilteredEntries(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Export to Excel function
  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      await exportLedgerToExcel(filteredEntries);
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
      const data = await get(`/ledger/get/${selectedDematAccount?._id}?pageNo=${page}&limit=${ROWS_PER_PAGE}`);
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
    if (selectedDematAccount) {
      fetchLedgerEntries();
    }
  }, [selectedDematAccount, page]);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth sx={{ minWidth: 200 }}>
            <InputLabel>Demat Account</InputLabel>
            <Select
              value={selectedDematAccount?._id || ''}
              onChange={(e) => {
                const selectedAccount = dematAccounts.find(account => account._id === e.target.value);
                setSelectedDematAccount(selectedAccount || null);
              }}
              label="Demat Account"
              fullWidth
            >
              {dematAccounts.length === 0 && (<MenuItem value="">No Demat Accounts</MenuItem>)}
              {dematAccounts.map((account) => (
                <MenuItem key={account._id} value={account._id}>
                  {account.brokerId.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Main Table */}
      <LedgerTable
        ledgerEntries={ledgerEntries}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        handleSearch={handleSearch}
        exportToExcel={exportToExcel}
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
