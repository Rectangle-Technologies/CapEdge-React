import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from '@mui/material';
import { FORM_CONFIG } from '../utils/constants';

/**
 * BrokerDialog Component - Handles add/edit broker dialog
 */
const BrokerDialog = ({ 
  open, 
  editingBroker, 
  formik, 
  onClose 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          margin: 0
        }
      }}
    >
      <DialogTitle>{editingBroker ? 'Edit Broker' : 'Add New Broker'}</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              name="name"
              label="Broker Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              placeholder="Enter broker name"
              autoFocus
            />
            <TextField
              fullWidth
              name="panNumber"
              label="PAN Number"
              placeholder="ABCDE1234F"
              value={formik.values.panNumber}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                formik.handleChange(e);
              }}
              onBlur={formik.handleBlur}
              error={formik.touched.panNumber && Boolean(formik.errors.panNumber)}
              helperText={formik.touched.panNumber && formik.errors.panNumber}
              slotProps={{
                htmlInput: {
                  style: { textTransform: 'uppercase' },
                  maxLength: FORM_CONFIG.panNumberMaxLength
                }
              }}
              disabled={!!editingBroker}
            />
            <TextField
              fullWidth
              name="address"
              label="Address"
              multiline
              rows={FORM_CONFIG.addressRows}
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && Boolean(formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
              placeholder="Enter complete address"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {editingBroker ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BrokerDialog;