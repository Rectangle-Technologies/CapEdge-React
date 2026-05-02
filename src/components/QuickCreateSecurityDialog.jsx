import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { post } from 'utils/apiUtil';
import { showErrorSnackbar, showSuccessSnackbar } from 'store/utils';

const SECURITY_TYPES = ['EQUITY', 'FUTURES', 'OPTIONS', 'COMMODITY', 'MUTUAL_FUND'];

const QuickCreateSecurityDialog = ({ open, initialName, initialIsin, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('EQUITY');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName || '');
      setType('EQUITY');
    }
  }, [open, initialName]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await post('/security/create', { name: name.trim(), type });
      const created = res?.security || res;
      showSuccessSnackbar(`Security "${created.name}" created`);
      onCreated({ _id: created._id, name: created.name, type: created.type });
      onClose();
    } catch (err) {
      showErrorSnackbar(err.message || 'Failed to create security');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Security</DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {initialIsin && (
              <Typography variant="caption" color="text.secondary">
                ISIN from contract: <strong>{initialIsin}</strong>
              </Typography>
            )}
            <TextField
              fullWidth
              label="Security Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="e.g., NIPPON INDIA ETF LIQUID BEES"
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={type} label="Type" onChange={(e) => setType(e.target.value)}>
                {SECURITY_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting || !name.trim()}>
            Create & Map
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default QuickCreateSecurityDialog;
