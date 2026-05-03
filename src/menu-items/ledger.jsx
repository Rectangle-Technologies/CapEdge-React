// assets
import { AccountBookOutlined, BankOutlined } from '@ant-design/icons';

// icons
const icons = {
  AccountBookOutlined,
  BankOutlined
};

// ==============================|| MENU ITEMS - LEDGER ||============================== //

const ledger = {
  id: 'group-ledger',
  title: 'Ledger',
  type: 'group',
  children: [
    {
      id: 'ledger',
      title: 'Ledger',
      type: 'item',
      url: '/ledger',
      icon: icons.AccountBookOutlined,
      breadcrumbs: false
    },
    {
      id: 'all-balances',
      title: 'All Balances',
      type: 'item',
      url: '/all-balances',
      icon: icons.BankOutlined,
      breadcrumbs: false
    }
  ]
};

export default ledger;
