// Pure rules for the "Manage transactions" drawer on the Holdings page. No imports on purpose: this file is unit tested on its own.

const MIN_QUANTITY = 0.000001; // server rule (express-validator isFloat min); the Yup schema of the Add page is stricter

const dayOf = (value) => (value ? String(value).slice(0, 10) : '');

// Intraday rows are a BUY + SELL pair with their own price fields and a halved cost, IPO rows are special Delivery BUYs:
// both are edited on the Transactions page, not here.
export const isLockedTransaction = (tx) => tx?.deliveryType !== 'Delivery' || !!tx?.isIpo;

// Payload for POST /transaction/create (as a one element array) and PUT /transaction/edit/:id. Same fields and types as the
// Add / Edit transaction page builds for a Delivery trade.
export const buildTransactionPayload = (form, { securityId, dematAccountId }) => ({
  date: form.date, // 'YYYY-MM-DD'
  type: form.type,
  quantity: Number(form.quantity),
  securityId,
  deliveryType: 'Delivery',
  referenceNumber: String(form.referenceNumber ?? '').trim(),
  dematAccountId,
  transactionCost: form.transactionCost ? Number(form.transactionCost) : 0,
  isIpo: false,
  price: Number(form.price)
});

// Mirrors the server's rules (routes/transactions.js) so a row the server accepts can be edited here.
// today = 'YYYY-MM-DD' (the server compares calendar days).
// mode 'add' | 'edit'. The 50 character limit is the Add page's own rule (the server has none) and is only checked for NEW trades:
// on an edit the reference is locked and unchanged, and migrated trades carry references longer than 50 characters.
export const validateTransactionForm = (form, today, mode = 'add') => {
  const errors = {};
  if (!form.date) errors.date = 'Date is required';
  else if (form.date > today) errors.date = 'Date cannot be in the future';
  if (form.type !== 'BUY' && form.type !== 'SELL') errors.type = 'Choose BUY or SELL';
  const quantity = Number(form.quantity);
  if (form.quantity === '' || form.quantity === null || Number.isNaN(quantity) || quantity < MIN_QUANTITY)
    errors.quantity = 'Quantity must be greater than 0';
  const price = Number(form.price);
  if (form.price === '' || form.price === null || Number.isNaN(price) || price < 0) errors.price = 'Price must be 0 or more';
  if (form.transactionCost !== '' && form.transactionCost !== null && form.transactionCost !== undefined) {
    const cost = Number(form.transactionCost);
    if (Number.isNaN(cost) || cost < 0) errors.transactionCost = 'Cost must be 0 or more';
  }
  const reference = String(form.referenceNumber ?? '').trim();
  if (!reference) errors.referenceNumber = 'Reference number is required';
  else if (mode === 'add' && reference.length > 50) errors.referenceNumber = 'At most 50 characters';
  return errors;
};

// Is this stored transaction the one the form describes? (calendar day, type, quantity, price, cost, reference)
export const matchesForm = (tx, form) =>
  dayOf(tx.date) === form.date &&
  tx.type === form.type &&
  Number(tx.quantity) === Number(form.quantity) &&
  Number(tx.price) === Number(form.price) &&
  Number(tx.transactionCost || 0) === (form.transactionCost ? Number(form.transactionCost) : 0) &&
  String(tx.referenceNumber ?? '').trim() === String(form.referenceNumber ?? '').trim();

const idOf = (tx) => String(tx._id);

// After a save whose answer never arrived (timeout / network error): decide from the list read BEFORE the save and the list
// read AFTER it whether the change went through. Returns 'saved', 'not_saved' or 'unclear' (the user must look at the list;
// we never guess, a wrong guess means a lost fix or a duplicate trade).
//   add:    { kind: 'add', form }
//   edit:   { kind: 'edit', form, id }       (an edit re-creates the trade, so its old _id disappears and a new one appears)
//   delete: { kind: 'delete', id }
export const decideOutcome = (before, after, action) => {
  const beforeIds = new Set(before.map(idOf));
  const afterIds = new Set(after.map(idOf));
  if (action.kind === 'delete') {
    if (!afterIds.has(String(action.id))) return 'saved';
    return after.length === before.length ? 'not_saved' : 'unclear';
  }
  const count = (list) => list.filter((tx) => matchesForm(tx, action.form)).length;
  if (action.kind === 'add') {
    const delta = count(after) - count(before);
    if (delta === 1) return 'saved';
    if (delta === 0 && after.length === before.length) return 'not_saved';
    return 'unclear';
  }
  if (action.kind === 'edit') {
    const oldGone = !afterIds.has(String(action.id));
    const newIds = after.filter((tx) => !beforeIds.has(idOf(tx)));
    if (!oldGone && newIds.length === 0) return 'not_saved';
    if (oldGone && newIds.length === 1 && matchesForm(newIds[0], action.form) && after.length === before.length) return 'saved';
    return 'unclear';
  }
  return 'unclear';
};

// Other trades that share this trade's reference number (one contract on the Contracts page, one ledger entry when bundled).
export const contractSiblings = (tx, list) =>
  list.filter(
    (other) => idOf(other) !== idOf(tx) && String(other.referenceNumber ?? '').trim() === String(tx.referenceNumber ?? '').trim()
  );

// 'YYYY-MM-DD' of a stored date (stored at UTC midnight, so the first 10 characters are the calendar day in every timezone).
export const dayString = dayOf;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHORTFALL = /Cannot process SELL of (\S+) .+? on (\d{4})-(\d{2})-(\d{2}) — only (\S+) shares available/;

// The server reports a share shortfall from the point of view of the rebuild ("Cannot process SELL of 500 X on 2026-04-21 — only 0
// shares available"). Say the same thing from the point of view of what the user just did. Any other message is returned unchanged.
// kind 'add' | 'edit' | 'delete'
export const friendlyServerMessage = (message, kind) => {
  const match = SHORTFALL.exec(String(message ?? ''));
  if (!match) return message;
  const [, quantity, year, month, day, available] = match;
  const sell = `the SELL of ${quantity} on ${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
  const left = Number(available) === 0 ? 'no shares' : `only ${available} shares`;
  if (kind === 'delete')
    return `This transaction cannot be deleted. Without it there would be ${left} to cover ${sell}. Delete or change that SELL first.`;
  if (kind === 'edit')
    return `This change cannot be saved. With it there would be ${left} to cover ${sell}. Change that SELL as well, or use a larger quantity.`;
  return `This transaction cannot be added. There would be ${left} to cover ${sell}.`;
};
