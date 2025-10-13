import { Autocomplete, Box, TextField } from '@mui/material'
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentUserAccount } from '../../../../store/slices/appSlice';
import { get } from '../../../../utils/apiUtil';

const UserAccountDropwdown = () => {
    const dispatch = useDispatch();
    const [userAccounts, setUserAccounts] = useState([]);
    const selectedAccount = useSelector(state => state.app.currentUserAccount);

    // Function to fetch user accounts
    const fetchUserAccounts = async () => {
        try {
            const data = await get('/user-account/get-all');
            setUserAccounts(data.userAccounts || []);
        } catch (error) {
            console.error('Error fetching user accounts:', error);
        }
    };

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
    }, []);

    useEffect(() => {
        if (userAccounts.length > 0 && (!selectedAccount || !selectedAccount._id)) {
            dispatch(setCurrentUserAccount({
                _id: userAccounts[0]._id,
                name: userAccounts[0].name
            }));
        }
    }, [userAccounts, selectedAccount, dispatch]);

    // Ensure selected account still exists in the current userAccounts list
    useEffect(() => {
        if (selectedAccount && selectedAccount._id && userAccounts.length > 0) {
            const accountExists = userAccounts.some(account => account._id === selectedAccount._id);
            if (!accountExists) {
                // Reset to first account if current selection no longer exists
                dispatch(setCurrentUserAccount({
                    _id: userAccounts[0]._id,
                    name: userAccounts[0].name
                }));
            }
        }
    }, [userAccounts, selectedAccount, dispatch]);

    // Don't render if no accounts available
    if (!userAccounts || userAccounts.length === 0) {
        return null;
    }

    const currentValue = selectedAccount && selectedAccount.name ? selectedAccount.name : '';

    return (
        <Box sx={{ m: 2 }}>
            <Autocomplete
                disablePortal
                disableClearable
                options={userAccounts.map(account => account.name)}
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} />}
                value={currentValue}
                onChange={(event, newValue) => {
                    const selected = userAccounts.find(account => account.name === newValue);
                    if (selected) {
                        dispatch(setCurrentUserAccount({
                            _id: selected._id,
                            name: selected.name
                        }));
                    }
                }}
            />
        </Box>
    )
}

export default UserAccountDropwdown