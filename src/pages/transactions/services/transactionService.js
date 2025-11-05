import { get } from '../../../utils/apiUtil';

/**
 * Fetch all transactions with pagination
 * @param {number} limit - Number of transactions per page
 * @param {number} pageno - Page number for pagination
 * @param {string} dematAccountId - Optional demat account ID to filter transactions
 * @param {string} securityId - Optional security ID to filter transactions
 * @returns {Promise} Transaction data with pagination info
 */
export const getAllTransactions = async (limit = 50, pageNo = 0, dematAccountId = null, securityId = null) => {
  try {
    let url = `/transaction/get-all?limit=${limit}&pageNo=${pageNo}`;
    if (dematAccountId) {
      url += `&dematAccountId=${dematAccountId}`;
    }
    if (securityId) {
      url += `&securityId=${securityId}`;
    }
    const response = await get(url);
    return response;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};
