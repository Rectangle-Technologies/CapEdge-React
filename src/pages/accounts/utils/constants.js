// Configuration constants
export const ROWS_PER_PAGE = 50;

// Broker data
export const brokers = [
  { id: '1', name: 'Zerodha', address: 'Bangalore, Karnataka', panNumber: 'AAAAA0000A' },
  { id: '2', name: 'Angel Broking', address: 'Mumbai, Maharashtra', panNumber: 'BBBBB1111B' },
  { id: '3', name: 'ICICI Direct', address: 'Chennai, Tamil Nadu', panNumber: 'CCCCC2222C' },
  { id: '4', name: 'HDFC Securities', address: 'Mumbai, Maharashtra', panNumber: 'DDDDD3333D' },
  { id: '5', name: 'Kotak Securities', address: 'Mumbai, Maharashtra', panNumber: 'EEEEE4444E' }
];

// Table configuration
export const tableConfig = {
  maxHeight: 600,
  cellPadding: '8px 16px 8px 16px',
  expandCellWidth: 60,
  nameColWidth: '25%',
  panColWidth: '20%',
  addressColWidth: '35%',
  actionsColWidth: '20%'
};

// Mock user accounts data for initial state
export const mockUserAccountsData = [
  {
    id: 1,
    name: 'John Doe',
    panNumber: 'ABCDE1234F',
    address: '123 Main Street, Mumbai, Maharashtra 400001',
    dematAccounts: [
      { id: 1, userAccountId: '1', brokerId: '1', balance: 50000 },
      { id: 2, userAccountId: '1', brokerId: '2', balance: 75000 }
    ]
  },
  {
    id: 2,
    name: 'Jane Smith',
    panNumber: 'FGHIJ5678K',
    address: '456 Park Avenue, Delhi, Delhi 110001',
    dematAccounts: [{ id: 3, userAccountId: '2', brokerId: '1', balance: 100000 }]
  },
  {
    id: 3,
    name: 'Rajesh Kumar',
    panNumber: 'KLMNO9876P',
    address: '789 Gandhi Road, Bangalore, Karnataka 560001',
    dematAccounts: []
  }
];