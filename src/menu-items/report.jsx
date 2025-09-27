// assets
import { DollarOutlined, AccountBookOutlined } from '@ant-design/icons';

// icons
const icons = {
  DollarOutlined,
  AccountBookOutlined
};

// ==============================|| MENU ITEMS - REPORT ||============================== //

const report = {
  id: 'group-report',
  title: 'Report',
  type: 'group',
  children: [
    {
      id: 'report-pnl',
      title: 'P&L',
      type: 'item',
      url: 'report/pnl',
      icon: icons.DollarOutlined,
      breadcrumbs: false
    },
    {
      id: 'report-holdings',
      title: 'Holdings',
      type: 'item',
      url: 'report/holdings',
      icon: icons.AccountBookOutlined,
      breadcrumbs: false
    }
  ]
};

export default report;
