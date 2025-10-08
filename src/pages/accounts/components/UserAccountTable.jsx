import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from '@mui/material';
import UserAccountRow from './UserAccountRow';

/**
 * User Account Table Component
 * Displays the main table with user accounts and their data
 */
function UserAccountTable({ 
  userAccounts, 
  brokers, 
  searchName,
  onEditUser, 
  onDeleteUser, 
  onAddDematAccount, 
  onEditDematAccount, 
  onDeleteDematAccount 
}) {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 60, padding: '8px 16px 8px 16px' }} />
            <TableCell sx={{ width: '25%', padding: '8px 16px 8px 24px' }}>
              <strong>Name</strong>
            </TableCell>
            <TableCell sx={{ width: '20%', padding: '8px 16px 8px 16px' }}>
              <strong>PAN Number</strong>
            </TableCell>
            <TableCell sx={{ width: '35%', padding: '8px 16px 8px 16px' }}>
              <strong>Address</strong>
            </TableCell>
            <TableCell sx={{ width: '20%', padding: '8px 16px 8px 16px' }}>
              <strong>Actions</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {userAccounts && userAccounts.length > 0 ? (
            userAccounts.map((userAccount) => (
              <UserAccountRow
                key={userAccount.id || userAccount._id}
                userAccount={userAccount}
                brokers={brokers}
                onEditUser={onEditUser}
                onDeleteUser={onDeleteUser}
                onAddDematAccount={onAddDematAccount}
                onEditDematAccount={onEditDematAccount}
                onDeleteDematAccount={onDeleteDematAccount}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, padding: '32px 16px' }}>
                <Typography variant="body1" color="textSecondary">
                  {searchName
                    ? `No user accounts found matching "${searchName}".`
                    : 'No user accounts found. Click "Add User Account" to create one.'}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default UserAccountTable;