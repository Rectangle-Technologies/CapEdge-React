import { useParams, useNavigate } from 'react-router';
import { showErrorSnackbar, showSuccessSnackbar } from '../../../store/utils';
import { get, post } from '../../../utils/apiUtil';
import { useDispatch } from 'react-redux';
import { hideLoader, showLoader } from '../../../store/slices/loaderSlice';
import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TextField,
  Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { formatDate } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';

const SplitSecurity = () => {
  const { securityId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [splitFrom, setSplitFrom] = useState('');
  const [splitTo, setSplitTo] = useState('');
  const [splitDate, setSplitDate] = useState(dayjs());
  const [newQuantities, setNewQuantities] = useState({});

  const handleNewQuantityChange = (holdingIndex, entryIndex, value) => {
    setNewQuantities((prev) => ({
      ...prev,
      [`${holdingIndex}-${entryIndex}`]: value
    }));
  };

  useEffect(() => {
    if (!splitDate) return;

    dispatch(showLoader());
    const fetchHoldings = async () => {
      try {
        const result = await get(`/holdings/for-split/${securityId}/${splitDate.format('YYYY-MM-DD')}`);
        setData(result);
      } catch (error) {
        console.error('Error fetching holdings for security split:', error);
        showErrorSnackbar('Failed to fetch holdings for security split.');
      } finally {
        dispatch(hideLoader());
      }
    };

    fetchHoldings();
  }, [securityId, splitDate, dispatch]);

  useEffect(() => {
    if (splitFrom && splitTo && data?.holdings) {
      const from = parseFloat(splitFrom);
      const to = parseFloat(splitTo);

      if (from > 0 && to > 0) {
        const calculatedQuantities = {};
        data.holdings.forEach((holding, holdingIndex) => {
          holding.entries.forEach((entry, entryIndex) => {
            const newQty = (entry.quantity * to) / from;
            calculatedQuantities[`${holdingIndex}-${entryIndex}`] = newQty.toString();
          });
        });
        setNewQuantities(calculatedQuantities);
      }
    }
  }, [splitFrom, splitTo, data]);

  const handleSplitSecurity = async () => {
    if (window.confirm('Are you sure you want to split this security? This action cannot be undone.')) {
      // get data to submit
      const transactions = [];

      data.holdings.forEach((holding, holdingIndex) => {
        holding.entries.forEach((entry, entryIndex) => {
          const key = `${holdingIndex}-${entryIndex}`;
          const newQty = parseFloat(newQuantities[key]) || 0;
          const newPrice = newQty > 0 ? (entry.price * entry.quantity) / newQty : 0;

          transactions.push({
            transactionId: entry.transactionId,
            quantityBeforeSplit: entry.quantity,
            holdingId: entry.holdingId,
            quantityAfterSplit: newQty,
            priceBeforeSplit: entry.price,
            priceAfterSplit: newPrice
          });
        });
      });

      const splitData = {
        securityId,
        splitDate: splitDate.toDate(),
        splitRatio: `${splitFrom}:${splitTo}`,
        transactions
      };

      dispatch(showLoader());
      try {
        await post('/security/split', splitData);
        showSuccessSnackbar('Security split successfully!');
        navigate('/report/holdings');
      } catch (error) {
        console.error('Error splitting security:', error);
        showErrorSnackbar(error.message || 'Failed to split security.');
      } finally {
        dispatch(hideLoader());
      }
    }
  };

  return (
    <Box>
      <Typography variant="h3" sx={{ my: 3 }}>
        Split Security: {data?.securityName}
      </Typography>

      {data?.holdings?.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Typography variant="h5" color="text.secondary">
            No holdings found for this security
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mb: 3, gap: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography mr={2} variant="h5">
                Split Ratio
              </Typography>
              <TextField value={splitFrom} onChange={(e) => setSplitFrom(e.target.value)} type="number" size="small" sx={{ width: 60 }} />
              <Typography variant="h5">:</Typography>
              <TextField value={splitTo} onChange={(e) => setSplitTo(e.target.value)} type="number" size="small" sx={{ width: 60 }} />
            </Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Split Date"
                value={splitDate}
                format="DD/MM/YYYY"
                onChange={(newValue) => setSplitDate(newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: 200 }
                  }
                }}
              />
            </LocalizationProvider>
          </Box>

          <Grid container spacing={3}>
            {data?.holdings?.map((holding, index) => (
              <Grid item size={12} key={index}>
                <Card>
                  <CardHeader title={holding.title} titleTypographyProps={{ variant: 'h5' }} />
                  <CardContent>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <strong>Date</strong>
                            </TableCell>
                            <TableCell align="center">
                              <strong>Current Quantity</strong>
                            </TableCell>
                            <TableCell align="center">
                              <strong>Current Price</strong>
                            </TableCell>
                            <TableCell align="center">
                              <strong>New Quantity</strong>
                            </TableCell>
                            <TableCell align="center">
                              <strong>New Price</strong>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {holding.entries.map((entry, entryIndex) => {
                            const newQty = parseFloat(newQuantities[`${index}-${entryIndex}`]) || 0;
                            const newPrice = newQty > 0 ? (entry.price * entry.quantity) / newQty : 0;

                            return (
                              <TableRow key={entryIndex}>
                                <TableCell>{formatDate(entry.buyDate)}</TableCell>
                                <TableCell align="center">{entry.quantity}</TableCell>
                                <TableCell align="center">{formatCurrency(entry.price)}</TableCell>
                                <TableCell align="center">
                                  <TextField
                                    value={newQuantities[`${index}-${entryIndex}`] || ''}
                                    onChange={(e) => handleNewQuantityChange(index, entryIndex, e.target.value)}
                                    type="number"
                                    size="small"
                                    sx={{ width: 100 }}
                                  />
                                </TableCell>
                                <TableCell align="center">{formatCurrency(newPrice)}</TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell>
                              <strong>Total</strong>
                            </TableCell>
                            <TableCell align="center">
                              <strong>{holding.entries.reduce((sum, entry) => sum + entry.quantity, 0)}</strong>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell align="center">
                              <strong>
                                {holding.entries.reduce((sum, entry, entryIndex) => {
                                  const newQty = parseFloat(newQuantities[`${index}-${entryIndex}`]) || 0;
                                  return sum + newQty;
                                }, 0)}
                              </strong>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" size="large" disabled={!splitFrom || !splitTo} onClick={handleSplitSecurity}>
              Split
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default SplitSecurity;
