import { Backdrop, CircularProgress, Box } from '@mui/material';
import { useAppSelector } from 'store/hooks';

// ==============================|| GLOBAL LOADER ||============================== //

const GlobalLoader = () => {
  const isLoading = useAppSelector((state) => state.loader.isLoading);

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'rgba(0, 0, 0, 0.4)'
      }}
      open={isLoading}
    >
      <Box display="flex" flexDirection="column" alignItems="center">
        <CircularProgress color="primary" size={50} />
      </Box>
    </Backdrop>
  );
};

export default GlobalLoader;
