import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material';

/**
 * Lets the user pick which parsed contract to load into the AddTransaction
 * form when an uploaded PDF contains multiple contracts (e.g., SGSSL
 * multi-client). Picking one removes it from the pending queue.
 */
const ContractPickerDialog = ({ open, contracts, onPick, onClose, title = 'Select a contract to load' }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {contracts.map((c, idx) => (
            <Card key={`${c.contractNoteNo}-${idx}`} variant="outlined">
              <CardActionArea onClick={() => onPick(c, idx)}>
                <Box sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Contract #{c.contractNoteNo}
                    </Typography>
                    <Chip label={c.brokerName} size="small" />
                    {c.duplicate && (
                      <Chip label="Already imported" size="small" color="warning" />
                    )}
                  </Stack>
                  <Typography variant="body1" fontWeight={500}>
                    {c.detectedClient?.name || '—'}
                    {c.detectedClient?.ucc ? ` (UCC ${c.detectedClient.ucc})` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trade Date: {c.tradeDate}
                    {c.matchedDematAccount?.brokerName
                      ? ` · Demat: ${c.matchedDematAccount.brokerName}`
                      : ' · No demat matched'}
                    {` · ${c.lines?.length || 0} entries`}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractPickerDialog;
