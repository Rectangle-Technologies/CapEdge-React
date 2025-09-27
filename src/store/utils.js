import store from 'store';
import { hideSnackbar, showSnackbar } from 'store/slices/snackbarSlice';

// ==============================|| REDUX UTILITIES ||============================== //

// Snackbar utilities
export const showGlobalSnackbar = (message, severity = 'info', options = {}) => {
  store.dispatch(showSnackbar({
    message,
    severity,
    autoHideDuration: options.autoHideDuration || 6000,
    anchorOrigin: options.anchorOrigin || {
      vertical: 'top',
      horizontal: 'center',
      autoHideDuration: 2000
    }
  }));
};

export const hideGlobalSnackbar = () => {
  store.dispatch(hideSnackbar());
};

// Convenience methods for different types of snackbars
export const showSuccessSnackbar = (message, options = {}) => {
  showGlobalSnackbar(message, 'success', options);
};

export const showErrorSnackbar = (message, options = {}) => {
  showGlobalSnackbar(message, 'error', options);
};

export const showWarningSnackbar = (message, options = {}) => {
  showGlobalSnackbar(message, 'warning', options);
};

export const showInfoSnackbar = (message, options = {}) => {
  showGlobalSnackbar(message, 'info', options);
};