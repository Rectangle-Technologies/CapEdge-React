// assets
import { TransactionOutlined } from '@ant-design/icons';

// icons
const icons = {
  TransactionOutlined
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
      icon: icons.TransactionOutlined,
      breadcrumbs: false
    }
  ]
};

export default transactions;
