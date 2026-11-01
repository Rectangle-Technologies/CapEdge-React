import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Snackbar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate } from 'utils/formatDate';
import { createTrade, deleteTrade, editTrade, fetchSecurityTransactions, isUnknownOutcome } from '../services/manageTransactions';
import {
  buildTransactionPayload,
  contractSiblings,
  decideOutcome,
  dayString,
  friendlyServerMessage,
  isLockedTransaction,
  validateTransactionForm
} from '../services/manageTransactionsLogic';

const FIELD_HEIGHT = 32; // px, every input in an editable row
const WAIT_HINT = 'Saving... this can take up to about 30 seconds for old dates';

const emptyForm = () => ({
  date: dayjs().format('YYYY-MM-DD'),
  type: 'BUY',
  quantity: '',
  price: '',
  transactionCost: '',
  referenceNumber: ''
});

const formFromTransaction = (tx) => ({
  date: dayString(tx.date),
  type: tx.type,
  quantity: String(tx.quantity),
  price: String(tx.price),
  transactionCost: tx.transactionCost ? String(tx.transactionCost) : '',
  referenceNumber: tx.referenceNumber || ''
});

/**
 * Add / edit / delete the transactions of one security in one demat account without leaving the Holdings page.
 * Holdings are derived from the transactions, so nothing here edits a holding: every save changes a transaction and the
 * server recalculates the holdings.
 * Shown beside the holdings table (the page gives it 60% of the width). Mounted per security: the page gives it key={securityId}.
 *
 * props: onClose, security { _id, name }, demat { _id, label }, financialYearTitle, currentQuantity, currentInvestment,
 *        highlightTransactionId (the BUY behind the lot the user clicked), onChanged() => Promise<number|null|undefined>
 *        (reloads the page's holdings, resolves to the security's new total quantity),
 *        onBusyChange({ saving, formOpen }) so the page can lock the holdings side while a save is running
 */
