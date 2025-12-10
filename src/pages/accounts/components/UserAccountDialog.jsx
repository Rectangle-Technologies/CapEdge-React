import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';

/**
 * User Account Form Dialog Component
 * Handles creating and editing user accounts
 */
function UserAccountDialog({ open, onClose, editingUser, userFormik }) {
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
      <DialogTitle fontSize={20} fontWeight="bold">
        {editingUser ? 'Edit User Account' : 'Add New User Account'}
      </DialogTitle>
      <form onSubmit={userFormik.handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            <TextField
              fullWidth
              name="name"
              label="Full Name"
              value={userFormik.values.name}
              onChange={userFormik.handleChange}
              onBlur={userFormik.handleBlur}
              error={userFormik.touched.name && Boolean(userFormik.errors.name)}
              helperText={userFormik.touched.name && userFormik.errors.name}
              placeholder="Enter full name"
              autoFocus
            />
            <TextField
              fullWidth
              name="panNumber"
              label="PAN Number"
              placeholder="ABCDE1234F"
              value={userFormik.values.panNumber}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                userFormik.handleChange(e);
              }}
              onBlur={userFormik.handleBlur}
              error={userFormik.touched.panNumber && Boolean(userFormik.errors.panNumber)}
              helperText={userFormik.touched.panNumber && userFormik.errors.panNumber}
              slotProps={{
                htmlInput: {
                  style: { textTransform: 'uppercase' },
                  maxLength: 10
                }
              }}
              disabled={!!editingUser}
            />
            <TextField
              fullWidth
              name="address"
              label="Address"
              multiline
              rows={3}
              value={userFormik.values.address}
              onChange={userFormik.handleChange}
              onBlur={userFormik.handleBlur}
              error={userFormik.touched.address && Boolean(userFormik.errors.address)}
              helperText={userFormik.touched.address && userFormik.errors.address}
              placeholder="Enter complete address"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default UserAccountDialog;
