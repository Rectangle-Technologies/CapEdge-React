import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Preview as PreviewIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { formatCurrency } from 'utils/formatCurrency';

const HoldingsPreviewPanel = ({
  selectedSecurity,
  holdings,
  splitRatio,
  onSplitRatioChange,
  ratioError,
  splitPreview,
  isPreviewMode,
  onCalculatePreview,
  onResetPreview,
  onSubmitSplit,
  onClose
}) => {
  const displayData = isPreviewMode ? splitPreview : holdings;

  // Calculate totals
  const totalOriginalQuantity = holdings.reduce((sum, h) => sum + (h.quantity || 0), 0);
  const totalNewQuantity = splitPreview.reduce((sum, h) => sum + (h.newQuantity || 0), 0);

  // Parse ratio for display
  const getRatioInfo = () => {
    const trimmed = splitRatio.trim();
    const match = trimmed.match(/^(\d+)\s*[/:]\s*(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      const den = parseInt(match[2], 10);
      const multiplier = den / num;
      return {
        isSplit: multiplier > 1,
        multiplier,
        description: multiplier > 1 ? `${num} share â†’ ${den} shares (Stock Split)` : `${num} shares â†’ ${den} share (Reverse Split)`
      };
    }
    return null;
  };

  const ratioInfo = getRatioInfo();

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{selectedSecurity?.name}</Typography>
            {selectedSecurity?.type && (
              <Typography variant="caption" color="text.secondary">
                ({selectedSecurity.type})
              </Typography>
            )}
          </Box>
        }
        subheader="Current holdings and split preview"
        action={
          <Tooltip title="Close">
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {/* Split Ratio Input Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Split Ratio
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              size="small"
              placeholder='e.g., "1/2" or "2:1"'
              value={splitRatio}
              onChange={(e) => onSplitRatioChange(e.target.value)}
              error={!!ratioError}
              helperText={ratioError || 'Enter ratio as "old/new" (e.g., 1/2 means 1 share becomes 2)'}
              sx={{ width: 200 }}
              disabled={isPreviewMode}
            />
            {!isPreviewMode ? (
              <Button
                variant="contained"
                startIcon={<PreviewIcon />}
                onClick={onCalculatePreview}
                disabled={!splitRatio.trim() || holdings.length === 0}
              >
                Preview
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onResetPreview}>
                  Reset
                </Button>
                <Button variant="contained" color="success" startIcon={<SendIcon />} onClick={onSubmitSplit}>
                  Apply Split
                </Button>
              </Box>
            )}
          </Box>

          {/* Ratio Info */}
          {ratioInfo && !ratioError && (
            <Alert
              severity={ratioInfo.isSplit ? 'info' : 'warning'}
              icon={ratioInfo.isSplit ? <TrendingUpIcon /> : <TrendingDownIcon />}
              sx={{ mt: 2 }}
            >
              {ratioInfo.description}
            </Alert>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Holdings Table */}
        <Typography variant="subtitle2" gutterBottom>
          {isPreviewMode ? 'Split Preview' : 'Current Holdings'} ({displayData.length} records)
        </Typography>

        {holdings.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No holdings found for this security.
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>User Account</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Demat Account</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">
                      {isPreviewMode ? 'Old Qty' : 'Quantity'}
                    </TableCell>
                    {isPreviewMode && (
                      <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }} align="right">
                        New Qty
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">
                      {isPreviewMode ? 'Old Price' : 'Avg Price'}
                    </TableCell>
                    {isPreviewMode && (
                      <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }} align="right">
                        New Price
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayData.map((holding, index) => (
                    <TableRow key={holding._id || index}>
                      <TableCell>{holding.dematAccountId?.userAccountId?.name || 'N/A'}</TableCell>
                      <TableCell>{holding.dematAccountId?.accountNumber || 'N/A'}</TableCell>
                      <TableCell align="right">{isPreviewMode ? holding.originalQuantity : holding.quantity}</TableCell>
                      {isPreviewMode && (
                        <TableCell
                          align="right"
                          sx={{
                            color: 'success.main',
                            fontWeight: 'bold',
                            backgroundColor: 'success.lighter'
                          }}
                        >
                          {holding.newQuantity}
                        </TableCell>
                      )}
                      <TableCell align="right">{formatCurrency(isPreviewMode ? holding.originalPrice : holding.price)}</TableCell>
                      {isPreviewMode && (
                        <TableCell
                          align="right"
                          sx={{
                            color: 'success.main',
                            fontWeight: 'bold',
                            backgroundColor: 'success.lighter'
                          }}
                        >
                          {formatCurrency(holding.newPrice)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total {isPreviewMode ? 'Original' : 'Current'} Quantity
                  </Typography>
                  <Typography variant="h6">{totalOriginalQuantity.toLocaleString()}</Typography>
                </Box>
                {isPreviewMode && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total New Quantity
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {totalNewQuantity.toLocaleString()}
                    </Typography>
                  </Box>
                )}
                {isPreviewMode && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Change
                    </Typography>
                    <Typography variant="h6" color={totalNewQuantity > totalOriginalQuantity ? 'success.main' : 'warning.main'}>
                      {totalNewQuantity > totalOriginalQuantity ? '+' : ''}
                      {(totalNewQuantity - totalOriginalQuantity).toLocaleString()} (
                      {((totalNewQuantity / totalOriginalQuantity - 1) * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HoldingsPreviewPanel;
