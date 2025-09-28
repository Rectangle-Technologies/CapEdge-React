import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  TextField,
  Button,
  Typography,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAppDispatch } from 'store/hooks';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';

// Validation schema
const brokerValidationSchema = yup.object({
  name: yup.string().required('Broker name is required').min(2, 'Name must be at least 2 characters'),
  panNumber: yup
    .string()
    .required('PAN number is required')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN number must be in correct format (e.g., ABCDE1234F)'),
  address: yup.string().required('Address is required').min(10, 'Address must be at least 10 characters')
});

// Main component
const BrokerManagement = () => {
  // Redux dispatch
  const dispatch = useAppDispatch();

  // State management
  const [searchName, setSearchName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [brokers, setBrokers] = useState([
    { id: 1, name: 'Zerodha', address: 'Bangalore, Karnataka', panNumber: 'AAAAA0000A' },
    { id: 2, name: 'Angel Broking', address: 'Mumbai, Maharashtra', panNumber: 'BBBBB1111B' },
    { id: 3, name: 'ICICI Direct', address: 'Chennai, Tamil Nadu', panNumber: 'CCCCC2222C' },
    { id: 4, name: 'HDFC Securities', address: 'Mumbai, Maharashtra', panNumber: 'DDDDD3333D' },
    { id: 5, name: 'Kotak Securities', address: 'Mumbai, Maharashtra', panNumber: 'EEEEE4444E' }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingBroker, setEditingBroker] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

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
      try {
        if (editingBroker) {
          // Update existing broker
          setBrokers((prev) => prev.map((broker) => (broker.id === editingBroker.id ? { ...broker, ...values } : broker)));
          setAlertMessage('Broker updated successfully!');
        } else {
          // Create new broker
          const newBroker = {
            id: Math.max(...brokers.map((b) => b.id), 0) + 1,
            ...values
          };
          setBrokers((prev) => [...prev, newBroker]);
          setAlertMessage('Broker created successfully!');
        }
        setAlertSeverity('success');
        resetForm();
        setOpenDialog(false);
        setEditingBroker(null);
      } catch {
        setAlertMessage('Failed to save broker. Please try again.');
        setAlertSeverity('error');
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
      setAlertMessage('Broker deleted successfully!');
      setAlertSeverity('success');
    }
  };

  // Filter brokers based on search query (only when search button is clicked)
  const [searchQuery, setSearchQuery] = useState('');
  const filteredBrokers = brokers.filter((broker) => (searchQuery ? broker.name.toLowerCase().includes(searchQuery.toLowerCase()) : true));

  // API function to search brokers
  const searchBrokers = async () => {
    setIsSearching(true);
    try {
      // Set the search query to trigger filtering
      setSearchQuery(searchName);

      // Simulate API call - replace with actual API endpoint
      // In real implementation, you would pass searchName as a parameter to the API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock API response - replace with actual API call
      // const response = await fetch(`/api/brokers/search?name=${searchName}`);
      // const data = await response.json();
      // setBrokers(data);

      setAlertMessage(searchName ? `Search completed for "${searchName}"` : 'All brokers loaded');
      setAlertSeverity('success');
    } catch {
      setAlertMessage('Search failed. Please try again.');
      setAlertSeverity('error');
    } finally {
      setIsSearching(false);
    }
  };

  // Export to Excel function
  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      // Simulate processing time for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Prepare data for export
      const exportData = filteredBrokers.map((broker) => ({
        'Broker Name': broker.name,
        'PAN Number': broker.panNumber,
        Address: broker.address
      }));

      // Create CSV content
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || '';
              // Escape commas and quotes in CSV
              return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
            })
            .join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `brokers_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAlertMessage('Brokers data exported successfully!');
      setAlertSeverity('success');
    } catch {
      setAlertMessage('Export failed. Please try again.');
      setAlertSeverity('error');
    } finally {
      dispatch(hideLoader());
    }
  };

  // Auto-hide alert
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {alertMessage && (
        <Alert severity={alertSeverity} sx={{ mb: 2 }} onClose={() => setAlertMessage('')}>
          {alertMessage}
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Broker Management"
          subheader="Manage broker information and details"
          action={
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  minWidth: 250,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </Box>
                  )
                }}
              />

              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={searchBrokers}
                disabled={isSearching}
                size="small"
                sx={{ minWidth: 100 }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>

              <IconButton
                onClick={exportToExcel}
                color="primary"
                title="Export to Excel"
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 1
                }}
              >
                <DownloadIcon />
              </IconButton>

              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                Add Broker
              </Button>
            </Stack>
          }
        />
        <Divider />

        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Name</strong>
                </TableCell>
                <TableCell>
                  <strong>PAN Number</strong>
                </TableCell>
                <TableCell>
                  <strong>Address</strong>
                </TableCell>
                <TableCell>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBrokers.length > 0 ? (
                filteredBrokers.map((broker) => (
                  <TableRow key={broker.id}>
                    <TableCell component="th" scope="row">
                      {broker.name}
                    </TableCell>
                    <TableCell>{broker.panNumber}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {broker.address}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(broker)} size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(broker.id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      {searchQuery ? `No brokers found matching "${searchQuery}".` : 'No brokers found. Click "Add Broker" to create one.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Broker Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBroker ? 'Edit Broker' : 'Add New Broker'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                name="name"
                label="Broker Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                placeholder="Enter broker name"
              />
              <TextField
                fullWidth
                name="panNumber"
                label="PAN Number"
                placeholder="ABCDE1234F"
                value={formik.values.panNumber}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  formik.handleChange(e);
                }}
                onBlur={formik.handleBlur}
                error={formik.touched.panNumber && Boolean(formik.errors.panNumber)}
                helperText={formik.touched.panNumber && formik.errors.panNumber}
                inputProps={{
                  style: { textTransform: 'uppercase' },
                  maxLength: 10
                }}
              />
              <TextField
                fullWidth
                name="address"
                label="Address"
                multiline
                rows={3}
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                placeholder="Enter complete address"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingBroker ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default BrokerManagement;
