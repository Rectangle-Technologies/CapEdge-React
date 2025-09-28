import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

// render - user account
const UserAccount = Loadable(lazy(() => import('pages/accounts/userAccount')));

// render - broker management
const BrokerManagement = Loadable(lazy(() => import('pages/brokers')));

// render - security management
const SecurityManagement = Loadable(lazy(() => import('pages/securities')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      path: 'transactions',
      element: <DashboardDefault />
    },
    {
      path: 'master-data/user-account',
      element: <UserAccount />
    },
    {
      path: 'master-data/broker',
      element: <BrokerManagement />
    },
    {
      path: 'master-data/security',
      element: <SecurityManagement />
    },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'shadow',
      element: <Shadow />
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    }
  ]
};

export default MainRoutes;
