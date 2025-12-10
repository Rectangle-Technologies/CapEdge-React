import { formatDate, formatDateForFileName } from 'utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';

/**
 * Export ledger entries to Excel (CSV format)
 * @param {Array} filteredEntries - The ledger entries to export
 * @returns {Promise<void>}
 */
export const exportToExcel = async (filteredEntries) => {
  const exportData = filteredEntries.map((entry) => ({
    Date: formatDate(entry.date),
    'Demat Account': entry.dematAccountName,
    'Transaction ID': entry.tradeTransactionId,
    Security: entry.securityName,
    Type: entry.transactionType,
    Quantity: entry.quantity,
    Amount: formatCurrency(entry.transactionAmount),
    Balance: formatCurrency(entry.balance),
    Remarks: entry.remarks
  }));

  const headers = Object.keys(exportData[0] || {});
  const csvContent = [
    headers.join(','),
    ...exportData.map((row) =>
      headers
        .map((header) => {
          const value = row[header] || '';
          return value.toString().includes(',') || value.toString().includes('"') ? `"${value.toString().replace(/"/g, '""')}"` : value;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `ledger_${formatDateForFileName()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
