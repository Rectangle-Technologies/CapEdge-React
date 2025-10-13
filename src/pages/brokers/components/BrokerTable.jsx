import {
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
import { TABLE_CONFIG } from '../utils/constants';

/**
 * BrokerTable Component - Handles broker table display
 */
const BrokerTable = ({ brokers, onEdit, onDelete }) => {
  return (
    <>
      <Divider />
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: TABLE_CONFIG.columns.name.width, padding: TABLE_CONFIG.cellPadding }}>
                <strong>{TABLE_CONFIG.columns.name.label}</strong>
              </TableCell>
              <TableCell sx={{ width: TABLE_CONFIG.columns.panNumber.width, padding: TABLE_CONFIG.cellPadding }}>
                <strong>{TABLE_CONFIG.columns.panNumber.label}</strong>
              </TableCell>
              <TableCell sx={{ width: TABLE_CONFIG.columns.address.width, padding: TABLE_CONFIG.cellPadding }}>
                <strong>{TABLE_CONFIG.columns.address.label}</strong>
              </TableCell>
              <TableCell sx={{ width: TABLE_CONFIG.columns.actions.width, padding: TABLE_CONFIG.cellPadding }}>
                <strong>{TABLE_CONFIG.columns.actions.label}</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brokers.length > 0 ? (
              brokers.map((broker) => (
                <TableRow key={broker._id}>
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ 
                      width: TABLE_CONFIG.columns.name.width, 
                      padding: '8px 16px 8px 16px', 
                      maxWidth: 0, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}
                  >
                    {broker.name}
                  </TableCell>
                  <TableCell sx={{ width: TABLE_CONFIG.columns.panNumber.width, padding: TABLE_CONFIG.cellPadding }}>
                    {broker.panNumber}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      width: TABLE_CONFIG.columns.address.width, 
                      padding: TABLE_CONFIG.cellPadding, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}
                  >
                    {broker.address}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => onEdit(broker)} size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => onDelete(broker.id)} size="small" color="error">
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
    </>
  );
};

export default BrokerTable;