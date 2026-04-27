// assets
import { TransactionOutlined, FileTextOutlined } from '@ant-design/icons';

// icons
const icons = {
  TransactionOutlined,
  FileTextOutlined
};

// ==============================|| MENU ITEMS - TRANSACTIONS ||============================== //

const transactions = {
  id: 'group-transactions',
  title: 'Transactions',
  type: 'group',
  children: [
    {
      id: 'contracts',
      title: 'Contracts',
      type: 'item',
      url: 'contracts',
      icon: icons.FileTextOutlined,
      breadcrumbs: false
    },
    {
      id: 'transactions',
      title: 'Transactions',
      type: 'item',
      url: 'transactions',
      icon: icons.TransactionOutlined,
      breadcrumbs: false
    }
  ]
};

export default transactions;
