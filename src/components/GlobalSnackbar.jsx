import { Snackbar, Alert } from '@mui/material';
import { useAppSelector, useAppDispatch } from 'store/hooks';
import { hideSnackbar } from 'store/slices/snackbarSlice';

// ==============================|| GLOBAL SNACKBAR ||============================== //

const GlobalSnackbar = () => {
  const dispatch = useAppDispatch();
  const snackbar = useAppSelector((state) => state.snackbar);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(hideSnackbar());
  };

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={snackbar.autoHideDuration}
      onClose={handleClose}
      anchorOrigin={snackbar.anchorOrigin}
    >
      <Alert
        onClose={handleClose}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;