import { get } from '../../../utils/apiUtil';

export const fetchContracts = async ({
  limit = 50,
  pageNo = 1,
  dematAccountId = '',
  securityId = null,
  referenceNumber = '',
  financialYearId = '',
  date = ''
} = {}) => {
  const params = new URLSearchParams();
  params.append('limit', limit);
  params.append('pageNo', pageNo);
  if (financialYearId) params.append('financialYearId', financialYearId);
  if (dematAccountId) params.append('dematAccountId', dematAccountId);
  if (securityId) params.append('securityId', securityId);
  if (referenceNumber) params.append('referenceNumber', referenceNumber);
  if (date) params.append('date', date);

  return get(`/transaction/get-contracts?${params.toString()}`);
};
