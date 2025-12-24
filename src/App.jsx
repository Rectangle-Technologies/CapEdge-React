import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { SWRConfig } from 'swr';

// project imports
import router from 'routes';
import ThemeCustomization from 'themes';
import ScrollTop from 'components/ScrollTop';

// redux store
import store from 'store';

// global components
import GlobalLoader from 'components/GlobalLoader';
import GlobalSnackbar from 'components/GlobalSnackbar';

// ==============================|| APP - THEME, ROUTER, LOCAL, REDUX ||============================== //

export default function App() {
  return (
    <Provider store={store}>
        <ThemeCustomization>
          <ScrollTop>
            <RouterProvider router={router} />
            <GlobalLoader />
            <GlobalSnackbar />
          </ScrollTop>
        </ThemeCustomization>
    </Provider>
  );
}
