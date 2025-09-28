import { useDispatch, useSelector } from 'react-redux';

// ==============================|| REDUX HOOKS ||============================== //

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);

// Specific hooks for snackbar
export const useSnackbar = () => {
  const dispatch = useAppDispatch();
  const snackbar = useAppSelector((state) => state.snackbar);

  return { snackbar, dispatch };
};
