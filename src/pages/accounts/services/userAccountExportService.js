import { formatDateForFileName } from '../../../utils/formatDate';

/**
 * User Account Export Service
 * Handles exporting user account data to various formats
 */
export class UserAccountExportService {
  /**
   * Export user accounts data to CSV format
   * @param {Array} userAccounts - Array of user account objects
   * @param {Array} brokers - Array of broker objects for reference
   * @returns {Promise} Promise that resolves when export is complete
   */
  static async exportToCSV(userAccounts, brokers) {
    try {
      // Simulate processing time for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Prepare data for export
      const exportData = [];

      userAccounts.forEach((user) => {
        if (user.dematAccounts && user.dematAccounts.length > 0) {
          user.dematAccounts.forEach((demat) => {
            const broker = brokers.find((b) => b.id === demat.brokerId);
            exportData.push({
              'User Name': user.name,
              'PAN Number': user.panNumber,
              Address: user.address,
              Broker: broker ? broker.name : 'Unknown Broker',
              Balance: demat.balance
            });
          });
        } else {
          exportData.push({
            'User Name': user.name,
            'PAN Number': user.panNumber,
            Address: user.address,
            Broker: 'No Demat Account',
            Balance: '0.00'
          });
        }
      });

      // Convert to CSV format
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Wrap in quotes if contains comma or newline
              return typeof value === 'string' && (value.includes(',') || value.includes('\n')) ? `"${value.replace(/"/g, '""')}"` : value;
            })
            .join(',')
        )
      ].join('\n');

      // Create and download file
      this._downloadFile(csvContent, `user_accounts_${formatDateForFileName()}.csv`, 'text/csv');
    } catch (error) {
      throw new Error('Failed to export data. Please try again.');
    }
  }

  /**
   * Private method to handle file download
   * @param {string} content - File content
   * @param {string} filename - Name of the file
   * @param {string} mimeType - MIME type of the file
   */
  static _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  }
}
