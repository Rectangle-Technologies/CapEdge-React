import * as yup from 'yup';

/**
 * Validation schema for security form
 * Dynamic validation based on security types
 */
export const createSecurityValidationSchema = (securityTypes) => {
  return yup.object({
    name: yup.string().required('Security name is required').min(2, 'Name must be at least 2 characters'),
    type: yup
      .string()
      .required('Security type is required')
      .oneOf(
        securityTypes.map((type) => type.value),
        'Invalid security type'
      ),
    strikePrice: yup
      .number()
      .nullable()
      .when('type', {
        is: (val) => val === 'OPTIONS' || val === 'FUTURES',
        then: (schema) => schema.required('Strike price is required for Options/Futures').min(0, 'Strike price cannot be negative'),
        otherwise: (schema) => schema.min(0, 'Strike price cannot be negative')
      })
      .test('decimal', 'Strike price can have maximum 2 decimal places', (value) => {
        if (value === undefined || value === null || value === '') return true;
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      }),
    expiry: yup
      .date()
      .nullable()
      .when('type', {
        is: (val) => val === 'OPTIONS' || val === 'FUTURES',
        then: (schema) => schema.required('Expiry date is required for Options/Futures').min(new Date(), 'Expiry date must be in the future'),
        otherwise: (schema) => schema.min(new Date(), 'Expiry date must be in the future')
      })
  });
};

/**
 * Check if a security type is a derivative
 */
export const isDerivative = (type) => type === 'OPTIONS' || type === 'FUTURES';