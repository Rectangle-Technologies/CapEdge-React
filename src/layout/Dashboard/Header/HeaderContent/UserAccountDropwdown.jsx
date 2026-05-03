import { Autocomplete, Box, TextField } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentUserAccount } from '../../../../store/slices/appSlice';
import { get } from '../../../../utils/apiUtil';
import { showErrorSnackbar } from '../../../../store/utils';
import { hideLoader, showLoader } from '../../../../store/slices/loaderSlice';

const UserAccountDropwdown = () => {
  const dispatch = useDispatch();
  const [userAccounts, setUserAccounts] = useState([]);
  const selectedAccount = useSelector((state) => state.app.currentUserAccount);
  const inputRef = useRef(null);

  // Function to fetch user accounts
  const fetchUserAccounts = useCallback(async () => {
    dispatch(showLoader());
    try {
      const data = await get('/user-account/get-all');
      setUserAccounts(data.userAccounts || []);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      showErrorSnackbar(error.message || 'Failed to fetch user accounts');
    } finally {
      dispatch(hideLoader());
    }
  }, [dispatch]);

  // Keyboard shortcut: Alt+A / Option+A to focus the dropdown
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && event.code === 'KeyA' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for custom events to refresh user accounts
  useEffect(() => {
    const handleUserAccountsUpdate = () => {
      fetchUserAccounts();
    };

    // Listen for custom event
    window.addEventListener('userAccountsUpdated', handleUserAccountsUpdate);

    // Initial fetch
    fetchUserAccounts();

    return () => {
      window.removeEventListener('userAccountsUpdated', handleUserAccountsUpdate);
    };
  }, [fetchUserAccounts]);

  useEffect(() => {
    if (userAccounts.length > 0 && !selectedAccount?._id) {
      dispatch(
        setCurrentUserAccount({
          _id: userAccounts[0]._id,
          name: userAccounts[0].name
        })
      );
    }
  }, [userAccounts, selectedAccount?._id, dispatch]);

  // Ensure selected account still exists in the current userAccounts list
  useEffect(() => {
    if (selectedAccount?._id && userAccounts.length > 0) {
      const accountExists = userAccounts.some((account) => account._id === selectedAccount._id);
      if (!accountExists) {
        // Reset to first account if current selection no longer exists
        dispatch(
          setCurrentUserAccount({
            _id: userAccounts[0]._id,
            name: userAccounts[0].name
          })
        );
      }
    }
  }, [userAccounts, selectedAccount?._id, dispatch]);

  // Show disabled state if no accounts available
  if (!userAccounts || userAccounts.length === 0) {
    return (
      <Box sx={{ width: 200, m: 2 }}>
        <TextField fullWidth label="User Account" value="No accounts available" disabled size="small" />
      </Box>
    );
  }

  const currentValue = selectedAccount?.name || '';

  return (
    <Box
      sx={{ width: 300, m: 2 }}
      onKeyDownCapture={(e) => {
        if (e.altKey && e.code === 'KeyA' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      }}
    >
      <Autocomplete
        size="small"
        disablePortal
        disableClearable
        options={userAccounts.map((account) => account.name)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="User Account"
            inputRef={inputRef}
          />
        )}
        value={currentValue}
        onChange={(event, newValue) => {
          const selected = userAccounts.find((account) => account.name === newValue);
          if (selected) {
            dispatch(
              setCurrentUserAccount({
                _id: selected._id,
                name: selected.name
              })
            );
            inputRef.current?.blur();
          }
        }}
      />
    </Box>
  );
};

export default UserAccountDropwdown;
