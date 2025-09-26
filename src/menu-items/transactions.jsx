// assets
import { BankOutlined } from '@ant-design/icons';

// icons
const icons = {
  BankOutlined
};

// ==============================|| MENU ITEMS - TRANSACTIONS ||============================== //

const transactions = {
  id: 'group-transactions',
  title: 'Transactions',
  type: 'group',
  children: [
    {
      id: 'transactions',
      title: 'All Transactions',
      type: 'item',
      url: '/',
      icon: icons.BankOutlined,
      breadcrumbs: false
    }
  ]
};

export default transactions;
