import * as Yup from 'yup';

/**
 * Validation schema for transaction form
 */
export const transactionValidationSchema = Yup.object({
  date: Yup.date()
    .required('Transaction date is required')
    .max(new Date(), 'Transaction date cannot be in the future'),
  
  type: Yup.string()
    .required('Transaction type is required')
    .oneOf(['BUY', 'SELL'], 'Invalid transaction type'),
  
  quantity: Yup.number()
    .required('Quantity is required')
    .positive('Quantity must be positive')
    .integer('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1'),
  
  price: Yup.number()
    .required('Price is required')
    .positive('Price must be positive')
    .min(0.01, 'Price must be at least 0.01'),
  
  securityId: Yup.string()
    .required('Security is required'),
  
  deliveryType: Yup.string()
    .required('Delivery type is required')
    .oneOf(['Delivery', 'Intraday'], 'Invalid delivery type'),
  
  referenceNumber: Yup.string()
    .max(50, 'Reference number must be at most 50 characters')
    .nullable(),
  
  dematAccountId: Yup.string()
    .required('Demat account is required')
});

/**
 * Validation schema for multiple transactions form
 */
export const multipleTransactionsValidationSchema = Yup.object({
  transactions: Yup.array()
    .of(transactionValidationSchema)
    .min(1, 'At least one transaction is required')
    .required('Transactions array is required')
});

