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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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
  Stack,
  Chip
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
import { formatCurrency, formatCurrencyForInput } from 'utils/formatCurrency';
import { formatDate, formatDateForFileName } from 'utils/formatDate';
import { useAppDispatch } from 'store/hooks';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';

// Security types enum
const SECURITY_TYPES = [
  { value: 'EQUITY', label: 'Equity' },
  { value: 'FUTURES', label: 'Futures' },
  { value: 'OPTIONS', label: 'Options' },
  { value: 'COMMODITY', label: 'Commodity' },
  { value: 'CURRENCY', label: 'Currency' },
  { value: 'BOND', label: 'Bond' },
  { value: 'ETF', label: 'ETF' },
  { value: 'MUTUAL_FUND', label: 'Mutual Fund' }
];

// Stock exchanges (mock data)
const STOCK_EXCHANGES = [
  { id: 1, name: 'NSE (National Stock Exchange)', code: 'NSE' },
  { id: 2, name: 'BSE (Bombay Stock Exchange)', code: 'BSE' },
  { id: 3, name: 'MCX (Multi Commodity Exchange)', code: 'MCX' },
  { id: 4, name: 'NCDEX (National Commodity & Derivatives Exchange)', code: 'NCDEX' }
];

// Validation schema
const securityValidationSchema = yup.object({
  name: yup.string().required('Security name is required').min(2, 'Name must be at least 2 characters'),
  type: yup
    .string()
    .required('Security type is required')
    .oneOf(
      SECURITY_TYPES.map((type) => type.value),
      'Invalid security type'
    ),
  strikePrice: yup
    .number()
    .nullable()
    .when('type', {
      is: (val) => val === 'OPTIONS' || val === 'FUTURES',
      then: (schema) => schema.required('Strike price is required for Options/Futures').min(0, 'Strike price cannot be negative'),
      otherwise: (schema) => schema.min(0, 'Strike price cannot be negative')
    })
    .test('decimal', 'Strike price can have maximum 2 decimal places', (value) => {
      if (value === undefined || value === null || value === '') return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),
  expiry: yup
    .date()
    .nullable()
    .when('type', {
      is: (val) => val === 'OPTIONS' || val === 'FUTURES',
      then: (schema) => schema.required('Expiry date is required for Options/Futures').min(new Date(), 'Expiry date must be in the future'),
      otherwise: (schema) => schema.min(new Date(), 'Expiry date must be in the future')
    }),
  stockExchangeId: yup.string().required('Stock exchange is required')
});

// Get type color for chip
const getTypeColor = (type) => {
  const colorMap = {
    EQUITY: 'primary',
    FUTURES: 'secondary',
    OPTIONS: 'warning',
    COMMODITY: 'info',
    CURRENCY: 'success',
    BOND: 'default',
    ETF: 'primary',
    MUTUAL_FUND: 'secondary'
  };
  return colorMap[type] || 'default';
};

// Main component
const Security = () => {
  // Redux dispatch
  const dispatch = useAppDispatch();

  // State management
  const [searchName, setSearchName] = useState('');
  const [securities, setSecurities] = useState([
    {
      id: 1,
      name: 'Reliance Industries Ltd',
      type: 'EQUITY',
      strikePrice: null,
      expiry: null,
      stockExchangeId: '1'
    },
    {
      id: 2,
      name: 'NIFTY 50 JAN 2024 CE 18000',
      type: 'OPTIONS',
      strikePrice: 18000,
      expiry: '2024-01-25',
      stockExchangeId: '1'
    },
    {
      id: 3,
      name: 'GOLD JAN 2024 FUT',
      type: 'FUTURES',
      strikePrice: 60000,
      expiry: '2024-01-31',
      stockExchangeId: '3'
    },
    {
      id: 4,
      name: 'TCS Ltd',
      type: 'EQUITY',
      strikePrice: null,
      expiry: null,
      stockExchangeId: '1'
    },
    {
      id: 5,
      name: 'HDFC Bank Ltd',
      type: 'EQUITY',
      strikePrice: null,
      expiry: null,
      stockExchangeId: '2'
    }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingSecurity, setEditingSecurity] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  // Form handler
  const formik = useFormik({
    initialValues: {
      name: '',
      type: '',
      strikePrice: '',
      expiry: '',
      stockExchangeId: ''
    },
    validationSchema: securityValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      try {
        const processedValues = {
          ...values,
          strikePrice: values.strikePrice ? parseFloat(values.strikePrice) : null,
          expiry: values.expiry || null
        };

        if (editingSecurity) {
          // Update existing security
          setSecurities((prev) =>
            prev.map((security) => (security.id === editingSecurity.id ? { ...security, ...processedValues } : security))
          );
          setAlertMessage('Security updated successfully!');
        } else {
          // Create new security
          const newSecurity = {
            id: Math.max(...securities.map((s) => s.id), 0) + 1,
            ...processedValues
          };
          setSecurities((prev) => [...prev, newSecurity]);
          setAlertMessage('Security created successfully!');
        }
        setAlertSeverity('success');
        resetForm();
        setOpenDialog(false);
        setEditingSecurity(null);
      } catch (error) {
        console.error('Failed to save security:', error);
        setAlertMessage('Failed to save security. Please try again.');
        setAlertSeverity('error');
      }
    }
  });

  // Event handlers
  const handleAdd = () => {
    setEditingSecurity(null);
    formik.resetForm();
    setOpenDialog(true);
  };

  const handleEdit = (security) => {
    setEditingSecurity(security);
    formik.setValues({
      name: security.name,
      type: security.type,
      strikePrice: security.strikePrice ? formatCurrencyForInput(security.strikePrice) : '',
      expiry: security.expiry || '',
      stockExchangeId: security.stockExchangeId
    });
    setOpenDialog(true);
  };

  const handleDelete = (securityId) => {
    if (window.confirm('Are you sure you want to delete this security?')) {
      setSecurities((prev) => prev.filter((security) => security.id !== securityId));
      setAlertMessage('Security deleted successfully!');
      setAlertSeverity('success');
    }
  };

  // Get exchange name
  const getExchangeName = (exchangeId) => {
    const exchange = STOCK_EXCHANGES.find((ex) => ex.id.toString() === exchangeId);
    return exchange ? exchange.name : 'Unknown Exchange';
  };

  // Get type label
  const getTypeLabel = (type) => {
    const typeObj = SECURITY_TYPES.find((t) => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  // Filter securities based on search query (only when search button is clicked)
  const [searchQuery, setSearchQuery] = useState('');
  const filteredSecurities = securities.filter((security) =>
    searchQuery ? security.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  // Auto-hide alert
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // API function to search securities
  const searchSecurities = async () => {
    dispatch(showLoader());
    try {
      // Set the search query to trigger filtering
      setSearchQuery(searchName);
      
      // Simulate API call - replace with actual API endpoint
      // In real implementation, you would pass searchName as a parameter to the API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock API response - replace with actual API call
      // const response = await fetch(`/api/securities/search?name=${searchName}`);
      // const data = await response.json();
      // setSecurities(data);
    } catch {
      setAlertMessage('Search failed. Please try again.');
      setAlertSeverity('error');
    } finally {
      dispatch(hideLoader());
    }
  };

  // Export to Excel function
  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      // Simulate processing time for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Prepare data for export
      const exportData = filteredSecurities.map((security) => ({
        'Security Name': security.name,
        Type: getTypeLabel(security.type),
        'Strike Price': security.strikePrice ? security.strikePrice.toFixed(2) : '-',
        'Expiry Date': formatDate(security.expiry),
        Exchange: getExchangeName(security.stockExchangeId)
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
      link.setAttribute('download', `securities_${formatDateForFileName()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAlertMessage('Securities data exported successfully!');
      setAlertSeverity('success');
    } catch {
      setAlertMessage('Export failed. Please try again.');
      setAlertSeverity('error');
    } finally {
      dispatch(hideLoader());
    }
  };

  // Check if derivative type
  const isDerivative = (type) => type === 'OPTIONS' || type === 'FUTURES';

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {alertMessage && (
        <Alert severity={alertSeverity} sx={{ mb: 2 }} onClose={() => setAlertMessage('')}>
          {alertMessage}
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Security Management"
          subheader="Manage securities across different exchanges and types"
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchSecurities();
                  }
                }}
              />
              
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={searchSecurities}
                size="small"
                sx={{ minWidth: 100 }}
              >
                Search
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
                Add Security
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
                  <strong>Type</strong>
                </TableCell>
                <TableCell>
                  <strong>Strike Price</strong>
                </TableCell>
                <TableCell>
                  <strong>Expiry Date</strong>
                </TableCell>
                <TableCell>
                  <strong>Exchange</strong>
                </TableCell>
                <TableCell>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSecurities.length > 0 ? (
                filteredSecurities.map((security) => (
                  <TableRow key={security.id} hover>
                    <TableCell component="th" scope="row">
                      {security.name}
                    </TableCell>
                    <TableCell>
                      <Chip label={getTypeLabel(security.type)} color={getTypeColor(security.type)} size="small" />
                    </TableCell>
                    <TableCell>{security.strikePrice ? formatCurrency(security.strikePrice) : '-'}</TableCell>
                    <TableCell>{formatDate(security.expiry)}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getExchangeName(security.stockExchangeId)}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(security)} size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(security.id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      {searchQuery
                        ? `No securities found matching "${searchQuery}".`
                        : 'No securities found. Click "Add Security" to create one.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Security Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSecurity ? 'Edit Security' : 'Add New Security'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                name="name"
                label="Security Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                placeholder="e.g., Reliance Industries Ltd, NIFTY 50 JAN 2024 CE 18000"
              />

              <FormControl fullWidth>
                <InputLabel>Security Type</InputLabel>
                <Select
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.type && Boolean(formik.errors.type)}
                  label="Security Type"
                >
                  {SECURITY_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.type && formik.errors.type && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {formik.errors.type}
                  </Typography>
                )}
              </FormControl>

              {isDerivative(formik.values.type) && (
                <>
                  <TextField
                    fullWidth
                    name="strikePrice"
                    label="Strike Price"
                    type="number"
                    value={formik.values.strikePrice}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.strikePrice && Boolean(formik.errors.strikePrice)}
                    helperText={formik.touched.strikePrice && formik.errors.strikePrice}
                    InputProps={{
                      startAdornment: '₹'
                    }}
                    placeholder="0.00"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    fullWidth
                    name="expiry"
                    label="Expiry Date"
                    type="date"
                    value={formik.values.expiry}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.expiry && Boolean(formik.errors.expiry)}
                    helperText={formik.touched.expiry && formik.errors.expiry}
                    InputLabelProps={{
                      shrink: true
                    }}
                  />
                </>
              )}

              {!isDerivative(formik.values.type) && formik.values.type && (
                <TextField
                  fullWidth
                  name="strikePrice"
                  label="Strike Price (Optional)"
                  type="number"
                  value={formik.values.strikePrice}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.strikePrice && Boolean(formik.errors.strikePrice)}
                  helperText={formik.touched.strikePrice && formik.errors.strikePrice}
                  InputProps={{
                    startAdornment: '₹'
                  }}
                  placeholder="0.00"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              )}

              <FormControl fullWidth>
                <InputLabel>Stock Exchange</InputLabel>
                <Select
                  name="stockExchangeId"
                  value={formik.values.stockExchangeId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.stockExchangeId && Boolean(formik.errors.stockExchangeId)}
                  label="Stock Exchange"
                >
                  {STOCK_EXCHANGES.map((exchange) => (
                    <MenuItem key={exchange.id} value={exchange.id.toString()}>
                      {exchange.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.stockExchangeId && formik.errors.stockExchangeId && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {formik.errors.stockExchangeId}
                  </Typography>
                )}
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingSecurity ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Security;
