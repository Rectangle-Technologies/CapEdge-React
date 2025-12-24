import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { Box, Button, Collapse, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { formatCurrency } from '../../../utils/formatCurrency';

/**
 * Expandable table row component for user accounts
 * Shows user details and their associated demat accounts
 */
function UserAccountRow({
  userAccount,
  isExpanded,
  onToggleExpand,
  onEditUser,
  onDeleteUser,
  onAddDematAccount,
  onEditDematAccount,
  onDeleteDematAccount,
  isActive,
  onClick,
  rowRef,
  index
}) {
  return (
    <>
      <TableRow
        ref={rowRef}
        selected={isActive}
        sx={{
          '& > *': { borderBottom: 'unset' },
          cursor: 'pointer',
          backgroundColor: index % 2 === 1 ? 'rgba(0, 0, 0, 0.02)' : 'inherit'
        }}
        hover
        onClick={onClick}
      >
        <TableCell sx={{ width: 60, padding: '8px 16px 8px 16px' }}>
          <IconButton aria-label="expand row" size="small" onClick={() => onToggleExpand(userAccount.id || userAccount._id)}>
            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" sx={{ width: '25%', minWidth: '200px', padding: '8px 16px 8px 16px' }}>
          {userAccount.name}
        </TableCell>
        <TableCell sx={{ width: '20%', minWidth: '150px', padding: '8px 16px 8px 16px' }}>{userAccount.panNumber}</TableCell>
        <TableCell
          sx={{
            width: '35%',
            minWidth: '200px',
            padding: '8px 16px 8px 16px',
            maxWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {userAccount.address}
        </TableCell>
        <TableCell sx={{ width: '20%', minWidth: '150px', padding: '8px 16px 8px 16px' }}>
          <IconButton onClick={() => onEditUser(userAccount)} size="small" color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => onDeleteUser(userAccount._id)} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom component="div">
                  Demat Accounts ({userAccount.dematAccounts ? userAccount.dematAccounts.length : 0})
                </Typography>
                <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => onAddDematAccount(userAccount._id)}>
                  Add Demat Account
                </Button>
              </Box>
              {userAccount.dematAccounts && userAccount.dematAccounts.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ padding: '8px 16px' }}>
                        <strong>Broker</strong>
                      </TableCell>
                      <TableCell sx={{ padding: '8px 16px' }}>
                        <strong>Balance</strong>
                      </TableCell>
                      <TableCell sx={{ padding: '8px 16px' }}>
                        <strong>Actions</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userAccount.dematAccounts.map((dematAccount) => (
                      <TableRow key={dematAccount._id}>
                        <TableCell sx={{ padding: '8px 16px' }}>{dematAccount.broker.name}</TableCell>
                        <TableCell sx={{ padding: '8px 16px' }}>{formatCurrency(dematAccount.balance)}</TableCell>
                        <TableCell sx={{ padding: '8px 16px' }}>
                          <IconButton onClick={() => onEditDematAccount(dematAccount, userAccount)} size="small" color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => onDeleteDematAccount(dematAccount._id)} size="small" color="error">
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

export default UserAccountRow;
