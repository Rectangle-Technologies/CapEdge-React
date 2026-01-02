import { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import { HelpOutline as HelpIcon, Close as CloseIcon } from '@mui/icons-material';

const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const shortcuts = [
    {
      section: 'Security Master',
      items: [
        { keys: ['Alt', 'N'], description: 'Add new security' },
        { keys: ['Alt', 'E'], description: 'Edit selected security' },
        { keys: ['Alt', 'Delete'], description: 'Delete selected security' },
        { keys: ['Alt', '←'], description: 'Previous page' },
        { keys: ['Alt', '→'], description: 'Next page' },
        { keys: ['Alt', '↓'], description: 'Navigate to next row' },
        { keys: ['Alt', '↑'], description: 'Navigate to previous row' }
      ]
    },
    {
      section: 'Broker Master',
      items: [
        { keys: ['Alt', 'N'], description: 'Add new broker' },
        { keys: ['Alt', 'E'], description: 'Edit selected broker' },
        { keys: ['Alt', 'Delete'], description: 'Delete selected broker' },
        { keys: ['Alt', '←'], description: 'Previous page' },
        { keys: ['Alt', '→'], description: 'Next page' },
        { keys: ['Alt', '↓'], description: 'Navigate to next row' },
        { keys: ['Alt', '↑'], description: 'Navigate to previous row' }
      ]
    },
    {
      section: 'User Account Master',
      items: [
        { keys: ['Alt', 'N'], description: 'Add new user account' },
        { keys: ['Alt', 'E'], description: 'Edit selected user account' },
        { keys: ['Alt', 'Delete'], description: 'Delete selected user account' },
        { keys: ['Alt', '←'], description: 'Previous page' },
        { keys: ['Alt', '→'], description: 'Next page' },
        { keys: ['Alt', '↓'], description: 'Navigate to next row' },
        { keys: ['Alt', '↑'], description: 'Navigate to previous row' },
        { keys: ['Enter'], description: 'Expand/collapse selected row' }
      ]
    },
    {
      section: 'Dashboard Transactions',
      items: [
        { keys: ['Alt', 'N'], description: 'Add a new transaction' },
        { keys: ['Alt', 'Delete'], description: 'Delete selected transaction' },
        { keys: ['Alt', '←'], description: 'Previous page' },
        { keys: ['Alt', '→'], description: 'Next page' },
        { keys: ['Alt', '↓'], description: 'Navigate to next row' },
        { keys: ['Alt', '↑'], description: 'Navigate to previous row' }
      ]
    },
    {
      section: 'Holdings',
      items: [
        { keys: ['Alt', '↓'], description: 'Navigate to next row' },
        { keys: ['Alt', '↑'], description: 'Navigate to previous row' },
        { keys: ['Enter'], description: 'Expand/collapse selected holding group' }
      ]
    },
    {
      section: 'Ledger',
      items: [
        { keys: ['Alt', '←'], description: 'Previous page' },
        { keys: ['Alt', '→'], description: 'Next page' },
        { keys: ['Alt', '↓'], description: 'Navigate to next row' },
        { keys: ['Alt', '↑'], description: 'Navigate to previous row' },
        { keys: ['Enter'], description: 'Expand/collapse selected ledger entry' }
      ]
    }
  ];

  const KeyChip = ({ keyLabel }) => (
    <Chip
      label={keyLabel}
      size="small"
      sx={{
        fontFamily: 'monospace',
        fontWeight: 'bold',
        bgcolor: 'grey.100',
        border: '1px solid',
        borderColor: 'grey.300',
        mx: 0.25
      }}
    />
  );

  return (
    <>
      <IconButton
        onClick={handleOpen}
        color="secondary"
        sx={{
          color: 'text.primary',
          bgcolor: 'grey.100',
          '&:hover': { bgcolor: 'grey.200' }
        }}
        title="Keyboard Shortcuts"
      >
        <HelpIcon />
      </IconButton>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h4" component="div">
              Keyboard Shortcuts
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            All shortcuts use <strong>Alt</strong> on Windows/Linux and <strong>Option</strong> on Mac
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {shortcuts.map((section, idx) => (
            <Box key={idx} sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {section.section}
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Shortcut</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {section.items.map((item, itemIdx) => (
                      <TableRow key={itemIdx} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {item.keys.map((key, keyIdx) => (
                              <KeyChip key={keyIdx} keyLabel={key} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KeyboardShortcuts;
