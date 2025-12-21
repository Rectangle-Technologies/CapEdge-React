import * as yup from 'yup';

/**
 * Validation schema for broker form
 */
export const brokerValidationSchema = yup.object({
  name: yup.string().required('Broker name is required'),
  panNumber: yup.string(),
  address: yup.string()
});
