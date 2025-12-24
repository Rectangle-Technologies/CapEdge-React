/**
 * Format currency values with consistent formatting
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency symbol (default: '₹')
 * @param {string} locale - Locale for formatting (default: 'en-IN')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = '₹', locale = 'en-IN') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency}0.00`;
  }

  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);

  const formattedAmount = absoluteAmount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });

  return isNegative ? `-${currency}${formattedAmount}` : `${currency}${formattedAmount}`;
};

/**
 * Parse currency input value to number
 * @param {string} value - Input value to parse
 * @returns {number} Parsed number with 2 decimal precision
 */
export const parseCurrencyInput = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
};

/**
 * Format number for currency input field
 * @param {number} amount - The amount to format for input
 * @returns {string} Formatted string for input field
 */
export const formatCurrencyForInput = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '';
  }
  return Number(amount);
};
