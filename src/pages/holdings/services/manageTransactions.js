import { get, post, put, del } from '../../../utils/apiUtil';

// The whole history of one security in one demat account (sorted by date). No `limit` on purpose: the server caps a limit at 100,
// and without one it returns every row. The list is populated and counted server side, so it gets a longer read timeout than usual.
export const fetchSecurityTransactions = async (securityId, dematAccountId) => {
  const data = await get(`/transaction/get-all?securityId=${securityId}&dematAccountId=${dematAccountId}`, false, { timeout: 30000 });
  return data?.transactions || [];
};

// Same endpoints and payloads as the Add / Edit transaction page.
export const createTrade = (payload) => post('/transaction/create', [payload]);
export const editTrade = (id, payload) => put(`/transaction/edit/${id}`, payload);
export const deleteTrade = (id) => del(`/transaction/delete/${id}`);

// true when no answer came back (timeout / network error): the server may or may not have saved the change.
export const isUnknownOutcome = (error) => !!(error?.isTimeout || error?.isNetworkError);
