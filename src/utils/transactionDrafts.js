const STORAGE_PREFIX = 'capedge:transaction-drafts:';

const storageKey = (userAccountId) => `${STORAGE_PREFIX}${userAccountId}`;

const readAll = (userAccountId) => {
  if (!userAccountId) return [];
  try {
    const raw = localStorage.getItem(storageKey(userAccountId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error loading transaction drafts:', e);
    return [];
  }
};

const writeAll = (userAccountId, drafts) => {
  try {
    localStorage.setItem(storageKey(userAccountId), JSON.stringify(drafts));
  } catch (e) {
    console.error('Error saving transaction drafts:', e);
  }
};

const toDateKey = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

export const buildDraftId = ({ transactionDate, referenceNumber, savedAt }) => {
  const datePart = toDateKey(transactionDate);
  const refPart = (referenceNumber || '').trim();
  if (!datePart && !refPart) return `_${savedAt}`;
  return `${datePart}__${refPart}`;
};

export const loadDrafts = (userAccountId) =>
  readAll(userAccountId).slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

export const getDraft = (userAccountId, draftId) => {
  if (!userAccountId || !draftId) return null;
  return readAll(userAccountId).find((d) => d.id === draftId) || null;
};

export const saveDraft = (userAccountId, draft, { replaceId } = {}) => {
  if (!userAccountId) return null;
  const savedAt = Date.now();
  const id = buildDraftId({ ...draft, savedAt });
  const next = readAll(userAccountId).filter(
    (d) => d.id !== id && (!replaceId || d.id !== replaceId)
  );
  const stored = { ...draft, id, savedAt };
  next.push(stored);
  writeAll(userAccountId, next);
  return stored;
};

export const deleteDraft = (userAccountId, draftId) => {
  if (!userAccountId || !draftId) return;
  writeAll(userAccountId, readAll(userAccountId).filter((d) => d.id !== draftId));
};
