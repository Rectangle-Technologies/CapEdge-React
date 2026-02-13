import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';

// project imports
import router from 'routes';
import ThemeCustomization from 'themes';
import ScrollTop from 'components/ScrollTop';

// redux store
import store from 'store';

// global components
import GlobalLoader from 'components/GlobalLoader';
import GlobalSnackbar from 'components/GlobalSnackbar';
import BackendLoader from './components/BackendLoader';

// ==============================|| APP - THEME, ROUTER, LOCAL, REDUX ||============================== //

export default function App() {
  return (
    <Provider store={store}>
      <ThemeCustomization>
        <ScrollTop>
          <BackendLoader>
            <RouterProvider router={router} />
            <GlobalLoader />
            <GlobalSnackbar />
          </BackendLoader>
        </ScrollTop>
      </ThemeCustomization>
    </Provider>
  );
}
