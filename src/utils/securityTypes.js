// Create a function to return the label for a security type give input the value
export const SECURITY_TYPES = [
  { value: 'EQUITY', label: 'Equity' },
  { value: 'FUTURES', label: 'Futures' },
  { value: 'OPTIONS', label: 'Options' },
  { value: 'COMMODITY', label: 'Commodity' },
  { value: 'CURRENCY', label: 'Currency' },
  { value: 'BOND', label: 'Bond' },
  { value: 'ETF', label: 'ETF' },
  { value: 'MUTUAL_FUND', label: 'Mutual Fund' }
];

export const getSecurityTypeLabel = (value) => {
  const type = SECURITY_TYPES.find((t) => t.value === value);
  return type ? type.label : 'Unknown Type';
};
