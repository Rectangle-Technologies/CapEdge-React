import { DeleteOutline, KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material';
import { Box, Chip, Collapse, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { formatCurrency } from 'utils/formatCurrency';
import { formatDate } from 'utils/formatDate';

function LedgerRow({ entry, index, isExpanded, onToggleExpand, getTransactionColor, isActive, onClick, rowRef, onDelete }) {
  const trades = entry.trades || [];
  const tradeCount = trades.length;
  const hasTrades = tradeCount > 0;
  const isDeletable = !hasTrades;
  const chipLabel = tradeCount >= 2 ? `${tradeCount} trades` : entry.type;

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
          {hasTrades && (
            <IconButton aria-label="expand row" size="small" onClick={() => onToggleExpand(entry._id)}>
              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell sx={{ padding: '8px 16px 8px 16px' }}>{formatDate(entry.date)}</TableCell>
        <TableCell sx={{ padding: '8px 16px 8px 16px' }}>
          <Chip label={chipLabel} size="small" color={getTransactionColor(entry.type)} />
        </TableCell>
        <TableCell align="right" sx={{ padding: '8px 16px 8px 16px' }}>
          <Typography variant="body2" fontWeight="bold" sx={{ color: entry.transactionAmount >= 0 ? 'success.main' : 'text.disabled' }}>
            {entry.transactionAmount >= 0 ? `+${formatCurrency(entry.transactionAmount)}` : '-'}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ padding: '8px 16px 8px 16px' }}>
          <Typography variant="body2" fontWeight="bold" sx={{ color: entry.transactionAmount < 0 ? 'error.main' : 'text.disabled' }}>
            {entry.transactionAmount < 0 ? `-${formatCurrency(Math.abs(entry.transactionAmount))}` : '-'}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ padding: '8px 16px 8px 16px' }}>
          <Typography variant="body2" sx={{ color: entry.balanceAfterEntry != null && entry.balanceAfterEntry < 0 ? 'error.main' : 'success.main' }}>
            {entry.balanceAfterEntry != null ? formatCurrency(entry.balanceAfterEntry) : '-'}
          </Typography>
        </TableCell>
        <TableCell align={entry.remarks ? 'left' : 'center'} sx={{ padding: '8px 16px 8px 16px' }}>
          {entry.remarks || '-'}
        </TableCell>
        <TableCell align="center" sx={{ padding: '8px 4px 8px 4px', width: 48 }}>
          {isDeletable && (
            <Tooltip title="Delete entry">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry._id);
                }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      {hasTrades && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 2 }}>
                <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2 }}>
                  Transaction Details
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ padding: '8px 16px' }}>
                        <strong>Reference</strong>
                      </TableCell>
                      <TableCell sx={{ padding: '8px 16px' }}>
                        <strong>Type</strong>
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
                    {trades.map((trade) => (
                      <TableRow key={trade._id}>
                        <TableCell sx={{ padding: '8px 16px' }}>
                          <Typography variant="body2">{trade.referenceNumber || '-'}</Typography>
                        </TableCell>
                        <TableCell sx={{ padding: '8px 16px' }}>
                          <Chip label={trade.type} size="small" color={getTransactionColor(trade.type)} />
                        </TableCell>
                        <TableCell sx={{ padding: '8px 16px' }}>{trade.securityName || '-'}</TableCell>
                        <TableCell align="right" sx={{ padding: '8px 16px' }}>
                          {trade.quantity ?? '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ padding: '8px 16px' }}>
                          {trade.price != null ? formatCurrency(trade.price) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
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
