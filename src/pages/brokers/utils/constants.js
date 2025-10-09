/**
 * Constants for broker management functionality
 */

// Pagination configuration
export const ROWS_PER_PAGE = 50;

// Table configuration
export const TABLE_CONFIG = {
  columns: {
    name: { width: '25%', label: 'Name' },
    panNumber: { width: '20%', label: 'PAN Number' },
    address: { width: '40%', label: 'Address' },
    actions: { width: '15%', label: 'Actions' }
  },
  cellPadding: '8px 16px 8px 24px',
  maxHeight: 600
};

// Form configuration
export const FORM_CONFIG = {
  panNumberMaxLength: 10,
  addressRows: 3
};