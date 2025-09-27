// assets
import { UserOutlined, StockOutlined, BankOutlined } from '@ant-design/icons';

// icons
const icons = {
  UserOutlined,
  StockOutlined,
  BankOutlined
};

// ==============================|| MENU ITEMS - MASTER DATA ||============================== //

const masterData = {
  id: 'group-master-data',
  title: 'Master Data',
  type: 'group',
  children: [
    {
      id: 'master-data-security',
      title: 'Security',
      type: 'item',
      url: 'master-data/security',
      icon: icons.StockOutlined,
      breadcrumbs: false
    },
    {
      id: 'master-data-broker',
      title: 'Broker',
      type: 'item',
      url: 'master-data/broker',
      icon: icons.BankOutlined,
      breadcrumbs: false
    },
    {
      id: 'master-data-user-account',
      title: 'User Account',
      type: 'item',
      url: 'master-data/user-account',
      icon: icons.UserOutlined,
      breadcrumbs: false
    }
  ]
};

export default masterData;
