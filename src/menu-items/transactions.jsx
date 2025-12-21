// assets
import { TransactionOutlined, SplitCellsOutlined } from '@ant-design/icons';

// icons
const icons = {
  TransactionOutlined,
  SplitCellsOutlined
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
      url: 'transactions',
      icon: icons.TransactionOutlined,
      breadcrumbs: false
    },
    {
      id: 'split',
      title: 'Split',
      type: 'item',
      url: 'split',
      icon: icons.SplitCellsOutlined,
      breadcrumbs: false
    }
  ]
};

export default transactions;
