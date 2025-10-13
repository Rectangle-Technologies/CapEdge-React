import { Autocomplete, Box, TextField } from '@mui/material'
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentUserAccount } from '../../../../store/slices/appSlice';

const UserAccountDropwdown = ({ userAccounts }) => {
    const dispatch = useDispatch();
    const selectedAccount = useSelector(state => state.app.currentUserAccount);

    useEffect(() => {
        if (userAccounts.length > 0 && !selectedAccount._id) {
            dispatch(setCurrentUserAccount({
                _id: userAccounts[0]._id,
                name: userAccounts[0].name
            }));
        }
    }, [userAccounts, selectedAccount, dispatch]);

    return (
        <Box sx={{ m: 2 }}>
            <Autocomplete
                disablePortal
                disableClearable
                options={userAccounts.map(account => account.name)}
                defaultValue={userAccounts.length > 0 ? userAccounts[0].name : null}
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} />}
                autoComplete
                value={selectedAccount.name}
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