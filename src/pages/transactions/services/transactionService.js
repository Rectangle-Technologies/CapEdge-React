import { get } from '../../../utils/apiUtil';

/**
 * Fetch all transactions with pagination
 * @param {number} limit - Number of transactions per page
 * @param {number} offset - Offset for pagination
 * @returns {Promise} Transaction data with pagination info
 */
export const getAllTransactions = async (limit = 50, offset = 0) => {
  try {
    const response = await get(`/transaction/get-all?limit=${limit}&offset=${offset}`);
    return response;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};
