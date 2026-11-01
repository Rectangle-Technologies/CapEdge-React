import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  TextField,
  Typography,
  Divider,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Collapse,
  IconButton,
  Button,
  Tooltip
} from '@mui/material';
import {
  ShowChart as ShowChartIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  EditNote as EditNoteIcon,
  EditOutlined as EditOutlinedIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'utils/apiUtil';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate, formatDateForFileName } from 'utils/formatDate';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { showErrorSnackbar } from 'store/utils';
import { fetchHoldings, transformHoldingData } from './services/holdingsService';
import SecurityAutocomplete from 'components/SecurityAutocomplete';
import ExportToExcelButton from 'components/ExportToExcelButton';
import ManageTransactionsPanel from './components/ManageTransactionsPanel';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

const Holdings = () => {
  const dispatch = useDispatch();
  const userAccount = useSelector((state) => state.app.currentUserAccount);
  const financialYear = useSelector((state) => state.app.financialYear);

  const [holdings, setHoldings] = useState([]);
  const [expandedSecurity, setExpandedSecurity] = useState(null);
  const [dematAccounts, setDematAccounts] = useState([]);
  const [selectedDematAccount, setSelectedDematAccount] = useState('');
  const [selectedSecurity, setSelectedSecurity] = useState(null);
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [totalHoldingValue, setTotalHoldingValue] = useState(0);
  const [totalSecurities, setTotalSecurities] = useState(0);
  const [manageTarget, setManageTarget] = useState(null); // { securityId, securityName, highlightTransactionId } while the Manage transactions panel is open
  const [panelBusy, setPanelBusy] = useState({ saving: false, formOpen: false }); // reported by the panel
  const { menuMaster } = useGetMenuMaster();
  const sidebarBeforeManage = useRef(null); // the left menu's state to restore when the panel closes
  const [latestFinancialYearId, setLatestFinancialYearId] = useState(null);
  const tableContainerRef = useRef(null);
  const rowRefs = useRef([]);
  const loadSeq = useRef(0);

  const toggleExpand = useCallback((securityId) => {
    setExpandedSecurity((prev) => (prev === securityId ? null : securityId));
  }, []);

  const groupHoldingsBySecurity = (holdingsData) => {
    const grouped = {};

    holdingsData.forEach((holding) => {
      const key = holding.securityId;

      if (!grouped[key]) {
        grouped[key] = {
          securityId: key,
          securityName: holding.securityName,
          securityType: holding.securityType,
          totalQuantity: 0,
          totalInvestment: 0,
          holdings: []
        };
      }

      grouped[key].holdings.push(holding);
      grouped[key].totalQuantity += holding.quantity;
      grouped[key].totalInvestment += holding.totalInvestment;
    });

    // Calculate average buy price for each group
    Object.values(grouped).forEach((group) => {
      group.avgBuyPrice = group.totalQuantity > 0 ? group.totalInvestment / group.totalQuantity : 0;
    });

    return Object.values(grouped);
  };

  const calculateSummary = (groupedHoldings) => {
    const totalInvestment = groupedHoldings.reduce((sum, group) => sum + group.totalInvestment, 0);
    const totalHoldings = groupedHoldings.length;

    return { totalInvestment, totalHoldings };
  };

  const groupedHoldings = useMemo(() => groupHoldingsBySecurity(holdings), [holdings]);
  const summary = useMemo(() => calculateSummary(groupedHoldings), [groupedHoldings]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // The Manage transactions drawer has its own form and dialogs: these shortcuts must not touch them
      if (manageTarget) return;
      if (event.target?.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;

      // Handle Enter key to expand/collapse active row
      if (event.key === 'Enter') {
        event.preventDefault();
        if (activeRowIndex !== -1 && groupedHoldings.length > 0) {
          const group = groupedHoldings[activeRowIndex];
          toggleExpand(group.securityId);
        }
        return;
      }

      // Handle Alt+up/down arrow keys for row navigation
      if (groupedHoldings.length === 0) return;

      if (event.altKey && event.key === 'ArrowDown' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex < groupedHoldings.length - 1 ? prevIndex + 1 : prevIndex;
          // Scroll to the active row
          if (rowRefs.current[newIndex]) {
            rowRefs.current[newIndex].scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }
          return newIndex;
        });
      } else if (event.altKey && event.key === 'ArrowUp' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex > 0 ? prevIndex - 1 : 0;
          // Scroll to the active row
          if (rowRefs.current[newIndex]) {
            rowRefs.current[newIndex].scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }
          return newIndex;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [groupedHoldings, activeRowIndex, toggleExpand, manageTarget]);

  // Reset active row when holdings change
  useEffect(() => {
    setActiveRowIndex(-1);
    rowRefs.current = [];
  }, [holdings]);

  const fetchDematAccounts = async () => {
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
    }
  };

  // silent: refresh without the full-screen loader (used after a change made in the Manage transactions drawer)
  const loadHoldings = async ({ silent = false } = {}) => {
    if (!selectedDematAccount) return null;

    const seq = ++loadSeq.current;
    if (!silent) dispatch(showLoader());
    try {
      const securityId = selectedSecurity?._id || null;
      const data = await fetchHoldings(null, 1, selectedDematAccount, securityId, financialYear?._id);

      if (data?.holdings) {
        const transformedHoldings = data.holdings.map(transformHoldingData);
        // a newer load has started: this answer is stale
        if (seq === loadSeq.current) {
          setHoldings(transformedHoldings);
          setTotalHoldingValue(data.totalHoldingValue || 0);
          setTotalSecurities(data.totalSecurities || 0);
        }
        return transformedHoldings;
      }
      return null;
    } catch (error) {
      showErrorSnackbar(error.message || 'Failed to load holdings. Please try again.');
      return null;
    } finally {
      if (!silent) dispatch(hideLoader());
    }
  };

  // After a transaction change: reload the holdings and report the security's new total quantity
  // (a number, null = no shares left, undefined = the reload failed).
  const reloadAfterChange = async () => {
    const securityId = manageTarget?.securityId;
    const reloaded = await loadHoldings({ silent: true });
    if (!reloaded) return undefined;
    const quantity = reloaded.filter((holding) => holding.securityId === securityId).reduce((sum, holding) => sum + holding.quantity, 0);
    return quantity > 0 ? quantity : null;
  };

  // Transactions can only be changed while the newest financial year is selected: that is the year the live holdings belong to
  // (the list is sorted newest first). In a past year the Holdings page shows a snapshot.
  useEffect(() => {
    const loadLatestFinancialYear = async () => {
      try {
        const data = await get('/financial-year/get-all');
        setLatestFinancialYearId(data?.financialYears?.[0]?._id || null);
      } catch (error) {
        console.error('Error fetching financial years:', error); // managing transactions stays disabled
      }
    };
    loadLatestFinancialYear();
  }, []);

  useEffect(() => {
    if (userAccount?._id) {
      fetchDematAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAccount]);

  useEffect(() => {
    if (selectedDematAccount) {
      loadHoldings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDematAccount, selectedSecurity, financialYear]);

  const canManage = !!latestFinancialYearId && financialYear?._id === latestFinancialYearId;
  const manageDisabledReason = 'Switch to the current financial year to edit transactions';
  const selectedDematLabel = (() => {
    const account = dematAccounts.find((a) => a._id === selectedDematAccount);
    return account?.brokerId?.name || account?.accountNumber || '';
  })();
  const managing = !!manageTarget;
  const openManage = (securityId, securityName, highlightTransactionId = null) => {
    if (panelBusy.saving) return; // a save is running
    if (
      manageTarget &&
      manageTarget.securityId !== securityId &&
      panelBusy.formOpen &&
      !window.confirm('Discard the transaction you are editing?')
    )
      return;
    setManageTarget({ securityId, securityName, highlightTransactionId });
  };

  // While transactions are managed the left menu collapses to give the two sides room; it comes back as it was when the panel closes
  useEffect(() => {
    if (managing && sidebarBeforeManage.current === null) {
      sidebarBeforeManage.current = menuMaster?.isDashboardDrawerOpened ?? false;
      handlerDrawerOpen(false);
    } else if (!managing && sidebarBeforeManage.current !== null) {
      handlerDrawerOpen(sidebarBeforeManage.current);
      sidebarBeforeManage.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managing]);
  useEffect(
    () => () => {
      if (sidebarBeforeManage.current !== null) handlerDrawerOpen(sidebarBeforeManage.current); // leaving the page with the panel open
    },
    []
  );

  // The panel belongs to one demat account and to the current financial year
  useEffect(() => {
    setManageTarget(null);
  }, [selectedDematAccount]);
  useEffect(() => {
    if (manageTarget && !canManage && !panelBusy.saving) setManageTarget(null);
  }, [canManage, panelBusy.saving, manageTarget]);

  // While a save runs nothing on the holdings side can be clicked
  const lockSx = panelBusy.saving ? { pointerEvents: 'none', opacity: 0.6 } : {};

  const getExportData = () => {
    const allHoldings = groupedHoldings.flatMap((group) => group.holdings);

    return allHoldings.map((holding) => ({
      'Buy Date': formatDate(holding.buyDate),
      Security: holding.securityName,
      Type: holding.securityType,
      Quantity: holding.quantity,
      'Buy Price': holding.buyPrice,
      Investment: holding.totalInvestment,
      Broker: holding.broker || 'N/A'
    }));
  };

  return (
    <Box
      sx={{
        // While managing, the page claims the layout's own side padding (24px + 16px per side) so the two panels use the full width
        width: { xs: '100%', md: managing ? 'auto' : '100%' },
        mx: { md: managing ? -5 : 0 },
        px: { xs: 3, md: managing ? 1 : 3 },
        py: 3,
        display: 'grid',
        columnGap: managing ? 1.5 : 2,
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: managing ? 'minmax(0, 2fr) minmax(0, 3fr)' : 'minmax(0, 1fr)' } // 40% | 60% while managing
      }}
    >
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3, gridColumn: 1, minWidth: 0, ...lockSx }}>
        <Grid size={{ xs: 12, sm: 6, md: managing ? 12 : 6 }}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    Total Investment
                  </Typography>
                  <Typography variant="h4">{formatCurrency(totalHoldingValue)}</Typography>
                </Box>
                <ShowChartIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: managing ? 12 : 6 }}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Total Securities
              </Typography>
              <Typography variant="h4">{totalSecurities}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table Card */}
      <Card sx={{ gridColumn: 1, minWidth: 0, ...lockSx }}>
        <CardHeader
          title="Current Holdings"
          subheader="View all of your holdings as of now"
          action={
            !managing && (
              <ExportToExcelButton
                data={getExportData()}
                filename={`holdings_${formatDateForFileName()}`}
                title="Export Holdings to Excel"
                dematAccountId={selectedDematAccount}
                dematAccountLabel={(() => {
                  const account = dematAccounts.find((a) => a._id === selectedDematAccount);
                  return account?.brokerId?.name || account?.accountNumber || '';
                })()}
              />
            )
          }
        />
        <Divider />

        {/* Filters */}
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: managing ? 12 : 3 }}>
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

            <Grid size={{ xs: 12, md: managing ? 12 : 3 }}>
              <SecurityAutocomplete
                value={selectedSecurity}
                onChange={setSelectedSecurity}
                label="Security (Optional)"
                size="small"
                required={false}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, md: managing ? 12 : 3 }}>
              <Tooltip title={!canManage ? manageDisabledReason : !selectedSecurity ? 'Choose a security first' : ''}>
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<EditNoteIcon />}
                    disabled={!canManage || !selectedSecurity}
                    onClick={() => openManage(selectedSecurity._id, selectedSecurity.name)}
                  >
                    Manage transactions
                  </Button>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <TableContainer component={Paper} ref={tableContainerRef}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={50} />
                <TableCell>
                  <strong>Security</strong>
                </TableCell>
                {!managing && (
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                )}
                <TableCell align="right">
                  <strong>Total Qty</strong>
                </TableCell>
                {!managing && (
                  <TableCell align="right">
                    <strong>Avg Buy Price</strong>
                  </TableCell>
                )}
                <TableCell align="right">
                  <strong>Total Investment</strong>
                </TableCell>
                <TableCell width={60} />
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedHoldings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={managing ? 5 : 7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No holdings found. Buy securities to see them here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                groupedHoldings.map((group, index) => (
                  <React.Fragment key={group.securityId}>
                    {/* Main row - Aggregated by security */}
                    <TableRow
                      hover
                      selected={activeRowIndex === index || manageTarget?.securityId === group.securityId}
                      sx={{
                        '& > *': { borderBottom: 'unset' },
                        cursor: 'pointer',
                        backgroundColor: index % 2 === 1 ? 'rgba(0, 0, 0, 0.02)' : 'inherit'
                      }}
                      ref={(el) => (rowRefs.current[index] = el)}
                      onClick={() => setActiveRowIndex(index)}
                    >
                      <TableCell>
                        <IconButton size="small" onClick={() => toggleExpand(group.securityId)}>
                          {expandedSecurity === group.securityId ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {group.securityName}
                        </Typography>
                      </TableCell>
                      {!managing && (
                        <TableCell>
                          <Chip label={group.securityType} size="small" variant="outlined" color="primary" />
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {group.totalQuantity}
                        </Typography>
                      </TableCell>
                      {!managing && <TableCell align="right">{formatCurrency(group.avgBuyPrice)}</TableCell>}
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(group.totalInvestment)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={canManage ? 'Manage transactions' : manageDisabledReason}>
                          <span>
                            <IconButton
                              size="small"
                              aria-label={`Manage transactions for ${group.securityName}`}
                              disabled={!canManage}
                              onClick={(event) => {
                                event.stopPropagation();
                                openManage(group.securityId, group.securityName);
                              }}
                            >
                              <EditNoteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Expanded rows - Individual holdings */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={managing ? 5 : 7}>
                        <Collapse in={expandedSecurity === group.securityId} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2 }}>
                              Individual Holdings ({group.holdings.length})
                            </Typography>
                            <Table size="small" aria-label="holdings detail">
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'background.neutral' }}>
                                  <TableCell>Buy Date</TableCell>
                                  <TableCell>Broker</TableCell>
                                  <TableCell align="right">Quantity</TableCell>
                                  <TableCell align="right">Buy Price</TableCell>
                                  <TableCell align="right">Investment</TableCell>
                                  <TableCell width={50} />
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {group.holdings.map((holding, holdingIndex) => (
                                  <TableRow
                                    key={holding.id}
                                    sx={{ backgroundColor: holdingIndex % 2 === 1 ? 'rgba(0, 0, 0, 0.02)' : 'inherit' }}
                                  >
                                    <TableCell>{formatDate(holding.buyDate)}</TableCell>
                                    <TableCell>{holding.broker || 'N/A'}</TableCell>
                                    <TableCell align="right">{holding.quantity}</TableCell>
                                    <TableCell align="right">{formatCurrency(holding.buyPrice)}</TableCell>
                                    <TableCell align="right">{formatCurrency(holding.totalInvestment)}</TableCell>
                                    <TableCell align="right">
                                      <Tooltip title={canManage ? 'Edit the transaction behind this lot' : manageDisabledReason}>
                                        <span>
                                          <IconButton
                                            size="small"
                                            aria-label="Edit the transaction behind this lot"
                                            disabled={!canManage}
                                            onClick={() => openManage(group.securityId, group.securityName, holding.transactionId)}
                                          >
                                            <EditOutlinedIcon fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {managing && (
        <Box
          sx={{
            order: { xs: -1, md: 0 }, // stacked above the table on a narrow screen
            gridColumn: { md: 2 },
            gridRow: { md: '1 / span 2' },
            minWidth: 0,
            position: { md: 'sticky' },
            top: { md: 90 },
            alignSelf: 'start'
          }}
        >
          <ManageTransactionsPanel
            key={manageTarget.securityId}
            onClose={() => setManageTarget(null)}
            onBusyChange={setPanelBusy}
            security={{ _id: manageTarget.securityId, name: manageTarget.securityName }}
            demat={{ _id: selectedDematAccount, label: selectedDematLabel }}
            financialYearTitle={financialYear?.title}
            currentQuantity={groupedHoldings.find((group) => group.securityId === manageTarget.securityId)?.totalQuantity ?? 0}
            currentInvestment={groupedHoldings.find((group) => group.securityId === manageTarget.securityId)?.totalInvestment ?? 0}
            highlightTransactionId={manageTarget.highlightTransactionId}
            onChanged={reloadAfterChange}
          />
        </Box>
      )}
    </Box>
  );
};

export default Holdings;
