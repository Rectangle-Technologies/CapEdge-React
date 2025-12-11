/**
 * Constants for security management functionality
 */

// Pagination configuration
export const ROWS_PER_PAGE = 50;

// Table configuration
export const TABLE_CONFIG = {
  columns: {
    name: { label: 'Name' },
    type: { label: 'Type' },
    strikePrice: { label: 'Strike Price' },
    expiry: { label: 'Expiry Date' },
    actions: { label: 'Actions' }
  },
  maxHeight: 600
};

// Form configuration
export const FORM_CONFIG = {
  nameMinLength: 2
};

// API endpoints
export const API_ENDPOINTS = {
  getAllSecurities: '/security/get-all'
};
