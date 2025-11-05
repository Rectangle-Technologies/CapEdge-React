import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate } from 'utils/formatDate';

/**
 * Expandable table row component for ledger entries
 * Shows main transaction info and expandable details for trade transactions
 */
function LedgerRow({
  entry,
  isExpanded,
  onToggleExpand,
  getTransactionColor
}) {
  const hasTradeTransaction = !!entry.tradeTransactionId._id;

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} hover>
        <TableCell sx={{ width: 60, padding: '8px 16px 8px 16px' }}>
          {hasTradeTransaction && (
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => onToggleExpand(entry._id)}
            >
              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell sx={{ padding: '8px 16px 8px 16px' }}>
          {formatDate(entry.date)}
        </TableCell>
        <TableCell sx={{ padding: '8px 16px 8px 16px' }}>
          <Chip
            label={entry.type}
            size="small"
            color={getTransactionColor(entry.type)}
          />
        </TableCell>
        <TableCell align="right" sx={{ padding: '8px 16px 8px 16px' }}>
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{ color: entry.transactionAmount >= 0 ? 'success.main' : 'error.main' }}
          >
            {entry.transactionAmount >= 0 ? `+${formatCurrency(entry.transactionAmount)}` : '-'}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ padding: '8px 16px 8px 16px' }}>
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{ color: entry.transactionAmount >= 0 ? 'success.main' : 'error.main' }}
          >
            {entry.transactionAmount < 0 ? formatCurrency(entry.transactionAmount) : '-'}
          </Typography>
        </TableCell>
      </TableRow>
      {hasTradeTransaction && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 2 }}>
                <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2 }}>
                  Transaction Details
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ padding: '8px 16px' }}>
                        <strong>Transaction ID</strong>
                      </TableCell>
                      <TableCell sx={{ padding: '8px 16px' }}>
                        <strong>Security</strong>
                      </TableCell>
                      <TableCell align="right" sx={{ padding: '8px 16px' }}>
                        <strong>Quantity</strong>
                      </TableCell>
                      <TableCell align="right" sx={{ padding: '8px 16px' }}>
                        <strong>Price</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ padding: '8px 16px' }}>
                        <Typography variant="body2" fontFamily="monospace">
                          {entry.tradeTransactionId._id}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '8px 16px' }}>
                        {entry.tradeTransactionId.securityName}
                      </TableCell>
                      <TableCell align="right" sx={{ padding: '8px 16px' }}>
                        {entry.tradeTransactionId.quantity}
                      </TableCell>
                      <TableCell align="right" sx={{ padding: '8px 16px' }}>
                        {formatCurrency(entry.tradeTransactionId.price)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default LedgerRow;
