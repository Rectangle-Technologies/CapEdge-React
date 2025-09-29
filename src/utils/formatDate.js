/**
 * Format date values with consistent formatting across the application
 * @param {string|Date} date - The date to format
 * @param {string} format - Format type ('display' or 'input')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'display') => {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  if (format === 'input') {
    // For input fields (YYYY-MM-DD format)
    return dateObj.toISOString().split('T')[0];
  }
  
  // For display (DD/MM/YYYY format)
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format date for file naming (YYYY-MM-DD)
 * @param {Date} date - The date to format (defaults to current date)
 * @returns {string} Formatted date string for file naming
 */
export const formatDateForFileName = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

/**
 * Parse date string from DD/MM/YYYY to Date object
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {Date|null} Date object or null if invalid
 */
export const parseDateString = (dateString) => {
  if (!dateString || dateString === '-') return null;
  
  // Try to parse DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Fallback to standard Date parsing
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};