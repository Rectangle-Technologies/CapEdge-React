import {
  Box,
  Card,
  CardHeader,
  Divider
} from '@mui/material';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { useAppDispatch } from 'store/hooks';
import { hideLoader, showLoader } from 'store/slices/loaderSlice';
import { formatCurrencyForInput } from 'utils/formatCurrency';
import { get, post } from '../../utils/apiUtil';

// Import extracted modules
import DematAccountDialog from './components/DematAccountDialog';
import SearchAndActions from './components/SearchAndActions';
import UserAccountDialog from './components/UserAccountDialog';
import UserAccountTable from './components/UserAccountTable';
import { UserAccountExportService } from './services/userAccountExportService';
import { brokers, ROWS_PER_PAGE } from './utils/constants';
import { dematAccountValidationSchema, userAccountValidationSchema } from './utils/validation';
import { showErrorSnackbar, showSuccessSnackbar } from '../../store/utils';

// Main component
const UserAccount = () => {
  // Redux dispatch
  const dispatch = useAppDispatch();

  // State management
  const [searchName, setSearchName] = useState('');
  const [userAccounts, setUserAccounts] = useState([]);
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
          setUserAccounts((prev) =>
            prev.map((user) => (user.id === editingUser.id ? { ...user, ...values } : user))
          );
        } else {
          // Create new user
          await post('/user-account/create', values);
          // Fetch the updated list from the server
          await searchUserAccounts();
          showSuccessSnackbar('User account created successfully.');
        }
        resetForm();
        setOpenUserDialog(false);
        setEditingUser(null);
      } catch (error) {
        showErrorSnackbar(error.message || 'An error occurred. Please try again.');
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
        } else {
          // Create new demat account
          const newDematAccount = {
            id: Math.max(...(userAccounts.flatMap((u) => u.dematAccounts?.map((d) => d.id) || []).length > 0 ? userAccounts.flatMap((u) => u.dematAccounts?.map((d) => d.id) || []) : [0]), 0) + 1,
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
        }
        resetForm();
        setOpenDematDialog(false);
        setEditingDemat(null);
        setSelectedUserIdForDemat(null);
      } catch {
        // Handle error silently or add your preferred error handling
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

  const handleDeleteDematAccount = (dematAccountId) => {
    if (window.confirm('Are you sure you want to delete this demat account?')) {
      setUserAccounts((prev) =>
        prev.map((user) => ({
          ...user,
          dematAccounts: user.dematAccounts?.filter((demat) => demat.id !== dematAccountId)
        }))
      );
    }
  };

  // API function to search user accounts
  const searchUserAccounts = async () => {
    dispatch(showLoader());
    try {
      const data = await get(`/user-account/get-all?name=${searchName}&pageNo=${page}&limit=${ROWS_PER_PAGE}`);
      setUserAccounts(data.userAccounts || []);
      setTotalPages(Math.ceil((data.pagination.count) / ROWS_PER_PAGE));
    } catch (error) {
      // Handle error silently or add your preferred error handling
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
      console.error('Export failed:', error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    // Initial fetch of user accounts
    searchUserAccounts();
  }, []);

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
          brokers={brokers}
          searchName={searchName}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onAddDematAccount={handleAddDematAccount}
          onEditDematAccount={handleEditDematAccount}
          onDeleteDematAccount={handleDeleteDematAccount}
        />
      </Card>

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
