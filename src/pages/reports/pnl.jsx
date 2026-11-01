import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { Download, Search } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'store/hooks';
import { hideLoader, showLoader } from '../../store/slices/loaderSlice';
import { showErrorSnackbar } from '../../store/utils';
import { get, post } from '../../utils/apiUtil';
import { formatCurrency } from '../../utils/formatCurrency';

const fmtDate = (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-');

// Shared cell style for table body
const cs = { fontSize: '0.75rem', py: 0.75 };
const br = { borderRight: '1px solid rgba(224,224,224,1)' };

// The report table pins just under the app bar once the KPIs above it have scrolled away; BELOW_TABLE is the space the layout leaves under it
const PIN_TOP = 96;
const BELOW_TABLE = { xs: 40, sm: 48 }; // the layout's bottom padding differs on phones

const r2 = (n) => parseFloat(n.toFixed(2));

const computeRow = (tx) => {
  const buyAmt = r2(tx.quantity * tx.buyPrice);
  const sellAmt = r2(tx.quantity * tx.sellPrice);
  const charges = tx.transactionCost || 0;
  const isGain = tx.resultType === 'gain';
  const isLT = tx.gainType === 'LTCG';
  const isIntraday = tx.gainType === 'Intraday';
  const gainLossAmt = r2(isGain ? sellAmt - buyAmt : buyAmt - sellAmt);
  const taxableAmt = r2(isGain ? gainLossAmt - charges : -(gainLossAmt + charges));
  return { buyAmt, sellAmt, charges, isGain, isLT, isIntraday, gainLossAmt, taxableAmt };
};

const computeSecTotals = (transactions) => {
  let buyAmt = 0, sellAmt = 0, gainLT = 0, gainST = 0, gainIntraday = 0, lossLT = 0, lossST = 0, lossIntraday = 0;
  let charges = 0, taxableAmt = 0, taxLT = 0, taxST = 0, taxIntraday = 0;
  transactions.forEach((tx) => {
    const r = computeRow(tx);
    buyAmt += r.buyAmt;
    sellAmt += r.sellAmt;
    charges += r.charges;
    taxableAmt += r.taxableAmt;
    if (r.isGain) {
      if (r.isLT) { gainLT += r.gainLossAmt; taxLT += tx.calculatedTax || 0; }
      else if (r.isIntraday) { gainIntraday += r.gainLossAmt; taxIntraday += tx.calculatedTax || 0; }
      else { gainST += r.gainLossAmt; taxST += tx.calculatedTax || 0; }
    } else {
      if (r.isLT) { lossLT += r.gainLossAmt; taxLT += tx.calculatedTax || 0; }
      else if (r.isIntraday) { lossIntraday += r.gainLossAmt; taxIntraday += tx.calculatedTax || 0; }
      else { lossST += r.gainLossAmt; taxST += tx.calculatedTax || 0; }
    }
  });
  return {
    buyAmt: r2(buyAmt), sellAmt: r2(sellAmt),
    gainLT: r2(gainLT), gainST: r2(gainST), gainIntraday: r2(gainIntraday),
    lossLT: r2(lossLT), lossST: r2(lossST), lossIntraday: r2(lossIntraday),
    charges: r2(charges), taxableAmt: r2(taxableAmt),
    taxLT: r2(taxLT), taxST: r2(taxST), taxIntraday: r2(taxIntraday)
  };
};

const computeGrandTotals = (securities) => {
  const zero = { buyAmt: 0, sellAmt: 0, gainLT: 0, gainST: 0, gainIntraday: 0, lossLT: 0, lossST: 0, lossIntraday: 0, charges: 0, taxableAmt: 0, taxLT: 0, taxST: 0, taxIntraday: 0 };
  return securities.reduce((acc, { transactions }) => {
    const t = computeSecTotals(transactions);
    Object.keys(zero).forEach((k) => { acc[k] += t[k]; });
    return acc;
  }, { ...zero });
};

const ProfitAndLoss = () => {
  const dispatch = useAppDispatch();
  const userAccount = useSelector((state) => state.app.currentUserAccount);
  const financialYear = useSelector((state) => state.app.financialYear);

  const [dematAccounts, setDematAccounts] = useState([]);
  const [selectedDematAccount, setSelectedDematAccount] = useState('');
  const [pnlData, setPnlData] = useState(null);

  // While the KPIs are in view the page scrolls and the table does not scroll on its own. Once the table has scrolled up to its pinned
  // position it fills the screen and its rows scroll inside it, with the header and the Grand Total row fixed.
  const hasRows = !!pnlData?.securities?.length;
  const tableRef = useRef(null);
  const headRowRef = useRef(null);
  const sentinelRef = useRef(null);
  useEffect(() => {
    const table = tableRef.current;
    const sentinel = sentinelRef.current;
    if (!table || !sentinel) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const pinned = !entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0);
        table.style.overflowY = pinned ? 'auto' : 'hidden';
      },
      { rootMargin: `-${PIN_TOP + 2}px 0px 0px 0px` }
    );
    observer.observe(sentinel);
    // the second header row sticks right below the first one
    const measure = () => headRowRef.current && table.style.setProperty('--pnl-head-row1', `${headRowRef.current.offsetHeight}px`);
    measure();
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (resize && headRowRef.current) resize.observe(headRowRef.current);
    return () => {
      observer.disconnect();
      resize?.disconnect();
    };
  }, [hasRows]);

  useEffect(() => {
    const fetchDematAccounts = async () => {
      if (!userAccount?._id) return;
      dispatch(showLoader());
      try {
        const response = await get(`/demat-account/get-all?userAccountId=${userAccount._id}`);
        const accounts = response.dematAccounts || [];
        setDematAccounts(accounts);
        if (accounts.length > 0) setSelectedDematAccount(accounts[0]._id);
      } catch {
        showErrorSnackbar('Failed to fetch demat accounts');
      } finally {
        dispatch(hideLoader());
      }
    };
    fetchDematAccounts();
  }, [userAccount]);

  const validate = () => {
    if (!financialYear?._id) { showErrorSnackbar('Financial year is not selected'); return false; }
    if (!selectedDematAccount) { showErrorSnackbar('Please select a demat account'); return false; }
    return true;
  };

  const handleView = async () => {
    if (!validate()) return;
    dispatch(showLoader());
    try {
      const data = await post('/report/pnl', { dematAccountId: selectedDematAccount, financialYearId: financialYear._id });
      setPnlData(data);
    } catch (error) {
      showErrorSnackbar(error.message || 'Failed to fetch P&L report');
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleDownload = async () => {
    if (!validate()) return;
    dispatch(showLoader());
    try {
      const response = await post(
        '/report/pnl/export',
        { dematAccountId: selectedDematAccount, financialYearId: financialYear._id },
        true,
        { responseType: 'arraybuffer' }
      );
      const brokerName = dematAccounts.find((a) => a._id === selectedDematAccount)?.brokerId?.name;
      const filename = `pnl_${userAccount?.name || 'user'}_${brokerName || 'broker'}_${financialYear?.title || 'year'}.xlsx`;
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showErrorSnackbar(error.message || 'Failed to download P&L report');
    } finally {
      dispatch(hideLoader());
    }
  };

  return (
    // the page claims the layout's own side padding (16px on phones, 24px + 16px from tablets up) and keeps a small margin of its own
    <Box sx={{ width: 'auto', mx: { xs: -2, sm: -5 }, px: 2, py: 3 }}>
      {/* Filter bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
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
            <Grid size={{ xs: 12, md: 'auto' }}>
              <Button variant="contained" startIcon={<Search />} onClick={handleView}>
                View Report
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 'auto' }}>
              <Button variant="outlined" startIcon={<Download />} onClick={handleDownload}>
                Download Excel
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report output */}
      {pnlData && (() => {
        const grand = computeGrandTotals(pnlData.securities);
        const netPnL = (grand.gainLT + grand.gainST + grand.gainIntraday) - (grand.lossLT + grand.lossST + grand.lossIntraday);
        const totalTax = grand.taxLT + grand.taxST + grand.taxIntraday;

        return (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Period: {fmtDate(pnlData.startDate)} – {fmtDate(pnlData.endDate)}
            </Typography>

            {/* Summary cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ bgcolor: 'success.lighter' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="success.dark" display="block">Total Gain</Typography>
                    <Typography variant="h5" color="success.dark">{formatCurrency(grand.gainLT + grand.gainST + grand.gainIntraday)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      LT: {formatCurrency(grand.gainLT)} | ST: {formatCurrency(grand.gainST)} | Intraday: {formatCurrency(grand.gainIntraday)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ bgcolor: 'error.lighter' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="error.dark" display="block">Total Loss</Typography>
                    <Typography variant="h5" color="error.dark">{formatCurrency(grand.lossLT + grand.lossST + grand.lossIntraday)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      LT: {formatCurrency(grand.lossLT)} | ST: {formatCurrency(grand.lossST)} | Intraday: {formatCurrency(grand.lossIntraday)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ bgcolor: netPnL >= 0 ? 'primary.lighter' : 'warning.lighter' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color={netPnL >= 0 ? 'primary.dark' : 'warning.dark'} display="block">
                      Net P&amp;L
                    </Typography>
                    <Typography variant="h5" color={netPnL >= 0 ? 'primary.dark' : 'warning.dark'}>
                      {formatCurrency(netPnL)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Taxable: {formatCurrency(grand.taxableAmt)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ bgcolor: 'warning.lighter' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="warning.dark" display="block">Estimated Tax</Typography>
                    <Typography variant="h5" color="warning.dark">{formatCurrency(totalTax)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      LT: {formatCurrency(grand.taxLT)} | ST: {formatCurrency(grand.taxST)} | Intraday: {formatCurrency(grand.taxIntraday)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* P&L Table */}
            {hasRows && <Box ref={sentinelRef} sx={{ height: '1px', mb: '-1px' }} />}
            {pnlData.securities.length === 0 ? (
              <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No P&amp;L data found for the selected account and financial year.
              </Typography>
            ) : (
              <TableContainer
                ref={tableRef}
                component={Paper}
                variant="outlined"
                sx={{ overflowX: 'auto', overflowY: 'hidden', position: 'sticky', top: PIN_TOP, maxHeight: { xs: `calc(100vh - ${PIN_TOP + BELOW_TABLE.xs}px)`, sm: `calc(100vh - ${PIN_TOP + BELOW_TABLE.sm}px)` } }}
              >
                <Table size="small" sx={{ minWidth: 1900 }}>
                  <TableHead
                    sx={{
                      // && = more specific than the theme's own `position: relative` on table cells
                      '&& .MuiTableCell-root': { position: 'sticky', zIndex: 3, bgcolor: 'primary.lighter', boxShadow: 'inset 0 -1px 0 rgba(224,224,224,1)' },
                      '&& tr:first-of-type .MuiTableCell-root': { top: 0 },
                      '&& tr:nth-of-type(2) .MuiTableCell-root': { top: 'var(--pnl-head-row1, 34px)' }
                    }}
                  >
                    {/* Group header row */}
                    <TableRow ref={headRowRef} sx={{ bgcolor: 'primary.lighter' }}>
                      <TableCell rowSpan={2} sx={{ fontWeight: 'bold', minWidth: 140, ...br }}>Stock</TableCell>
                      <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', ...br, borderBottom: 'none', pb: 0 }}>Buy</TableCell>
                      <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', ...br, borderBottom: 'none', pb: 0 }}>Sell</TableCell>
                      <TableCell colSpan={3} align="center" sx={{ fontWeight: 'bold', color: 'success.dark', ...br, borderBottom: 'none', pb: 0 }}>Gain</TableCell>
                      <TableCell colSpan={3} align="center" sx={{ fontWeight: 'bold', color: 'error.dark', ...br, borderBottom: 'none', pb: 0 }}>Loss</TableCell>
                      <TableCell rowSpan={2} align="right" sx={{ fontWeight: 'bold', minWidth: 90, ...br }}>Charges</TableCell>
                      <TableCell rowSpan={2} align="right" sx={{ fontWeight: 'bold', minWidth: 110, ...br }}>Taxable Amt</TableCell>
                      <TableCell colSpan={3} align="center" sx={{ fontWeight: 'bold', color: 'warning.dark', borderBottom: 'none', pb: 0 }}>Tax</TableCell>
                    </TableRow>
                    {/* Sub-column header row */}
                    <TableRow sx={{ bgcolor: 'primary.lighter' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.72rem' }}>Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem' }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem' }}>Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', ...br }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.72rem' }}>Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem' }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem' }}>Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', ...br }}>Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', color: 'success.dark' }}>Long Term</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', color: 'success.dark' }}>Short Term</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', color: 'success.dark', ...br }}>Intraday</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', color: 'error.dark' }}>Long Term</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', color: 'error.dark' }}>Short Term</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', color: 'error.dark', ...br }}>Intraday</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', color: 'warning.dark' }}>Long Term</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', color: 'warning.dark' }}>Short Term</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', color: 'warning.dark' }}>Intraday</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {pnlData.securities.map(({ securityId, securityName, transactions }, secIdx) => {
                      const sec = computeSecTotals(transactions);
                      const rowBg = secIdx % 2 === 0 ? 'inherit' : 'rgba(0,0,0,0.015)';

                      return (
                        <React.Fragment key={securityId}>
                          {/* Transaction rows */}
                          {transactions.map((tx, txIdx) => {
                            const r = computeRow(tx);
                            return (
                              <TableRow
                                key={txIdx}
                                hover
                                sx={{
                                  bgcolor: rowBg,
                                  borderTop: txIdx === 0 ? '1px solid rgba(120,120,120,0.25)' : undefined
                                }}
                              >
                                <TableCell sx={{ ...cs, fontWeight: txIdx === 0 ? 600 : 400, ...br }}>
                                  {txIdx === 0 ? securityName : ''}
                                </TableCell>
                                <TableCell sx={cs}>{fmtDate(tx.buyDate)}</TableCell>
                                <TableCell align="right" sx={cs}>{tx.quantity}</TableCell>
                                <TableCell align="right" sx={cs}>{formatCurrency(tx.buyPrice)}</TableCell>
                                <TableCell align="right" sx={{ ...cs, ...br }}>{formatCurrency(r.buyAmt)}</TableCell>
                                <TableCell sx={cs}>{fmtDate(tx.sellDate)}</TableCell>
                                <TableCell align="right" sx={cs}>{tx.quantity}</TableCell>
                                <TableCell align="right" sx={cs}>{formatCurrency(tx.sellPrice)}</TableCell>
                                <TableCell align="right" sx={{ ...cs, ...br }}>{formatCurrency(r.sellAmt)}</TableCell>
                                <TableCell align="right" sx={{ ...cs, color: 'success.dark' }}>
                                  {r.isGain && r.isLT ? formatCurrency(r.gainLossAmt) : '-'}
                                </TableCell>
                                <TableCell align="right" sx={{ ...cs, color: 'success.dark' }}>
                                  {r.isGain && !r.isLT && !r.isIntraday ? formatCurrency(r.gainLossAmt) : '-'}
                                </TableCell>
                                <TableCell align="right" sx={{ ...cs, color: 'success.dark', ...br }}>
                                  {r.isGain && r.isIntraday ? formatCurrency(r.gainLossAmt) : '-'}
                                </TableCell>
                                <TableCell align="right" sx={{ ...cs, color: 'error.dark' }}>
                                  {!r.isGain && r.isLT ? formatCurrency(r.gainLossAmt) : '-'}
                                </TableCell>
                                <TableCell align="right" sx={{ ...cs, color: 'error.dark' }}>
                                  {!r.isGain && !r.isLT && !r.isIntraday ? formatCurrency(r.gainLossAmt) : '-'}
                                </TableCell>
                                <TableCell align="right" sx={{ ...cs, color: 'error.dark', ...br }}>
                                  {!r.isGain && r.isIntraday ? formatCurrency(r.gainLossAmt) : '-'}
                                </TableCell>
                                <TableCell align="right" sx={{ ...cs, ...br }}>{formatCurrency(r.charges)}</TableCell>
                                <TableCell align="right" sx={{ ...cs, color: r.taxableAmt >= 0 ? 'success.dark' : 'error.dark', ...br }}>
                                  {formatCurrency(r.taxableAmt)}
                                </TableCell>
                                <TableCell align="right" sx={{ ...cs, color: 'warning.dark' }}>
                                  {r.isLT ? formatCurrency(tx.calculatedTax || 0) : '-'}
                                </TableCell>
                                <TableCell align="right" sx={{ ...cs, color: 'warning.dark' }}>
                                  {!r.isLT && !r.isIntraday ? formatCurrency(tx.calculatedTax || 0) : '-'}
                                </TableCell>
                                <TableCell align="right" sx={{ ...cs, color: 'warning.dark' }}>
                                  {r.isIntraday ? formatCurrency(tx.calculatedTax || 0) : '-'}
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          {/* Per-security subtotal row */}
                          <TableRow sx={{ bgcolor: secIdx % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.06)' }}>
                            <TableCell sx={{ ...cs, fontStyle: 'italic', color: 'text.secondary', fontSize: '0.7rem', ...br }}>
                              Total
                            </TableCell>
                            {/* Buy: skip Date+Qty+Price, show Amount */}
                            <TableCell colSpan={3} sx={cs} />
                            <TableCell align="right" sx={{ ...cs, fontWeight: 600, ...br }}>{formatCurrency(sec.buyAmt)}</TableCell>
                            {/* Sell: skip Date+Qty+Price, show Amount */}
                            <TableCell colSpan={3} sx={cs} />
                            <TableCell align="right" sx={{ ...cs, fontWeight: 600, ...br }}>{formatCurrency(sec.sellAmt)}</TableCell>
                            <TableCell align="right" sx={{ ...cs, color: 'success.dark', fontWeight: 600 }}>
                              {sec.gainLT ? formatCurrency(sec.gainLT) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ ...cs, color: 'success.dark', fontWeight: 600 }}>
                              {sec.gainST ? formatCurrency(sec.gainST) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ ...cs, color: 'success.dark', fontWeight: 600, ...br }}>
                              {sec.gainIntraday ? formatCurrency(sec.gainIntraday) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ ...cs, color: 'error.dark', fontWeight: 600 }}>
                              {sec.lossLT ? formatCurrency(sec.lossLT) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ ...cs, color: 'error.dark', fontWeight: 600 }}>
                              {sec.lossST ? formatCurrency(sec.lossST) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ ...cs, color: 'error.dark', fontWeight: 600, ...br }}>
                              {sec.lossIntraday ? formatCurrency(sec.lossIntraday) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ ...cs, fontWeight: 600, ...br }}>{formatCurrency(sec.charges)}</TableCell>
                            <TableCell align="right" sx={{ ...cs, fontWeight: 600, color: sec.taxableAmt >= 0 ? 'success.dark' : 'error.dark', ...br }}>
                              {formatCurrency(sec.taxableAmt)}
                            </TableCell>
                            <TableCell align="right" sx={{ ...cs, color: 'warning.dark', fontWeight: 600 }}>
                              {sec.taxLT ? formatCurrency(sec.taxLT) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ ...cs, color: 'warning.dark', fontWeight: 600 }}>
                              {sec.taxST ? formatCurrency(sec.taxST) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ ...cs, color: 'warning.dark', fontWeight: 600 }}>
                              {sec.taxIntraday ? formatCurrency(sec.taxIntraday) : '-'}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}

                    {/* Grand total row */}
                    <TableRow
                      sx={{
                        bgcolor: 'primary.lighter',
                        borderTop: '2px solid rgba(100,100,100,0.3)',
                        '&& .MuiTableCell-root': { position: 'sticky', bottom: 0, zIndex: 2, bgcolor: 'primary.lighter', boxShadow: 'inset 0 2px 0 rgba(100,100,100,0.3)' }
                      }}
                    >
                      <TableCell sx={{ ...cs, fontWeight: 'bold', ...br }}>Grand Total</TableCell>
                      <TableCell colSpan={3} sx={cs} />
                      <TableCell align="right" sx={{ ...cs, fontWeight: 'bold', ...br }}>{formatCurrency(grand.buyAmt)}</TableCell>
                      <TableCell colSpan={3} sx={cs} />
                      <TableCell align="right" sx={{ ...cs, fontWeight: 'bold', ...br }}>{formatCurrency(grand.sellAmt)}</TableCell>
                      <TableCell align="right" sx={{ ...cs, color: 'success.dark', fontWeight: 'bold' }}>
                        {grand.gainLT ? formatCurrency(grand.gainLT) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ ...cs, color: 'success.dark', fontWeight: 'bold' }}>
                        {grand.gainST ? formatCurrency(grand.gainST) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ ...cs, color: 'success.dark', fontWeight: 'bold', ...br }}>
                        {grand.gainIntraday ? formatCurrency(grand.gainIntraday) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ ...cs, color: 'error.dark', fontWeight: 'bold' }}>
                        {grand.lossLT ? formatCurrency(grand.lossLT) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ ...cs, color: 'error.dark', fontWeight: 'bold' }}>
                        {grand.lossST ? formatCurrency(grand.lossST) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ ...cs, color: 'error.dark', fontWeight: 'bold', ...br }}>
                        {grand.lossIntraday ? formatCurrency(grand.lossIntraday) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ ...cs, fontWeight: 'bold', ...br }}>{formatCurrency(grand.charges)}</TableCell>
                      <TableCell align="right" sx={{ ...cs, fontWeight: 'bold', color: grand.taxableAmt >= 0 ? 'success.dark' : 'error.dark', ...br }}>
                        {formatCurrency(grand.taxableAmt)}
                      </TableCell>
                      <TableCell align="right" sx={{ ...cs, color: 'warning.dark', fontWeight: 'bold' }}>
                        {grand.taxLT ? formatCurrency(grand.taxLT) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ ...cs, color: 'warning.dark', fontWeight: 'bold' }}>
                        {grand.taxST ? formatCurrency(grand.taxST) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ ...cs, color: 'warning.dark', fontWeight: 'bold' }}>
                        {grand.taxIntraday ? formatCurrency(grand.taxIntraday) : '-'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        );
      })()}
    </Box>
  );
};

export default ProfitAndLoss;
