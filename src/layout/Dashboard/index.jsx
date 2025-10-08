import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

// project imports
import Drawer from './Drawer';
import Header from './Header';
import Footer from './Footer';
import Loader from 'components/Loader';
import Breadcrumbs from 'components/@extended/Breadcrumbs';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoader, showLoader } from '../../store/slices/loaderSlice';
import { logout, validateToken } from '../../store/slices/authSlice';

// ==============================|| MAIN LAYOUT ||============================== //

export default function DashboardLayout() {
  const { menuMasterLoading } = useGetMenuMaster();
  const downXL = useMediaQuery((theme) => theme.breakpoints.down('xl'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector(state => state.auth.token);
  // set media wise responsive drawer
  useEffect(() => {
    const handleAuth = async () => {
      dispatch(showLoader());
      handlerDrawerOpen(!downXL);
      if (!token) {
        navigate('/login');
        dispatch(hideLoader());
        return;
      }

      try {
        // Check if token has not expired
        await dispatch(validateToken()).unwrap();
      } catch (error) {
        dispatch(logout());
        navigate('/login');
        dispatch(hideLoader());
        return;
      }
      var currentPath = window.location.pathname;
      if (currentPath === '/') {
        currentPath = '/transactions';
      }
      navigate(currentPath);
      dispatch(hideLoader());
    };

    handleAuth();
  }, [downXL]);

  if (menuMasterLoading) return <Loader />;

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Header />
      <Drawer />

      <Box component="main" sx={{ width: 'calc(100% - 260px)', flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Toolbar sx={{ mt: 'inherit' }} />
        <Box
          sx={{
            ...{ px: { xs: 0, sm: 2 } },
            position: 'relative',
            minHeight: 'calc(100vh - 110px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Breadcrumbs />
          <Outlet />
          {/* <Footer /> */}
        </Box>
      </Box>
    </Box>
  );
}
