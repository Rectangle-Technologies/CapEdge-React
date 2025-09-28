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
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';

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
  // State management
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
          setBrokers((prev) =>
            prev.map((broker) => (broker.id === editingBroker.id ? { ...broker, ...values } : broker))
          );
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
      } catch (error) {
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              Add Broker
            </Button>
          }
        />
        <Divider />

        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>PAN Number</strong></TableCell>
                <TableCell><strong>Address</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {brokers.length > 0 ? (
                brokers.map((broker) => (
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
                      No brokers found. Click "Add Broker" to create one.
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
        <DialogTitle>
          {editingBroker ? 'Edit Broker' : 'Add New Broker'}
        </DialogTitle>
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