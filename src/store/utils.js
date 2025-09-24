import store from 'store';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { showSnackbar, hideSnackbar } from 'store/slices/snackbarSlice';

// ==============================|| REDUX UTILITIES ||============================== //

// Loader utilities
export const setGlobalLoader = (isLoading) => {
  if (isLoading) {
    store.dispatch(showLoader());
  } else {
    store.dispatch(hideLoader());
  }
};

// Snackbar utilities
export const showGlobalSnackbar = (message, severity = 'info', options = {}) => {
  store.dispatch(showSnackbar({
    message,
    severity,
    autoHideDuration: options.autoHideDuration || 6000,
    anchorOrigin: options.anchorOrigin || {
      vertical: 'bottom',
      horizontal: 'left'
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