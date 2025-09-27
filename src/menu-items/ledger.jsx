// assets
import { AccountBookOutlined } from '@ant-design/icons';

// icons
const icons = {
  AccountBookOutlined
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
    }
  ]
};

export default ledger;
