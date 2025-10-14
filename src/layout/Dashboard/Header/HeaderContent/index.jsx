// material-ui
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import MobileSection from './MobileSection';
import Profile from './Profile';

// project import
import UserAccountDropwdown from './UserAccountDropwdown';
import FinancialYearDropdown from './FinancialYearDropdown';

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent() {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

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
      {!downLG && <FinancialYearDropdown />}
      {!downLG && <UserAccountDropwdown />}
      {!downLG && <Profile />}
      {downLG && <MobileSection />}
    </>
  );
}
