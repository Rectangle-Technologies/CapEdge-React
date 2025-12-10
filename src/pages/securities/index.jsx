import { useEffect, useState, useCallback } from 'react';
import { Box, Card, CardHeader, Pagination } from '@mui/material';
import { useFormik } from 'formik';
import { formatCurrencyForInput } from 'utils/formatCurrency';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { del, get, post, put } from '../../utils/apiUtil';
import { showErrorSnackbar, showSuccessSnackbar } from '../../store/utils';

// Import extracted modules
import SecurityDialog from './components/SecurityDialog';
import SecurityTable from './components/SecurityTable';
import SearchAndActions from './components/SearchAndActions';
import { createSecurityValidationSchema } from './utils/validation';
import { ROWS_PER_PAGE, API_ENDPOINTS } from './utils/constants';
import { processFormValues } from './utils/helpers';
import { SecurityExportService } from './services/securityExportService';
import { useDispatch } from 'react-redux';

// Main component
const Security = () => {
  // Redux dispatch
  const dispatch = useDispatch();

  // State management
  const [searchName, setSearchName] = useState('');
  const [securities, setSecurities] = useState([]);
  const [securityTypes, setSecurityTypes] = useState([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingSecurity, setEditingSecurity] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form handler
  const formik = useFormik({
    initialValues: {
      name: '',
      type: '',
      strikePrice: null,
      expiry: null
    },
    validationSchema: createSecurityValidationSchema(securityTypes),
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      dispatch(showLoader());
      try {
        const processedValues = processFormValues(values);

        if (editingSecurity) {
          // Update existing security
          await put(`/security/update/${editingSecurity._id}`, processedValues);
        } else {
          // Create new security
          await post('/security/create', processedValues);
        }
        await searchSecurities();
        showSuccessSnackbar(`Security ${editingSecurity ? 'updated' : 'added'} successfully.`);
        resetForm();
        setOpenDialog(false);
        setEditingSecurity(null);
      } catch (error) {
        console.error('Failed to save security:', error);
        showErrorSnackbar(error.message || 'Failed to save security. Please try again.');
      } finally {
        dispatch(hideLoader());
      }
    }
  });

  // Event handlers
  const handleAdd = useCallback(() => {
    setEditingSecurity(null);
    formik.resetForm();
    setOpenDialog(true);
  }, [formik]);

  const handleEdit = (security) => {
    setEditingSecurity(security);
    formik.setValues({
      name: security.name,
      type: security.type,
      strikePrice: formatCurrencyForInput(security.strikePrice) || null,
      expiry: security.expiry || null
    });
    setOpenDialog(true);
  };

  const handleDelete = async (securityId) => {
    if (window.confirm('Are you sure you want to delete this security?')) {
      dispatch(showLoader());
      try {
        await del(`/security/delete/${securityId}`);
        await searchSecurities();
        showSuccessSnackbar('Security deleted successfully.');
      } catch (error) {
        console.error('Failed to delete security:', error);
        showErrorSnackbar(error.message || 'Failed to delete security. Please try again.');
      } finally {
        dispatch(hideLoader());
      }
    }
  };

  // API function to search securities
  const searchSecurities = async () => {
    dispatch(showLoader());
    try {
      const data = await get(`${API_ENDPOINTS.getAllSecurities}?name=${searchName}&pageNo=${page}&limit=${ROWS_PER_PAGE}`);
      setSecurities(data.securities);
      setTotalPages(Math.ceil(data.pagination.total / ROWS_PER_PAGE));
      setSecurityTypes(data.securityTypes);
    } catch (error) {
      console.error('Failed to fetch securities:', error);
      showErrorSnackbar(error.message || 'Failed to fetch securities. Please try again.');
    } finally {
      dispatch(hideLoader());
    }
  };

  // Export to Excel function
  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      await SecurityExportService.exportToCSV(securities, securityTypes);
    } catch (error) {
      // Handle error silently or add your preferred error handling
      console.error('Export failed:', error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    // Initial fetch of securities and types
    searchSecurities();
  }, [page]);

  // Reset page to 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchName]);

  // Keyboard shortcut for Add Security: Alt+N (Option+N on Mac)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Use event.code instead of event.key to handle Mac's dead key issue with Option
      // Alt+N on all platforms (Alt is labeled as Option on Mac keyboards)
      if (event.altKey && event.code === 'KeyN' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault(); // Prevent browser default behavior
        handleAdd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleAdd]); // Include handleAdd to ensure we have latest version

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Card>
        <CardHeader
          title="Security Management"
          subheader="Manage securities across different exchanges and types"
          action={
            <SearchAndActions
              searchName={searchName}
              onSearchChange={(e) => setSearchName(e.target.value)}
              onSearch={searchSecurities}
              onExport={exportToExcel}
              onAdd={handleAdd}
            />
          }
        />

        <SecurityTable
          securities={securities}
          securityTypes={securityTypes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>

      <Box
        width="100%"
        sx={{
          mt: 4,
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Pagination count={totalPages} page={page} onChange={(event, value) => setPage(value)} />
      </Box>

      <SecurityDialog
        open={openDialog}
        editingSecurity={editingSecurity}
        formik={formik}
        securityTypes={securityTypes}
        onClose={() => setOpenDialog(false)}
      />
    </Box>
  );
};

export default Security;
