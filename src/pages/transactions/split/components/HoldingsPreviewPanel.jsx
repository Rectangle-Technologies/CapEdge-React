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
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon
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
  onClose,
  onUpdatePreviewRow,
  validationErrors
}) => {
  const displayData = isPreviewMode ? splitPreview : holdings;

  // Calculate totals
  const totalOriginalQuantity = holdings.reduce((sum, h) => sum + (h.quantity || 0), 0);
  const totalNewQuantity = splitPreview.reduce((sum, h) => sum + (h.newQuantity || 0), 0);

  // Check if there are any validation errors
  const hasValidationErrors = validationErrors && Object.keys(validationErrors).length > 0;

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
        description: multiplier > 1 ? `${num} share → ${den} shares (Stock Split)` : `${num} shares → ${den} share (Reverse Split)`
      };
    }
    return null;
  };

  const ratioInfo = getRatioInfo();

  // Handle editable field change
  const handleFieldChange = (index, field, value) => {
    const numValue = parseFloat(value) || 0;
    onUpdatePreviewRow(index, field, numValue);
  };

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
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SendIcon />}
                  onClick={onSubmitSplit}
                  disabled={hasValidationErrors}
                >
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

          {/* Validation Error Summary */}
          {hasValidationErrors && (
            <Alert severity="error" icon={<WarningIcon />} sx={{ mt: 2 }}>
              Some rows have validation errors. Old Qty × Old Price must equal New Qty × New Price.
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
                    {isPreviewMode && (
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">
                        Status
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayData.map((holding, index) => {
                    const hasError = validationErrors && validationErrors[index];
                    return (
                      <TableRow
                        key={holding._id || index}
                        sx={hasError ? { backgroundColor: 'error.lighter' } : {}}
                      >
                        <TableCell>{holding.dematAccountId?.userAccountId?.name || 'N/A'}</TableCell>
                        <TableCell>{holding.dematAccountId?.accountNumber || 'N/A'}</TableCell>
                        <TableCell align="right">
                          {isPreviewMode ? holding.originalQuantity : holding.quantity}
                        </TableCell>
                        {isPreviewMode && (
                          <TableCell align="right" sx={{ p: 0.5 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={holding.newQuantity}
                              onChange={(e) => handleFieldChange(index, 'newQuantity', e.target.value)}
                              error={hasError}
                              sx={{
                                width: 100,
                                '& input': {
                                  textAlign: 'right',
                                  py: 0.5,
                                  color: 'success.main',
                                  fontWeight: 'bold'
                                }
                              }}
                              inputProps={{ min: 0, step: 1 }}
                            />
                          </TableCell>
                        )}
                        <TableCell align="right">
                          {formatCurrency(isPreviewMode ? holding.originalPrice : holding.price)}
                        </TableCell>
                        {isPreviewMode && (
                          <TableCell align="right" sx={{ p: 0.5 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={holding.newPrice.toFixed(2)}
                              onChange={(e) => handleFieldChange(index, 'newPrice', e.target.value)}
                              error={hasError}
                              sx={{
                                width: 120,
                                '& input': {
                                  textAlign: 'right',
                                  py: 0.5,
                                  color: 'success.main',
                                  fontWeight: 'bold'
                                }
                              }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </TableCell>
                        )}
                        {isPreviewMode && (
                          <TableCell align="center">
                            {hasError ? (
                              <Tooltip title={validationErrors[index]}>
                                <WarningIcon color="error" fontSize="small" />
                              </Tooltip>
                            ) : (
                              <Typography color="success.main" fontSize="small">
                                ✓
                              </Typography>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
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
