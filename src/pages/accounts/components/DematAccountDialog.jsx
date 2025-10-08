import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';

/**
 * Demat Account Form Dialog Component
 * Handles creating and editing demat accounts
 */
function DematAccountDialog({ 
  open, 
  onClose, 
  editingDemat, 
  dematFormik,
  brokers 
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingDemat ? 'Edit Demat Account' : 'Add New Demat Account'}
      </DialogTitle>
      <form onSubmit={dematFormik.handleSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Broker</InputLabel>
              <Select
                name="brokerId"
                value={dematFormik.values.brokerId}
                onChange={dematFormik.handleChange}
                onBlur={dematFormik.handleBlur}
                error={dematFormik.touched.brokerId && Boolean(dematFormik.errors.brokerId)}
                label="Broker"
              >
                {brokers.map((broker) => (
                  <MenuItem key={broker.id} value={broker.id}>
                    {broker.name}
                  </MenuItem>
                ))}
              </Select>
              {dematFormik.touched.brokerId && dematFormik.errors.brokerId && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                  {dematFormik.errors.brokerId}
                </Typography>
              )}
            </FormControl>
            <TextField
              fullWidth
              name="balance"
              label="Initial Balance"
              type="number"
              value={dematFormik.values.balance}
              onChange={dematFormik.handleChange}
              onBlur={dematFormik.handleBlur}
              error={dematFormik.touched.balance && Boolean(dematFormik.errors.balance)}
              helperText={dematFormik.touched.balance && dematFormik.errors.balance}
              InputProps={{
                startAdornment: '₹'
              }}
              placeholder="0.00"
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {editingDemat ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default DematAccountDialog;