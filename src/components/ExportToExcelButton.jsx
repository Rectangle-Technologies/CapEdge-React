import { Button, IconButton } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { showLoader, hideLoader } from '../store/slices/loaderSlice';
import { showErrorSnackbar, showSuccessSnackbar } from '../store/utils';
import { get, post } from '../utils/apiUtil';

/**
 * Reusable Export to Excel Button Component
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of objects to export
 * @param {string} props.filename - Name of the file to be downloaded (without extension)
 * @param {Object} props.sx - Additional styling
 * @param {string} props.title - Tooltip text
 */
const ExportToExcelButton = ({ data = [], filename = 'export', sx = {}, title = 'Export to Excel', ...otherProps }) => {
  const dispatch = useDispatch();
  const financialYear = useSelector((state) => state.app.financialYear);

  const handleExport = async () => {
    if (!data || data.length === 0) {
      showErrorSnackbar('No data available to export');
      return;
    }

    dispatch(showLoader());
    try {
      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 300));

      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || '';
              // Escape values that contain commas or quotes
              return value.toString().includes(',') || value.toString().includes('"') ? `"${value.toString().replace(/"/g, '""')}"` : value;
            })
            .join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccessSnackbar('Data exported successfully!');
    } catch (err) {
      showErrorSnackbar('Export failed. Please try again.');
      console.error('Export error:', err);
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleDownloadAll = async () => {
    dispatch(showLoader());
    try {
      const response = await get(`/report/holdings/export?financialYearId=${financialYear?._id}`, true, { responseType: 'arraybuffer' });
      // Today's date in DD/MM/YYYY format
      const today = new Date();
      const filename = `Holdings_${financialYear?.title || ''}.xlsx`;
      // Create Blob and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showErrorSnackbar('Download all failed. Please try again.');
      console.error('Download all error:', err);
    } finally {
      dispatch(hideLoader());
    }
  };

  return (
    <>
      <Button variant="contained" onClick={handleDownloadAll}>
        Download all
      </Button>
      {/* <IconButton
      onClick={handleExport}
      color="primary"
      title={title}
      sx={{
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 1,
        marginLeft: 2,
        ...sx
      }}
      {...otherProps}
    >
      <DownloadIcon />
    </IconButton> */}
    </>
  );
};

export default ExportToExcelButton;
