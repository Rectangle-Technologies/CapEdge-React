/**
 * Helper functions for security management
 */

/**
 * Get type color for chip based on security type
 */
export const getTypeColor = (type) => {
  const colorMap = {
    EQUITY: 'primary',
    FUTURES: 'secondary',
    OPTIONS: 'warning',
    COMMODITY: 'info',
    CURRENCY: 'success',
    BOND: 'default',
    ETF: 'primary',
    MUTUAL_FUND: 'secondary'
  };
  return colorMap[type] || 'default';
};

/**
 * Get type label from security types array
 */
export const getTypeLabel = (type, securityTypes) => {
  const typeObj = securityTypes.find((t) => t.value === type);
  return typeObj ? typeObj.label : type;
};

/**
 * Process form values for API submission
 */
export const processFormValues = (values) => {
  return {
    name: values.name,
    type: values.type,
    ...(values.strikePrice !== null && { strikePrice: parseFloat(values.strikePrice) }),
    ...(values.expiry !== null && { expiry: values.expiry })
  };
};

/**
 * Generate new security ID
 */
export const generateNewSecurityId = (securities) => {
  return Math.max(...securities.map((s) => s.id), 0) + 1;
};

export const getTransactionTypeColor = (type) => {
  const colorMap = {
    BUY: 'primary',
    SELL: 'success',
    IPO: 'warning',
  };
  return colorMap[type] || 'primary';
};
