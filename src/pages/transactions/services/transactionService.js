import { get } from '../../../utils/apiUtil';

/**
 * Fetch all transactions with pagination
 * @param {number} limit - Number of transactions per page
 * @param {number} pageno - Page number for pagination
 * @returns {Promise} Transaction data with pagination info
 */
export const getAllTransactions = async (limit = 50, pageNo = 0) => {
  try {
    const response = await get(`/transaction/get-all?limit=${limit}&pageNo=${pageNo}`);
    return response;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};
