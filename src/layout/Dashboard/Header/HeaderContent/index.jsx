// material-ui
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import MobileSection from './MobileSection';
import Profile from './Profile';

// project import
import { useEffect, useState } from 'react';
import { useAppDispatch } from 'store/hooks';
import { hideLoader, showLoader } from 'store/slices/loaderSlice';
import { showErrorSnackbar } from '../../../../store/utils';
import { get } from '../../../../utils/apiUtil';
import UserAccountDropwdown from './UserAccountDropwdown';

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent() {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const [userAccounts, setUserAccounts] = useState([]);
  const dispatch = useAppDispatch();

  const fetchUserAccounts = async () => {
    dispatch(showLoader());
    try {
      const data = await get('/user-account/get-all');
      setUserAccounts(data.userAccounts);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      showErrorSnackbar(error.message || 'Failed to fetch user accounts');
    } finally {
      dispatch(hideLoader());
    }
  }

  useEffect(() => {
    fetchUserAccounts();
  }, []);

  return (
    <>
      {/* {!downLG && <Search />} */}
      {/* {downLG && <Box sx={{ width: '100%', ml: 1 }} />} */}
      {/* <IconButton
        component={Link}
        href="https://github.com/codedthemes/mantis-free-react-admin-template"
        target="_blank"
        disableRipple
        color="secondary"
        title="Download Free Version"
        sx={{ color: 'text.primary', bgcolor: 'grey.100' }}
      >
        <GithubOutlined />
      </IconButton> */}

      {/* <Notification /> */}
      <Box sx={{ flexGrow: 1 }} />
      {!downLG && <UserAccountDropwdown userAccounts={userAccounts} />}
      {!downLG && <Profile />}
      {downLG && <MobileSection />}
    </>
  );
}
