import {
  Card,
  CardHeader,
  Divider,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import LedgerRow from './LedgerRow';

const LedgerTable = ({
  ledgerEntries,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  exportToExcel,
  selectedDematAccount,
  setSelectedDematAccount,
  dematAccounts
}) => {
  // State to track which row is expanded (only one at a time)
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Handle row toggle - close current if same row, otherwise open new row
  const handleRowToggle = (entryId) => {
    setExpandedRowId(expandedRowId === entryId ? null : entryId);
  };

  // Get transaction type color
  const getTransactionColor = (type) => {
    switch (type) {
      case 'BUY':
        return 'error';
      case 'SELL':
        return 'success';
      case 'CREDIT':
        return 'info';
      case 'DEBIT':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ mt: 4 }}>
      <CardHeader
        title="Ledger"
        subheader="View all financial transactions across demat accounts"
        action={
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton
              onClick={exportToExcel}
              color="primary"
              title="Export to Excel"
              sx={{
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 1
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Stack>
        }
      />
      <Divider />

      {/* Filters */}
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Start Date"
                value={startDate ? dayjs(startDate) : null}
                format="DD/MM/YYYY"
                onChange={(newValue) => {
                  setStartDate(newValue);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="End Date"
                value={endDate ? dayjs(endDate) : null}
                format="DD/MM/YYYY"
                onChange={(newValue) => {
                  setEndDate(newValue);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Box>

      <Divider />

      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60, padding: '8px 16px 8px 16px' }} />
              <TableCell sx={{ padding: '8px 16px 8px 16px' }}>
                <strong>Date</strong>
              </TableCell>
              <TableCell sx={{ padding: '8px 16px 8px 16px' }}>
                <strong>Type</strong>
              </TableCell>
              <TableCell align="right" sx={{ padding: '8px 16px 8px 16px' }}>
                <strong>Credit</strong>
              </TableCell>
              <TableCell align="right" sx={{ padding: '8px 16px 8px 16px' }}>
                <strong>Debit</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ledgerEntries.length > 0 ? (
              ledgerEntries.map((entry) => (
                <LedgerRow
                  key={entry._id}
                  entry={entry}
                  isExpanded={expandedRowId === entry._id}
                  onToggleExpand={handleRowToggle}
                  getTransactionColor={getTransactionColor}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No ledger entries found. Adjust filters or check back later.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default LedgerTable;
