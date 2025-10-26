/**
 * Transaction Types
 */
export const TRANSACTION_TYPES = [
  { value: 'BUY', label: 'Buy' },
  { value: 'SELL', label: 'Sell' }
];

/**
 * Delivery Types
 */
export const DELIVERY_TYPES = [
  { value: 'Delivery', label: 'Delivery' },
  { value: 'Intraday', label: 'Intraday' }
];

/**
 * Form Configuration
 */
export const FORM_CONFIG = {
  quantityMin: 1,
  priceMin: 0,
  priceStep: 0.01,
  referenceNumberMaxLength: 50
};
