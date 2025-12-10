import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import UserAccountRow from './UserAccountRow';

/**
 * User Account Table Component - with keyboard navigation
 * Displays the main table with user accounts and their data
 */
function UserAccountTable({
  userAccounts,
  searchName,
  onEditUser,
  onDeleteUser,
  onAddDematAccount,
  onEditDematAccount,
  onDeleteDematAccount,
  currentPage,
  totalPages,
  onPageChange
}) {
  // State to track which row is expanded (only one at a time)
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const tableContainerRef = useRef(null);
  const rowRefs = useRef([]);

  // Handle row toggle - close current if same row, otherwise open new row
  const handleRowToggle = (userId) => {
    setExpandedRowId(expandedRowId === userId ? null : userId);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Handle Alt+E / Option+E for editing when a row is selected
      if (event.altKey && event.code === 'KeyE' && !event.ctrlKey && !event.metaKey) {
        if (activeRowIndex >= 0 && activeRowIndex < userAccounts.length) {
          event.preventDefault();
          onEditUser(userAccounts[activeRowIndex]);
        }
        return;
      }

      // Handle Alt+Delete / Option+Delete for deleting when a row is selected
      // On Mac, Option+Delete sends 'Backspace', on Windows/Linux it's 'Delete'
      if (
        event.altKey &&
        (event.code === 'Delete' || event.key === 'Delete' || event.code === 'Backspace' || event.key === 'Backspace') &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        if (activeRowIndex >= 0 && activeRowIndex < userAccounts.length) {
          event.preventDefault();
          onDeleteUser(userAccounts[activeRowIndex]._id);
        }
        return;
      }

      // Handle Alt+left/right arrow keys for pagination
      if (event.altKey && event.key === 'ArrowLeft' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (currentPage > 1) {
          onPageChange(currentPage - 1);
        }
        return;
      } else if (event.altKey && event.key === 'ArrowRight' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1);
        }
        return;
      }

      // Handle Enter key to expand/collapse active row
      if (event.key === 'Enter') {
        event.preventDefault();
        if (activeRowIndex !== -1 && userAccounts.length > 0) {
          const userAccount = userAccounts[activeRowIndex];
          const userId = userAccount.id || userAccount._id;
          handleRowToggle(userId);
        }
        return;
      }

      // Handle Alt+up/down arrow keys for row navigation
      if (userAccounts.length === 0) return;

      if (event.altKey && event.key === 'ArrowDown' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex < userAccounts.length - 1 ? prevIndex + 1 : prevIndex;
          // Scroll to the active row
          if (rowRefs.current[newIndex]) {
            rowRefs.current[newIndex].scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }
          return newIndex;
        });
      } else if (event.altKey && event.key === 'ArrowUp' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex > 0 ? prevIndex - 1 : 0;
          // Scroll to the active row
          if (rowRefs.current[newIndex]) {
            rowRefs.current[newIndex].scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }
          return newIndex;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userAccounts, currentPage, totalPages, onPageChange, activeRowIndex, expandedRowId, onEditUser, onDeleteUser]);

  // Reset active row when user accounts change
  useEffect(() => {
    setActiveRowIndex(-1);
    rowRefs.current = [];
  }, [userAccounts]);

  return (
    <TableContainer component={Paper} ref={tableContainerRef}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 60, padding: '8px 16px 8px 16px' }} />
            <TableCell sx={{ width: '25%', minWidth: '200px', padding: '8px 16px 8px 24px' }}>
              <strong>Name</strong>
            </TableCell>
            <TableCell sx={{ width: '20%', minWidth: '150px', padding: '8px 16px 8px 16px' }}>
              <strong>PAN Number</strong>
            </TableCell>
            <TableCell sx={{ width: '35%', minWidth: '200px', padding: '8px 16px 8px 16px' }}>
              <strong>Address</strong>
            </TableCell>
            <TableCell sx={{ width: '20%', minWidth: '150px', padding: '8px 16px 8px 16px' }}>
              <strong>Actions</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {userAccounts && userAccounts.length > 0 ? (
            userAccounts.map((userAccount, index) => (
              <UserAccountRow
                key={userAccount.id || userAccount._id}
                userAccount={userAccount}
                isExpanded={expandedRowId === (userAccount.id || userAccount._id)}
                onToggleExpand={handleRowToggle}
                onEditUser={onEditUser}
                onDeleteUser={onDeleteUser}
                onAddDematAccount={onAddDematAccount}
                onEditDematAccount={onEditDematAccount}
                onDeleteDematAccount={onDeleteDematAccount}
                isActive={activeRowIndex === index}
                onClick={() => setActiveRowIndex(index)}
                rowRef={(el) => (rowRefs.current[index] = el)}
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
