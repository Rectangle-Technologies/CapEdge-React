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
  Collapse,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { formatCurrency, formatCurrencyForInput } from 'utils/formatCurrency';

// Validation schemas
const userAccountValidationSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  panNumber: yup
    .string()
    .required('PAN number is required')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN number must be in correct format (e.g., ABCDE1234F)'),
  address: yup.string().required('Address is required').min(10, 'Address must be at least 10 characters')
});

const dematAccountValidationSchema = yup.object({
  brokerId: yup.string().required('Broker is required'),
  balance: yup
    .number()
    .required('Balance is required')
    .min(0, 'Balance cannot be negative')
    .test('decimal', 'Balance can have maximum 2 decimal places', (value) => {
      if (value === undefined || value === null) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    })
});

// Row component for expandable user accounts
function UserAccountRow({ userAccount, brokers, onEditUser, onDeleteUser, onAddDematAccount, onEditDematAccount, onDeleteDematAccount }) {
  const [open, setOpen] = useState(false);

  const getBrokerName = (brokerId) => {
    const broker = brokers.find((b) => b.id === brokerId);
    return broker ? broker.name : 'Unknown Broker';
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {userAccount.name}
        </TableCell>
        <TableCell>{userAccount.panNumber}</TableCell>
        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userAccount.address}
        </TableCell>
        <TableCell>
          <IconButton onClick={() => onEditUser(userAccount)} size="small" color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => onDeleteUser(userAccount.id)} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom component="div">
                  Demat Accounts ({userAccount.dematAccounts ? userAccount.dematAccounts.length : 0})
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => onAddDematAccount(userAccount.id)}
                >
                  Add Demat Account
                </Button>
              </Box>
              {userAccount.dematAccounts && userAccount.dematAccounts.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Broker</strong></TableCell>
                      <TableCell><strong>Balance</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userAccount.dematAccounts.map((dematAccount) => (
                      <TableRow key={dematAccount.id}>
                        <TableCell>{getBrokerName(dematAccount.brokerId)}</TableCell>
                        <TableCell>{formatCurrency(dematAccount.balance)}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => onEditDematAccount(dematAccount)} size="small" color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => onDeleteDematAccount(dematAccount.id)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', p: 2, textAlign: 'center' }}>
                  No demat accounts found. Click "Add Demat Account" to create one.
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// Main component
const UserAccount = () => {
  // State management
  const [userAccounts, setUserAccounts] = useState([
    {
      id: 1,
      name: 'John Doe',
      panNumber: 'ABCDE1234F',
      address: '123 Main Street, Mumbai, Maharashtra 400001',
      dematAccounts: [
        { id: 1, userAccountId: '1', brokerId: '1', balance: 50000 },
        { id: 2, userAccountId: '1', brokerId: '2', balance: 75000 }
      ]
    },
    {
      id: 2,
      name: 'Jane Smith',
      panNumber: 'FGHIJ5678K',
      address: '456 Park Avenue, Delhi, Delhi 110001',
      dematAccounts: [{ id: 3, userAccountId: '2', brokerId: '1', balance: 100000 }]
    },
    {
      id: 3,
      name: 'Rajesh Kumar',
      panNumber: 'KLMNO9876P',
      address: '789 Gandhi Road, Bangalore, Karnataka 560001',
      dematAccounts: []
    }
  ]);

  const [brokers] = useState([
    { id: '1', name: 'Zerodha', address: 'Bangalore, Karnataka', panNumber: 'AAAAA0000A' },
    { id: '2', name: 'Angel Broking', address: 'Mumbai, Maharashtra', panNumber: 'BBBBB1111B' },
    { id: '3', name: 'ICICI Direct', address: 'Chennai, Tamil Nadu', panNumber: 'CCCCC2222C' },
    { id: '4', name: 'HDFC Securities', address: 'Mumbai, Maharashtra', panNumber: 'DDDDD3333D' },
    { id: '5', name: 'Kotak Securities', address: 'Mumbai, Maharashtra', panNumber: 'EEEEE4444E' }
  ]);

  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openDematDialog, setOpenDematDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDemat, setEditingDemat] = useState(null);
  const [selectedUserIdForDemat, setSelectedUserIdForDemat] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  // Form handlers
  const userFormik = useFormik({
    initialValues: {
      name: '',
      panNumber: '',
      address: ''
    },
    validationSchema: userAccountValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editingUser) {
          // Update existing user
          setUserAccounts((prev) =>
            prev.map((user) => (user.id === editingUser.id ? { ...user, ...values } : user))
          );
          setAlertMessage('User account updated successfully!');
        } else {
          // Create new user
          const newUser = {
            id: Math.max(...userAccounts.map((u) => u.id), 0) + 1,
            ...values,
            dematAccounts: []
          };
          setUserAccounts((prev) => [...prev, newUser]);
          setAlertMessage('User account created successfully!');
        }
        setAlertSeverity('success');
        resetForm();
        setOpenUserDialog(false);
        setEditingUser(null);
      } catch (error) {
        setAlertMessage('Failed to save user account. Please try again.');
        setAlertSeverity('error');
      }
    }
  });

  const dematFormik = useFormik({
    initialValues: {
      brokerId: '',
      balance: ''
    },
    validationSchema: dematAccountValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editingDemat) {
          // Update existing demat account
          setUserAccounts((prev) =>
            prev.map((user) => ({
              ...user,
              dematAccounts: user.dematAccounts?.map((demat) =>
                demat.id === editingDemat.id ? { ...demat, ...values, balance: parseFloat(values.balance) } : demat
              )
            }))
          );
          setAlertMessage('Demat account updated successfully!');
        } else {
          // Create new demat account
          const newDematAccount = {
            id: Math.max(...userAccounts.flatMap((u) => u.dematAccounts?.map((d) => d.id) || []), 0) + 1,
            userAccountId: selectedUserIdForDemat.toString(),
            brokerId: values.brokerId,
            balance: parseFloat(values.balance)
          };
          setUserAccounts((prev) =>
            prev.map((user) =>
              user.id === selectedUserIdForDemat
                ? { ...user, dematAccounts: [...(user.dematAccounts || []), newDematAccount] }
                : user
            )
          );
          setAlertMessage('Demat account created successfully!');
        }
        setAlertSeverity('success');
        resetForm();
        setOpenDematDialog(false);
        setEditingDemat(null);
        setSelectedUserIdForDemat(null);
      } catch (error) {
        setAlertMessage('Failed to save demat account. Please try again.');
        setAlertSeverity('error');
      }
    }
  });

  // Event handlers
  const handleAddUser = () => {
    setEditingUser(null);
    userFormik.resetForm();
    setOpenUserDialog(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    userFormik.setValues({
      name: user.name,
      panNumber: user.panNumber,
      address: user.address
    });
    setOpenUserDialog(true);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user account? This will also delete all associated demat accounts.')) {
      setUserAccounts((prev) => prev.filter((user) => user.id !== userId));
      setAlertMessage('User account deleted successfully!');
      setAlertSeverity('success');
    }
  };

  const handleAddDematAccount = (userAccountId) => {
    setSelectedUserIdForDemat(userAccountId);
    setEditingDemat(null);
    dematFormik.resetForm();
    setOpenDematDialog(true);
  };

  const handleEditDematAccount = (dematAccount) => {
    setEditingDemat(dematAccount);
    dematFormik.setValues({
      brokerId: dematAccount.brokerId,
      balance: formatCurrencyForInput(dematAccount.balance)
    });
    setOpenDematDialog(true);
  };

  const handleDeleteDematAccount = (dematAccountId) => {
    if (window.confirm('Are you sure you want to delete this demat account?')) {
      setUserAccounts((prev) =>
        prev.map((user) => ({
          ...user,
          dematAccounts: user.dematAccounts?.filter((demat) => demat.id !== dematAccountId)
        }))
      );
      setAlertMessage('Demat account deleted successfully!');
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
          title="User Account Management"
          subheader="Manage user accounts and their associated demat accounts"
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddUser}>
              Add User Account
            </Button>
          }
        />
        <Divider />

        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>PAN Number</strong></TableCell>
                <TableCell><strong>Address</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userAccounts.length > 0 ? (
                userAccounts.map((userAccount) => (
                  <UserAccountRow
                    key={userAccount.id}
                    userAccount={userAccount}
                    brokers={brokers}
                    onEditUser={handleEditUser}
                    onDeleteUser={handleDeleteUser}
                    onAddDematAccount={handleAddDematAccount}
                    onEditDematAccount={handleEditDematAccount}
                    onDeleteDematAccount={handleDeleteDematAccount}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No user accounts found. Click "Add User Account" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* User Account Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User Account' : 'Add New User Account'}
        </DialogTitle>
        <form onSubmit={userFormik.handleSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                name="name"
                label="Full Name"
                value={userFormik.values.name}
                onChange={userFormik.handleChange}
                onBlur={userFormik.handleBlur}
                error={userFormik.touched.name && Boolean(userFormik.errors.name)}
                helperText={userFormik.touched.name && userFormik.errors.name}
                placeholder="Enter full name"
              />
              <TextField
                fullWidth
                name="panNumber"
                label="PAN Number"
                placeholder="ABCDE1234F"
                value={userFormik.values.panNumber}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  userFormik.handleChange(e);
                }}
                onBlur={userFormik.handleBlur}
                error={userFormik.touched.panNumber && Boolean(userFormik.errors.panNumber)}
                helperText={userFormik.touched.panNumber && userFormik.errors.panNumber}
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
                value={userFormik.values.address}
                onChange={userFormik.handleChange}
                onBlur={userFormik.handleBlur}
                error={userFormik.touched.address && Boolean(userFormik.errors.address)}
                helperText={userFormik.touched.address && userFormik.errors.address}
                placeholder="Enter complete address"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Demat Account Dialog */}
      <Dialog open={openDematDialog} onClose={() => setOpenDematDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDemat ? 'Edit Demat Account' : 'Add New Demat Account'}
        </DialogTitle>
        <form onSubmit={dematFormik.handleSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Broker</InputLabel>
                <Select
                  name="brokerId"
                  value={dematFormik.values.brokerId}
                  onChange={dematFormik.handleChange}
                  onBlur={dematFormik.handleBlur}
                  error={dematFormik.touched.brokerId && Boolean(dematFormik.errors.brokerId)}
                  label="Broker"
                >
                  {brokers.map((broker) => (
                    <MenuItem key={broker.id} value={broker.id}>
                      {broker.name}
                    </MenuItem>
                  ))}
                </Select>
                {dematFormik.touched.brokerId && dematFormik.errors.brokerId && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {dematFormik.errors.brokerId}
                  </Typography>
                )}
              </FormControl>
              <TextField
                fullWidth
                name="balance"
                label="Initial Balance"
                type="number"
                value={dematFormik.values.balance}
                onChange={dematFormik.handleChange}
                onBlur={dematFormik.handleBlur}
                error={dematFormik.touched.balance && Boolean(dematFormik.errors.balance)}
                helperText={dematFormik.touched.balance && dematFormik.errors.balance}
                InputProps={{
                  startAdornment: '₹'
                }}
                placeholder="0.00"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDematDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingDemat ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserAccount;
