import {
  Chip,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { getTypeColor, getTypeLabel } from '../utils/helpers';
import { TABLE_CONFIG } from '../utils/constants';

/**
 * SecurityTable Component - Handles security table display
 */
const SecurityTable = ({ securities, securityTypes, onEdit, onDelete }) => {
  return (
    <>
      <Divider />
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '35%', padding: '8px 16px 8px 16px' }}>
                <strong>{TABLE_CONFIG.columns.name.label}</strong>
              </TableCell>
              <TableCell sx={{ width: '15%', padding: '8px 16px 8px 16px' }}>
                <strong>{TABLE_CONFIG.columns.type.label}</strong>
              </TableCell>
              <TableCell sx={{ width: '20%', padding: '8px 16px 8px 16px' }}>
                <strong>{TABLE_CONFIG.columns.strikePrice.label}</strong>
              </TableCell>
              <TableCell sx={{ width: '20%', padding: '8px 16px 8px 16px' }}>
                <strong>{TABLE_CONFIG.columns.expiry.label}</strong>
              </TableCell>
              <TableCell sx={{ width: '10%', padding: '8px 16px 8px 16px' }}>
                <strong>{TABLE_CONFIG.columns.actions.label}</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {securities.length > 0 ? (
              securities.map((security) => (
                <TableRow key={security.id} hover>
                  <TableCell component="th" scope="row" sx={{ width: '35%', padding: '8px 16px 8px 16px' }}>
                    {security.name}
                  </TableCell>
                  <TableCell sx={{ width: '15%', padding: '8px 16px 8px 16px' }}>
                    <Chip
                      label={getTypeLabel(security.type, securityTypes)}
                      color={getTypeColor(security.type)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell sx={{ width: '20%', padding: '8px 16px 8px 16px' }}>
                    {security.strikePrice ? formatCurrency(security.strikePrice) : '-'}
                  </TableCell>
                  <TableCell sx={{ width: '20%', padding: '8px 16px 8px 16px' }}>
                    {formatDate(security.expiry)}
                  </TableCell>
                  <TableCell sx={{ width: '10%', padding: '8px 16px 8px 16px' }}>
                    <IconButton onClick={() => onEdit(security)} size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => onDelete(security.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No securities found. Click "Add Security" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default SecurityTable;