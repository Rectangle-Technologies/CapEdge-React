// project import
import ledger from './ledger';
import masterData from './master-data';
import report from './report';
import transactions from './transactions';

// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: [transactions, masterData, report, ledger]
};

export default menuItems;
