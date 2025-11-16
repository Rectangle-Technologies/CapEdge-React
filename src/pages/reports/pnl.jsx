import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField
} from '@mui/material';
import { useAppDispatch } from 'store/hooks';
import { showErrorSnackbar } from '../../store/utils';
import { get, post } from '../../utils/apiUtil';
import { hideLoader, showLoader } from '../../store/slices/loaderSlice';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

// Main component
const ProfitAndLoss = () => {
  // Redux dispatch
  const dispatch = useAppDispatch();

  const [dematAccounts, setDematAccounts] = useState([]);
  const [selectedDematAccount, setSelectedDematAccount] = useState('');

  const userAccount = useSelector((state) => state.app.currentUserAccount);
  const financialYear = useSelector((state) => state.app.financialYear);

  const generatePnLReport = async () => {
    if (!financialYear?._id) {
      showErrorSnackbar('Financial year is not selected');
      return;
    }

    if (!selectedDematAccount) {
      showErrorSnackbar('Please select a demat account');
      return;
    }
    
    dispatch(showLoader());
    try {
      // Call API with responseType 'arraybuffer' to get Excel file buffer
      const response = await post('/report/pnl/export', {
        dematAccountId: selectedDematAccount,
        financialYearId: financialYear._id
      }, true, { responseType: 'arraybuffer' });
      // Extract filename from Content-Disposition header
      const brokerName = dematAccounts.find(acc => acc._id === selectedDematAccount)?.brokerId?.name;
      const filename = `pnl_${userAccount?.name || 'user'}_${brokerName || 'broker'}_${financialYear?.title || 'year'}.xlsx`;
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
      console.error('Error generating P&L report:', error);
      showErrorSnackbar(error.message || 'Failed to generate P&L report');
    } finally {
      dispatch(hideLoader());
    }
  };

  const fetchDematAccounts = async () => {
    if (!userAccount?._id) {
      return;
    }
    dispatch(showLoader());
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
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchDematAccounts();
  }, [userAccount]);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
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
          <Button variant="contained" color="primary" onClick={generatePnLReport}>
            Generate P&L Report
          </Button>
        </Grid>
      </Grid>
      
    </Box>
  );
};

export default ProfitAndLoss;
