import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import AddTransaction from '../pages/transactions/AddTransaction';
import FinancialYears from '../pages/financial-years';
import SplitSecurity from '../pages/securities/components/SplitSecurity';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - transactions
const Split = Loadable(lazy(() => import('pages/transactions/split')));

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

// render - reports
const ProfitAndLoss = Loadable(lazy(() => import('pages/reports/pnl')));
const Holdings = Loadable(lazy(() => import('pages/holdings')));

// render - ledger
const Ledger = Loadable(lazy(() => import('pages/ledger')));

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
      path: 'split',
      element: <Split />
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
      path: 'master-data/security/split/:securityId',
      element: <SplitSecurity />
    },
    {
      path: 'master-data/security',
      element: <SecurityManagement />
    },
    {
      path: 'master-data/financial-years',
      element: <FinancialYears />
    },
    {
      path: 'report/pnl',
      element: <ProfitAndLoss />
    },
    {
      path: 'report/holdings',
      element: <Holdings />
    },
    {
      path: 'ledger',
      element: <Ledger />
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
      path: 'add-transaction',
      element: <AddTransaction />
    },
    {
      path: 'ipo',
      element: <AddTransaction />
    }
  ]
};

export default MainRoutes;
