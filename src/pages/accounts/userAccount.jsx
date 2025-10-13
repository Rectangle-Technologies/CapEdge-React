import {
  Box,
  Card,
  CardHeader,
  Divider,
  Pagination
} from '@mui/material';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { hideLoader, showLoader } from 'store/slices/loaderSlice';
import { formatCurrencyForInput } from 'utils/formatCurrency';
import { del, get, post, put } from '../../utils/apiUtil';

// Import extracted modules
import { showErrorSnackbar, showSuccessSnackbar } from '../../store/utils';
import DematAccountDialog from './components/DematAccountDialog';
import SearchAndActions from './components/SearchAndActions';
import UserAccountDialog from './components/UserAccountDialog';
import UserAccountTable from './components/UserAccountTable';
import { UserAccountExportService } from './services/userAccountExportService';
import { ROWS_PER_PAGE } from './utils/constants';
import { dematAccountValidationSchema, userAccountValidationSchema } from './utils/validation';
import { useDispatch } from 'react-redux';

// Main component
const UserAccount = () => {
  // Redux dispatch
  const dispatch = useDispatch();

  // State management
  const [searchName, setSearchName] = useState('');
  const [userAccounts, setUserAccounts] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openDematDialog, setOpenDematDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDemat, setEditingDemat] = useState(null);
  const [selectedUserIdForDemat, setSelectedUserIdForDemat] = useState(null);

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
      dispatch(showLoader());
      try {
        if (editingUser) {
          // Update existing user
          await put(`/user-account/update/${editingUser._id}`, values);

        } else {
          // Create new user
          await post('/user-account/create', values);
        }
        await searchUserAccounts();
        // Trigger custom event to notify UserAccountDropdown to refresh
        window.dispatchEvent(new CustomEvent('userAccountsUpdated'));
        showSuccessSnackbar(`User account ${editingUser ? 'updated' : 'created'} successfully.`);
        resetForm();
        setOpenUserDialog(false);
        setEditingUser(null);
      } catch (error) {
        showErrorSnackbar(error.message || 'An error occurred. Please try again.');
      } finally {
        dispatch(hideLoader());
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
      dispatch(showLoader());
      try {
        if (editingDemat) {
          // Update existing demat account
          await put(`/demat-account/update/${editingDemat._id}`, {
              userAccountId: selectedUserIdForDemat.toString(),
              brokerId: editingDemat.brokerId,
              balance: parseFloat(values.balance)
            });
        } else {
          // Create new demat account
          await post('/demat-account/create', {
              userAccountId: selectedUserIdForDemat.toString(),
              brokerId: values.brokerId,
              balance: parseFloat(values.balance)
            });
        }
        await searchUserAccounts();
        // Trigger custom event to notify UserAccountDropdown to refresh
        window.dispatchEvent(new CustomEvent('userAccountsUpdated'));
        showSuccessSnackbar(`Demat account ${editingDemat ? 'updated' : 'created'} successfully.`);
        resetForm();
        setOpenDematDialog(false);
        setEditingDemat(null);
        setSelectedUserIdForDemat(null);
      } catch {
        // Handle error silently or add your preferred error handling
        showErrorSnackbar('An error occurred. Please try again.');
      } finally {
        dispatch(hideLoader());
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

  const handleDeleteDematAccount = async (dematAccountId) => {
    if (window.confirm('Are you sure you want to delete this demat account?')) {
      dispatch(showLoader());
      try {
        await del(`/demat-account/delete/${dematAccountId}`);
        await searchUserAccounts();
        // Trigger custom event to notify UserAccountDropdown to refresh
        window.dispatchEvent(new CustomEvent('userAccountsUpdated'));
        showSuccessSnackbar('Demat account deleted successfully.');
      } catch (error) {
        showErrorSnackbar(error.message || 'Failed to delete demat account. Please try again.');
      } finally {
        dispatch(hideLoader());
      }
    }
  };

  // API function to search user accounts
  const searchUserAccounts = async () => {
    dispatch(showLoader());
    try {
      const userAccountData = await get(`/user-account/get-all?name=${searchName}&pageNo=${page}&limit=${ROWS_PER_PAGE}&includeDematAccounts=true`);
      const brokerData = await get(`/broker/get-all?name=${searchName}&pageNo=${page}&limit=${ROWS_PER_PAGE}`);
      setBrokers(brokerData.brokers);
      setUserAccounts(userAccountData.userAccounts || []);
      setTotalPages(Math.ceil((userAccountData.pagination.total) / ROWS_PER_PAGE));
    } catch (error) {
      // Handle error silently or add your preferred error handling
      showErrorSnackbar(error.message || 'Failed to fetch user accounts. Please try again.');
    } finally {
      dispatch(hideLoader());
    }
  };

  // Export to Excel function
  const exportToExcel = async () => {
    dispatch(showLoader());
    try {
      await UserAccountExportService.exportToCSV(userAccounts, brokers);
    } catch (error) {
      // Handle error silently or add your preferred error handling
      showErrorSnackbar('Export failed. Please try again.');
      console.error('Export failed:', error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    // Initial fetch of user accounts
    searchUserAccounts();
  }, [page]);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Card>
        <CardHeader
          title="User Account Management"
          subheader="Manage user accounts and their associated demat accounts"
          action={
            <SearchAndActions
              searchName={searchName}
              onSearchChange={setSearchName}
              onSearch={searchUserAccounts}
              onExport={exportToExcel}
              onAddUser={handleAddUser}
            />
          }
        />
        <Divider />

        <UserAccountTable
          userAccounts={userAccounts}
          searchName={searchName}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onAddDematAccount={handleAddDematAccount}
          onEditDematAccount={handleEditDematAccount}
          onDeleteDematAccount={handleDeleteDematAccount}
        />
      </Card>

      <Box width='100%' sx={{
        mt: 4,
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Pagination count={totalPages} onChange={(event, value) => setPage(value)} />
      </Box>

      {/* User Account Dialog */}
      <UserAccountDialog
        open={openUserDialog}
        onClose={() => setOpenUserDialog(false)}
        editingUser={editingUser}
        userFormik={userFormik}
      />

      {/* Demat Account Dialog */}
      <DematAccountDialog
        open={openDematDialog}
        onClose={() => setOpenDematDialog(false)}
        editingDemat={editingDemat}
        dematFormik={dematFormik}
        brokers={brokers}
      />
    </Box>
  );
};

export default UserAccount;