const ManageTransactionsPanel = ({
  onClose,
  onBusyChange,
  security,
  demat,
  financialYearTitle,
  currentQuantity,
  currentInvestment,
  highlightTransactionId,
  onChanged
}) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [mode, setMode] = useState(null); // null | { kind: 'add' } | { kind: 'edit', tx }
  const [form, setForm] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { severity, text }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const loadSeq = useRef(0);
  const highlightRef = useRef(null);
  const panelRef = useRef(null);

  const securityId = security?._id;
  const dematAccountId = demat?._id;

  const loadList = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setLoadError('');
    try {
      const transactions = await fetchSecurityTransactions(securityId, dematAccountId);
      if (seq === loadSeq.current) setList(transactions);
      return transactions;
    } catch (error) {
      if (seq === loadSeq.current) setLoadError(error.message || 'Could not load the transactions.');
      return null;
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [securityId, dematAccountId]);

  useEffect(() => {
    setMode(null);
    setMessage(null);
    setFieldErrors({});
    setList([]);
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!loading && highlightRef.current) highlightRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [loading, list, highlightTransactionId]);

  // on a narrow screen the panel is stacked above the table: bring it into view
  useEffect(() => {
    if (window.matchMedia?.('(max-width: 899.95px)').matches) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // the page locks the holdings side while a save runs and asks before it drops an open form
  useEffect(() => {
    onBusyChange?.({ saving, formOpen: !!mode });
  }, [saving, mode, onBusyChange]);
  useEffect(() => () => onBusyChange?.({ saving: false, formOpen: false }), [onBusyChange]);

  const siblingsOfEdited = useMemo(() => (mode?.kind === 'edit' ? contractSiblings(mode.tx, list) : []), [mode, list]);

  const startAdd = () => {
    setMessage(null);
    setFieldErrors({});
    setForm(emptyForm());
    setMode({ kind: 'add' });
  };

  const startEdit = (tx) => {
    setMessage(null);
    setFieldErrors({});
    setForm(formFromTransaction(tx));
    setMode({ kind: 'edit', tx });
  };

  const setField = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));

  // The change is in: refresh the list and the page's holdings, tell the user the effect, keep the panel open for the next fix.
  const finishSaved = async (text) => {
    setMode(null);
    const previousQuantity = currentQuantity;
    await loadList();
    const newQuantity = await onChanged();
    const quantityText =
      newQuantity === undefined
        ? '(the holdings could not be refreshed: reload the page)'
        : newQuantity === null
          ? 'no shares left'
          : `${newQuantity} shares`;
    setMessage({ severity: 'success', text: `${text} ${security.name}: ${previousQuantity} -> ${quantityText}.` });
  };

  // No answer came back, so the change may or may not be saved. Never retry blindly (a retry of an add would duplicate the trade):
  // read the list again and compare it with the list from before the save.
  const resolveUnknownOutcome = async (before, action) => {
    const after = await loadList();
    if (!after) {
      setMessage({
        severity: 'warning',
        text: 'The server did not answer and the list could not be read again. Close this panel, reload the page and check the transactions before trying again.'
      });
      return;
    }
    const outcome = decideOutcome(before, after, action);
    if (outcome === 'saved') {
      await finishSaved('Saved (confirmed after a delay).');
    } else if (outcome === 'not_saved') {
      setMessage({ severity: 'error', text: 'The server did not answer and the change was NOT saved. You can try again.' });
    } else {
      setMessage({
        severity: 'warning',
        text: 'The server did not answer and I cannot tell whether the change was saved. Check the list below before trying again.'
      });
    }
  };

  const runSave = async (action, before, send) => {
    setSaving(true);
    setMessage(null);
    try {
      await send();
      await finishSaved('Saved.');
    } catch (error) {
      if (isUnknownOutcome(error)) await resolveUnknownOutcome(before, action);
      else setMessage({ severity: 'error', text: friendlyServerMessage(error.message, action.kind) || 'Could not save the change.' }); // the server said no: nothing was saved
    } finally {
      setSaving(false);
    }
  };

  const submitForm = async () => {
    const errors = validateTransactionForm(form, dayjs().format('YYYY-MM-DD'), mode.kind);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = buildTransactionPayload(form, { securityId, dematAccountId });
    const before = list;
    if (mode.kind === 'add') {
      await runSave({ kind: 'add', form }, before, () => createTrade(payload));
    } else {
      const id = mode.tx._id;
      await runSave({ kind: 'edit', form, id }, before, () => editTrade(id, payload));
    }
  };

  const confirmDelete = async () => {
    const tx = deleteTarget;
    setDeleteTarget(null);
    await runSave({ kind: 'delete', id: tx._id }, list, () => deleteTrade(tx._id));
  };

  const handleClose = () => {
    if (saving) return; // leaving mid-save would hide the outcome
    if (mode && !window.confirm('Discard the transaction you are editing?')) return;
    onClose();
  };

  const deleteSiblings = deleteTarget ? contractSiblings(deleteTarget, list) : [];

  const cancelEdit = () => {
    if (saving) return;
    setMode(null);
    setFieldErrors({});
    setMessage((current) => (current?.severity === 'error' ? null : current)); // a refused save is no longer relevant once the row is closed
  };

  // Enter saves, Escape cancels (only from the plain inputs: the date popup and the Type list handle their own keys)
  const onEditKeyDown = (event) => {
    const target = event.target;
    if (target.tagName !== 'INPUT' || saving) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      submitForm();
    } else if (event.key === 'Escape' && (target.type === 'number' || target.getAttribute('aria-label') === 'Reference number')) {
      event.preventDefault();
      cancelEdit();
    }
  };

  // The row itself turns into inputs: no labels needed, the column headers say what each one is
  // One fixed height for every control in the row. The date field is built from other parts (sections instead of an <input>) than the text,
  // number and select fields, so each kind needs its own selector to land on the same height.
  const compactSx = {
    '& .MuiInputBase-root, & .MuiPickersInputBase-root': { height: FIELD_HEIGHT, boxSizing: 'border-box' },
    '& .MuiInputBase-input': { py: 0, px: 1, height: '100%', boxSizing: 'border-box', fontSize: '0.8125rem' },
    '& .MuiPickersInputBase-root': { pl: 1, pr: 0.5 },
    '& .MuiPickersInputBase-sectionsContainer': { py: 0, px: 0, fontSize: '0.8125rem', alignItems: 'center' },
    '& .MuiSelect-select': {
      py: 0,
      px: 1,
      minHeight: 0,
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      boxSizing: 'border-box',
      fontSize: '0.8125rem'
    }
  };
  const numberField = (label, field, extra = {}) => (
    <TextField
      size="small"
      type="number"
      value={form[field]}
      onChange={setField(field)}
      disabled={saving}
      error={!!fieldErrors[field]}
      sx={{ ...compactSx, width: '100%' }}
      slotProps={{ htmlInput: { min: 0, step: 'any', 'aria-label': label, style: { textAlign: 'right' } } }}
      {...extra}
    />
  );
  const renderEditRow = (kind, tx) => {
    const errorText = Object.values(fieldErrors).join(' · ');
    const note =
      kind === 'add'
        ? 'Trades with the same reference number are grouped as one contract.'
        : siblingsOfEdited.length > 0
          ? `This trade is part of a contract with ${siblingsOfEdited.length} other trade(s) (reference ${tx.referenceNumber}). Saving puts this trade's amount in its own ledger entry; the totals stay correct. It will also move to the end of its date in the list.`
          : '';
    return (
      <>
        <TableRow onKeyDown={onEditKeyDown} sx={{ bgcolor: 'primary.lighter', '& td': { borderBottom: 'none', verticalAlign: 'top' } }}>
          <TableCell>
            {kind === 'edit' ? (
              <Typography variant="body2" sx={{ overflowWrap: 'anywhere', pt: 0.75, fontSize: '0.8125rem' }}>
                {tx.referenceNumber}
              </Typography>
            ) : (
              <TextField
                size="small"
                fullWidth
                placeholder="Reference no."
                autoFocus
                value={form.referenceNumber}
                onChange={setField('referenceNumber')}
                disabled={saving}
                error={!!fieldErrors.referenceNumber}
                sx={compactSx}
                slotProps={{ htmlInput: { 'aria-label': 'Reference number' } }}
              />
            )}
          </TableCell>
          <TableCell>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={form.date ? dayjs(form.date) : null}
                format="DD/MM/YYYY"
                maxDate={dayjs()}
                disabled={saving}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, date: value && value.isValid() ? value.format('YYYY-MM-DD') : '' }))
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    error: !!fieldErrors.date,
                    sx: { ...compactSx, width: '100%' },
                    inputProps: { 'aria-label': 'Transaction date' }
                  },
                  openPickerButton: { size: 'small' }
                }}
              />
            </LocalizationProvider>
          </TableCell>
          <TableCell sx={{ minWidth: 90 }}>
            <TextField
              select
              size="small"
              value={form.type}
              onChange={setField('type')}
              disabled={saving}
              sx={compactSx}
              slotProps={{ select: { SelectDisplayProps: { 'aria-label': 'Type' } } }}
            >
              <MenuItem value="BUY">BUY</MenuItem>
              <MenuItem value="SELL">SELL</MenuItem>
            </TextField>
          </TableCell>
          <TableCell align="right">{numberField('Quantity', 'quantity')}</TableCell>
          <TableCell align="right">{numberField('Price', 'price', { sx: { ...compactSx, width: '100%' } })}</TableCell>
          <TableCell align="right">{formatCurrency((Number(form.quantity) || 0) * (Number(form.price) || 0))}</TableCell>
          <TableCell align="right">{numberField('Transaction cost', 'transactionCost', { placeholder: 'Cost' })}</TableCell>
          <TableCell align="right" sx={{ whiteSpace: 'nowrap', position: 'sticky', right: 0, zIndex: 1, bgcolor: 'primary.lighter' }}>
            <Tooltip title="Save">
              <span>
                <IconButton size="small" color="success" aria-label="Save" onClick={submitForm} disabled={saving}>
                  {saving ? <CircularProgress size={18} /> : <CheckIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Cancel">
              <span>
                <IconButton size="small" aria-label="Cancel" onClick={cancelEdit} disabled={saving}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </TableCell>
        </TableRow>
        <TableRow sx={{ bgcolor: 'primary.lighter' }}>
          <TableCell colSpan={8} sx={{ pt: 0, pb: 1 }}>
            {saving ? (
              <Typography variant="caption">{WAIT_HINT}</Typography>
            ) : errorText ? (
              <Typography variant="caption" color="error">
                {errorText}
              </Typography>
            ) : (
              note && (
                <Typography variant="caption" color="text.secondary">
                  {note}
                </Typography>
              )
            )}
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <Paper
      variant="outlined"
      component="section"
      id="manage-transactions-panel"
      ref={panelRef}
      aria-labelledby="manage-transactions-title"
      sx={{ display: 'flex', flexDirection: 'column', maxHeight: { md: 'calc(100vh - 120px)' }, overflow: 'hidden', scrollMarginTop: 80 }}
    >
      {saving && <LinearProgress />}
      <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography id="manage-transactions-title" variant="h5">
              Manage transactions
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold">
              {security?.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center" flexWrap="wrap">
              <Chip size="small" label={demat?.label || 'Demat account'} />
              {financialYearTitle && <Chip size="small" variant="outlined" label={financialYearTitle} />}
              <Typography variant="body2" color="text.secondary">
                Current holding: <strong>{currentQuantity ?? 0}</strong> shares
              </Typography>
            </Stack>
          </Box>
          <Tooltip title={saving ? 'Wait for the save to finish' : 'Close'}>
            <span>
              <IconButton aria-label="Close" onClick={handleClose} disabled={saving}>
                <CloseIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Alert severity="info" sx={{ mt: 2 }}>
          Holdings are calculated from the transactions. Add, change or delete a transaction here and the holdings update. Intraday and IPO
          trades are edited on the Transactions page.
        </Alert>

        {/* Fixed to the bottom of the window so the result is visible wherever the list is scrolled. Errors stay until closed. */}
        <Snackbar
          open={!!message}
          disablePortal
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          autoHideDuration={message?.severity === 'success' ? 6000 : null}
          onClose={(event, reason) => {
            if (reason !== 'clickaway' && !saving) setMessage(null);
          }}
        >
          <Alert
            severity={message?.severity || 'info'}
            variant="filled"
            sx={{ width: '100%', maxWidth: 560 }}
            onClose={saving ? undefined : () => setMessage(null)}
          >
            {message?.text}
          </Alert>
        </Snackbar>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 1 }}>
          <Typography variant="h6">Transactions ({list.length})</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={startAdd} disabled={saving || loading || !!mode}>
            Add transaction
          </Button>
        </Stack>

        <Divider sx={{ mb: 1 }} />

        {loadError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={loadList}>
                Retry
              </Button>
            }
          >
            {loadError}
          </Alert>
        )}

        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="transactions" sx={{ tableLayout: 'fixed', minWidth: 770, '& .MuiTableCell-root': { px: 1 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 108 }}>Reference</TableCell>
                <TableCell sx={{ width: 128 }}>Date</TableCell>
                <TableCell sx={{ width: 110 }}>Type</TableCell>
                <TableCell align="right" sx={{ width: 76 }}>
                  Quantity
                </TableCell>
                <TableCell align="right" sx={{ width: 84 }}>
                  Price
                </TableCell>
                <TableCell align="right" sx={{ width: 98 }}>
                  Amount
                </TableCell>
                <TableCell align="right" sx={{ width: 76 }}>
                  Cost
                </TableCell>
                <TableCell align="right" sx={{ width: 76 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {mode?.kind === 'add' && renderEditRow('add')}
              {loading && list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && !loadError && list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No transactions for this security in this demat account.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {list.map((tx) => {
                if (mode?.kind === 'edit' && String(mode.tx._id) === String(tx._id))
                  return <Fragment key={tx._id}>{renderEditRow('edit', tx)}</Fragment>;
                const locked = isLockedTransaction(tx);
                const highlighted = highlightTransactionId && String(tx._id) === String(highlightTransactionId);
                return (
                  <TableRow key={tx._id} ref={highlighted ? highlightRef : undefined} selected={!!highlighted}>
                    <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.referenceNumber}>
                      {tx.referenceNumber}
                    </TableCell>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`${tx.deliveryType === 'Intraday' ? 'INTRADAY ' : tx.isIpo ? 'IPO ' : ''}${tx.type}`}
                        color={tx.type === 'BUY' ? 'success' : 'error'}
                        variant="outlined"
                        sx={{
                          height: 'auto',
                          minHeight: 24,
                          '& .MuiChip-label': { px: 0.75, py: 0.25, whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.2 }
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">{tx.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(tx.price)}</TableCell>
                    <TableCell align="right">{formatCurrency(tx.quantity * tx.price)}</TableCell>
                    <TableCell align="right">{tx.transactionCost ? formatCurrency(tx.transactionCost) : '-'}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {locked ? (
                        <Tooltip title="Intraday and IPO trades cannot be edited here. Edit them on the Transactions page.">
                          <LockOutlinedIcon fontSize="small" color="disabled" aria-label="Edit on the Transactions page" />
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip title="Edit transaction">
                            <span>
                              <IconButton
                                size="small"
                                aria-label="Edit transaction"
                                disabled={saving || !!mode}
                                onClick={() => startEdit(tx)}
                              >
                                <EditOutlinedIcon fontSize="small" color="primary" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete transaction">
                            <span>
                              <IconButton
                                size="small"
                                aria-label="Delete transaction"
                                disabled={saving || !!mode}
                                onClick={() => setDeleteTarget(tx)}
                              >
                                <DeleteOutlineIcon fontSize="small" color="error" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            {!loading && list.length > 0 && (
              <TableFooter>
                <TableRow
                  sx={{ '& td': { fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', borderTop: 2, borderColor: 'divider' } }}
                >
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell align="right">{currentQuantity ?? 0}</TableCell>
                  <TableCell />
                  <TableCell align="right">{formatCurrency(currentInvestment ?? 0)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} aria-labelledby="delete-transaction-title">
        <DialogTitle id="delete-transaction-title">Delete this transaction?</DialogTitle>
        <DialogContent>
          {deleteTarget && (
            <DialogContentText component="div">
              {deleteTarget.type} of {deleteTarget.quantity} at {formatCurrency(deleteTarget.price)} dated {formatDate(deleteTarget.date)}{' '}
              (reference {deleteTarget.referenceNumber}).
              <br />
              <br />
              This trade's amount is taken out of its ledger entry and the holdings are recalculated.
              {deleteSiblings.length > 0 && ` It is part of a contract with ${deleteSiblings.length} other trade(s), which stay.`} The
              server refuses the delete if later sales depend on it.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ManageTransactionsPanel;
