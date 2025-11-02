import { get } from '../../../utils/apiUtil';

/**
 * Fetch all holdings with pagination
 * @param {number} limit - Number of records per page
 * @param {number} offset - Offset for pagination
 * @returns {Promise} Holdings data with pagination info
 */
export const fetchHoldings = async (limit = 50, offset = 0) => {
  try {
    const response = await get(`/holdings/get-all?limit=${limit}&offset=${offset}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Transform API response to component format
 * @param {Object} holding - Raw holding data from API
 * @returns {Object} Transformed holding object
 */
export const transformHoldingData = (holding) => {
  const buyPrice = holding.price || 0;
  const quantity = holding.quantity || 0;
  const totalInvestment = buyPrice * quantity;
  
  // Note: Current price needs to come from market data or another source
  // For now, we'll use buy price as placeholder
  const currentPrice = buyPrice; // TODO: Fetch from market data API
  const currentValue = currentPrice * quantity;
  const unrealizedPnL = currentValue - totalInvestment;
  const pnlPercentage = totalInvestment > 0 ? (unrealizedPnL / totalInvestment) * 100 : 0;

  return {
    id: holding._id,
    buyDate: holding.buyDate,
    securityId: holding.securityId?._id || '',
    securityName: holding.securityId?.name || 'N/A',
    securityType: holding.securityId?.type || 'EQUITY',
    symbol: holding.securityId?.symbol || '',
    strikePrice: holding.securityId?.strikePrice,
    expiry: holding.securityId?.expiry,
    quantity: quantity,
    buyPrice: buyPrice,
    currentPrice: currentPrice,
    totalInvestment: totalInvestment,
    currentValue: currentValue,
    unrealizedPnL: unrealizedPnL,
    pnlPercentage: pnlPercentage,
    // Additional data from API
    transactionId: holding.transactionId?._id,
    transactionType: holding.transactionId?.type,
    deliveryType: holding.transactionId?.deliveryType,
    referenceNumber: holding.transactionId?.referenceNumber,
    dematAccountId: holding.dematAccountId?._id,
    broker: holding.dematAccountId?.brokerId?.name || 'N/A',
    brokerName: holding.dematAccountId?.brokerId?.name || 'N/A',
    brokerPan: holding.dematAccountId?.brokerId?.panNumber,
    dematBalance: holding.dematAccountId?.balance,
    financialYear: holding.financialYearId?.title || 'N/A',
    createdAt: holding.createdAt,
    updatedAt: holding.updatedAt
  };
};
