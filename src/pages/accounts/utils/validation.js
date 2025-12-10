import * as yup from 'yup';

// User Account validation schema
export const userAccountValidationSchema = yup.object({
  name: yup.string().required('Name is required'),
  panNumber: yup
    .string()
    .required('PAN number is required')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN number must be in correct format (e.g., ABCDE1234F)'),
  address: yup.string().required('Address is required')
});

// Demat Account validation schema
export const dematAccountValidationSchema = yup.object({
  brokerId: yup.string().required('Broker is required'),
  balance: yup
    .number()
    .required('Balance is required')
    .min(0, 'Balance cannot be negative')
    .test('decimal', 'Balance can have maximum 2 decimal places', (value) => {
      if (value === undefined || value === null) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    })
});
