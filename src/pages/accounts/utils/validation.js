import * as yup from 'yup';

// User Account validation schema
export const userAccountValidationSchema = yup.object({
  name: yup.string().required('Name is required'),
  panNumber: yup.string(),
  address: yup.string()
});

// Demat Account validation schema
export const dematAccountValidationSchema = yup.object({
  brokerId: yup.string().required('Broker is required'),
  balance: yup.number().required('Balance is required').min(0, 'Balance cannot be negative')
});
