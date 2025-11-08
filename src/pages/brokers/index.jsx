import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  Pagination
} from '@mui/material';
import { useFormik } from 'formik';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { get, post, put } from '../../utils/apiUtil';

// Import extracted modules
import BrokerDialog from './components/BrokerDialog';
import BrokerTable from './components/BrokerTable';
import SearchAndActions from './components/SearchAndActions';
import { brokerValidationSchema } from './utils/validation';
import { ROWS_PER_PAGE } from './utils/constants';
import { BrokerExportService } from './services/brokerExportService';
import { showErrorSnackbar, showSuccessSnackbar } from '../../store/utils';
import { useDispatch } from 'react-redux';

// Main component
const BrokerManagement = () => {
  // Redux dispatch
  const dispatch = useDispatch();

  // State management
  const [searchName, setSearchName] = useState('');
  const [brokers, setBrokers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingBroker, setEditingBroker] = useState(null);

  // Form handler
  const formik = useFormik({
    initialValues: {
      name: '',
      panNumber: '',
      address: ''
    },
    validationSchema: brokerValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      dispatch(showLoader());
      try {
        if (editingBroker) {
          // Update existing broker
          await put(`/broker/update/${editingBroker._id}`, values);
        } else {
          // Create new broker
          await post('/broker/create', values);
        }
        await searchBrokers();
        showSuccessSnackbar(`Broker ${editingBroker ? 'updated' : 'created'} successfully.`);
        resetForm();
        setOpenDialog(false);
        setEditingBroker(null);
      } catch (error) {
        // Handle error silently or add your preferred error handling
        showErrorSnackbar(error.message || 'Failed to save broker. Please try again.');
      }
    }
  });

  // Event handlers
  const handleAdd = () => {
    setEditingBroker(null);
    formik.resetForm();
    setOpenDialog(true);
  };

  const handleEdit = (broker) => {
    setEditingBroker(broker);
    formik.setValues({
      name: broker.name,
      panNumber: broker.panNumber,
      address: broker.address
    });
    setOpenDialog(true);
  };

  const handleDelete = (brokerId) => {
    if (window.confirm('Are you sure you want to delete this broker?')) {
      setBrokers((prev) => prev.filter((broker) => broker.id !== brokerId));
    }
  };

  // API function to search brokers
  const searchBrokers = async () => {
    dispatch(showLoader());
    try {
      const data = await get(`/broker/get-all?name=${searchName}&pageNo=${page}&limit=${ROWS_PER_PAGE}`);
      setBrokers(data.brokers);
      setTotalPages(Math.ceil((data.pagination.total) / ROWS_PER_PAGE));
    } catch (error) {
      // Handle error silently or add your preferred error handling
      showErrorSnackbar(error.message || 'Failed to fetch brokers. Please try again.');
    } finally {
      dispatch(hideLoader());
    }
  };

  // Export to Excel function
  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      await BrokerExportService.exportToCSV(brokers);
    } catch (error) {
      // Handle error silently or add your preferred error handling
      showErrorSnackbar('Export failed. Please try again.');
      console.error('Export failed:', error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    // Initial fetch of brokers
    searchBrokers();
  }, [page]);

  // Reset page to 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchName]);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Card>
        <CardHeader
          title="Broker Management"
          subheader="Manage broker information and details"
          action={
            <SearchAndActions
              searchName={searchName}
              onSearchChange={(e) => setSearchName(e.target.value)}
              onSearch={searchBrokers}
              onExport={exportToExcel}
              onAdd={handleAdd}
            />
          }
        />

        <BrokerTable
          brokers={brokers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>

      <Box width='100%' sx={{
        mt: 4,
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Pagination count={totalPages} page={page} onChange={(event, value) => setPage(value)} />
      </Box>

      <BrokerDialog
        open={openDialog}
        editingBroker={editingBroker}
        formik={formik}
        onClose={() => setOpenDialog(false)}
      />
    </Box>
  );
};

export default BrokerManagement;
