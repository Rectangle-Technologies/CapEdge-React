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
import { isDerivative } from '../utils/validation';
import { FORM_CONFIG } from '../utils/constants';
import { getSecurityTypeLabel } from '../../../utils/securityTypes';

/**
 * SecurityDialog Component - Handles add/edit security dialog
 */
const SecurityDialog = ({ 
  open, 
  editingSecurity, 
  formik, 
  securityTypes,
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
      <DialogTitle>{editingSecurity ? 'Edit Security' : 'Add New Security'}</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              name="name"
              label="Security Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              placeholder="e.g., Reliance Industries Ltd, NIFTY 50 JAN 2024 CE 18000"
            />

            <FormControl fullWidth>
              <InputLabel>Security Type</InputLabel>
              <Select
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.type && Boolean(formik.errors.type)}
                label="Security Type"
              >
                {securityTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {getSecurityTypeLabel(type)}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.type && formik.errors.type && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                  {formik.errors.type}
                </Typography>
              )}
            </FormControl>

            {isDerivative(formik.values.type) && (
              <>
                <TextField
                  fullWidth
                  name="strikePrice"
                  label="Strike Price"
                  type="number"
                  value={formik.values.strikePrice}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.strikePrice && Boolean(formik.errors.strikePrice)}
                  helperText={formik.touched.strikePrice && formik.errors.strikePrice}
                  slotProps={{
                    input: { startAdornment: '₹' },
                    htmlInput: { min: 0, step: FORM_CONFIG.strikePriceStep }
                  }}
                  placeholder="0.00"
                />
                <TextField
                  fullWidth
                  name="expiry"
                  label="Expiry Date"
                  type="date"
                  value={formik.values.expiry}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.expiry && Boolean(formik.errors.expiry)}
                  helperText={formik.touched.expiry && formik.errors.expiry}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {editingSecurity ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SecurityDialog;