import { formatDate, formatDateForFileName } from '../../../utils/formatDate';
import { getTypeLabel } from '../utils/helpers';

/**
 * Security Export Service
 * Handles exporting security data to various formats
 */
export class SecurityExportService {
  /**
   * Export securities data to CSV format
   * @param {Array} securities - Array of security objects
   * @param {Array} securityTypes - Array of security type objects for reference
   * @returns {Promise} Promise that resolves when export is complete
   */
  static async exportToCSV(securities, securityTypes) {
    try {
      // Simulate processing time for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Prepare data for export
      const exportData = securities.map((security) => ({
        'Security Name': security.name,
        Type: getTypeLabel(security.type, securityTypes),
        'Strike Price': security.strikePrice ? security.strikePrice : '-',
        'Expiry Date': formatDate(security.expiry)
      }));

      // Convert to CSV format
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || '';
              // Wrap in quotes if contains comma or newline
              return typeof value === 'string' && (value.includes(',') || value.includes('\n')) ? `"${value.replace(/"/g, '""')}"` : value;
            })
            .join(',')
        )
      ].join('\n');

      // Create and download file
      this._downloadFile(csvContent, `securities_${formatDateForFileName()}.csv`, 'text/csv');
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
