import { useDispatch, useSelector } from 'react-redux';

// ==============================|| REDUX HOOKS ||============================== //

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);

// Specific hooks for loader
export const useLoader = () => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.loader.isLoading);
  
  return { isLoading, dispatch };
};

// Specific hooks for snackbar
export const useSnackbar = () => {
  const dispatch = useAppDispatch();
  const snackbar = useAppSelector((state) => state.snackbar);
  
  return { snackbar, dispatch };
};

// Specific hooks for authentication
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const isAuthenticated = useAppSelector((state) => !!state.auth.token);
  
  return { 
    token, 
    isAuthenticated, 
    dispatch 
  };
};