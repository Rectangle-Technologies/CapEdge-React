import * as yup from 'yup';

/**
 * Validation schema for broker form
 */
export const  brokerValidationSchema = yup.object({
  name: yup.string().required('Broker name is required'),
  panNumber: yup
    .string()
    .required('PAN number is required')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN number must be in correct format (e.g., ABCDE1234F)'),
  address: yup.string().required('Address is required')
});