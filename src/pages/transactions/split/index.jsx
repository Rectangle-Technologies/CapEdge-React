import { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { CallSplit as SplitIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { get, post } from 'utils/apiUtil';
import { showLoader, hideLoader } from 'store/slices/loaderSlice';
import { showErrorSnackbar, showSuccessSnackbar } from 'store/utils';

// Import components
import SecurityListPanel from './components/SecurityListPanel';
import HoldingsPreviewPanel from './components/HoldingsPreviewPanel';

const Split = () => {
  const dispatch = useDispatch();
  const financialYear = useSelector((state) => state.app.financialYear);

  // State for securities panel
  const [securities, setSecurities] = useState([]);
  const [selectedSecurity, setSelectedSecurity] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State for holdings panel
  const [holdings, setHoldings] = useState([]);
  const [splitRatio, setSplitRatio] = useState('');
  const [splitPreview, setSplitPreview] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [ratioError, setRatioError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const ROWS_PER_PAGE = 50;

  // Fetch securities
  const fetchSecurities = useCallback(async () => {
    dispatch(showLoader());
    try {
      const data = await get(`/security/get-all?name=${searchName}&pageNo=${page}&limit=${ROWS_PER_PAGE}`);
      setSecurities(data.securities || []);
      setTotalPages(Math.ceil((data.pagination?.total || 0) / ROWS_PER_PAGE));
    } catch (error) {
      console.error('Failed to fetch securities:', error);
      showErrorSnackbar(error.message || 'Failed to fetch securities');
    } finally {
      dispatch(hideLoader());
    }
  }, [dispatch, searchName, page]);

  // Fetch holdings for selected security (across all users/accounts)
  const fetchHoldingsForSecurity = useCallback(
    async (securityId) => {
      dispatch(showLoader());
      try {
        // Fetch holdings for this security across all demat accounts
        const data = await get(`/holdings/get-all?securityId=${securityId}&financialYearId=${financialYear?._id || ''}`);
        setHoldings(data.holdings || []);
        setSplitPreview([]);
        setIsPreviewMode(false);
        setSplitRatio('');
      } catch (error) {
        console.error('Failed to fetch holdings:', error);
        showErrorSnackbar(error.message || 'Failed to fetch holdings');
      } finally {
        dispatch(hideLoader());
      }
    },
    [dispatch, financialYear]
  );

  // Handle security selection
  const handleSecuritySelect = (security) => {
    setSelectedSecurity(security);
    if (security) {
      fetchHoldingsForSecurity(security._id);
    } else {
      setHoldings([]);
      setSplitPreview([]);
      setIsPreviewMode(false);
    }
  };

  // Validate and parse split ratio
  const parseSplitRatio = (ratio) => {
    const trimmed = ratio.trim();

    // Match patterns like "1/2", "2/1", "1:2", "2:1"
    const match = trimmed.match(/^(\d+)\s*[/:]\s*(\d+)$/);

    if (!match) {
      return { valid: false, error: 'Invalid format. Use format like "1/2" or "2:1"' };
    }

    const numerator = parseInt(match[1], 10);
    const denominator = parseInt(match[2], 10);

    if (numerator <= 0 || denominator <= 0) {
      return { valid: false, error: 'Both numbers must be positive' };
    }

    // Split ratio: For "1/2" split means 1 share becomes 2 shares (multiplier = 2/1 = 2)
    // For "2/1" reverse split means 2 shares become 1 share (multiplier = 1/2 = 0.5)
    const multiplier = denominator / numerator;

    return { valid: true, numerator, denominator, multiplier };
  };

  // Calculate preview
  const handleCalculatePreview = () => {
    const parsed = parseSplitRatio(splitRatio);

    if (!parsed.valid) {
      setRatioError(parsed.error);
      return;
    }

    setRatioError('');

    const preview = holdings.map((holding) => ({
      ...holding,
      originalQuantity: holding.quantity,
      newQuantity: Math.floor(holding.quantity * parsed.multiplier),
      originalPrice: holding.price,
      newPrice: holding.price / parsed.multiplier,
      splitRatio: `${parsed.numerator}:${parsed.denominator}`
    }));

    setSplitPreview(preview);
    setIsPreviewMode(true);
  };

  // Submit split request
  const handleSubmitSplit = async () => {
    if (!selectedSecurity || splitPreview.length === 0) {
      showErrorSnackbar('Please select a security and calculate preview first');
      return;
    }

    // Validate all rows before submitting
    if (!validateAllRows(splitPreview)) {
      showErrorSnackbar('Please fix validation errors before submitting');
      return;
    }

    const parsed = parseSplitRatio(splitRatio);
    if (!parsed.valid) {
      showErrorSnackbar(parsed.error);
      return;
    }

    dispatch(showLoader());
    try {
      await post('/holdings/split', {
        securityId: selectedSecurity._id,
        splitRatioNumerator: parsed.numerator,
        splitRatioDenominator: parsed.denominator,
        holdings: splitPreview.map((h) => ({
          holdingId: h._id,
          newQuantity: h.newQuantity,
          newPrice: h.newPrice
        })),
        financialYearId: financialYear?._id
      });

      showSuccessSnackbar('Split applied successfully');

      // Refresh holdings
      fetchHoldingsForSecurity(selectedSecurity._id);
    } catch (error) {
      console.error('Failed to apply split:', error);
      showErrorSnackbar(error.message || 'Failed to apply split');
    } finally {
      dispatch(hideLoader());
    }
  };

  // Reset preview
  const handleResetPreview = () => {
    setIsPreviewMode(false);
    setSplitPreview([]);
    setValidationErrors({});
  };

  // Validate a single row: oldQty * oldPrice should equal newQty * newPrice
  const validateRow = (holding) => {
    const oldValue = holding.originalQuantity * holding.originalPrice;
    const newValue = holding.newQuantity * holding.newPrice;
    // Allow small floating point tolerance (0.01)
    const tolerance = 0.01;
    const isValid = Math.abs(oldValue - newValue) <= tolerance;
    return isValid ? null : `Value mismatch: ${oldValue} ≠ ${newValue}`;
  };

  // Validate all rows and update validation errors
  const validateAllRows = (preview) => {
    const errors = {};
    preview.forEach((holding, index) => {
      const error = validateRow(holding);
      if (error) {
        errors[index] = error;
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update a single row in the preview
  const handleUpdatePreviewRow = (index, field, value) => {
    setSplitPreview((prevPreview) => {
      const newPreview = [...prevPreview];
      newPreview[index] = {
        ...newPreview[index],
        [field]: value
      };
      // Validate after update
      validateAllRows(newPreview);
      return newPreview;
    });
  };

  // Effects
  useEffect(() => {
    fetchSecurities();
  }, [fetchSecurities]);

  useEffect(() => {
    setPage(1);
  }, [searchName]);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        <SplitIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Stock Split Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage stock splits by selecting a security, viewing current holdings across all users, and applying split ratios.
      </Typography>

      <Grid container spacing={3}>
        {/* Left Panel - Securities List */}
        <Grid size={{ xs: 12, md: selectedSecurity ? 5 : 12 }}>
          <SecurityListPanel
            securities={securities}
            selectedSecurity={selectedSecurity}
            searchName={searchName}
            onSearchChange={setSearchName}
            onSearch={fetchSecurities}
            onSecuritySelect={handleSecuritySelect}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </Grid>

        {/* Right Panel - Holdings Preview */}
        {selectedSecurity && (
          <Grid size={{ xs: 12, md: 7 }}>
            <HoldingsPreviewPanel
              selectedSecurity={selectedSecurity}
              holdings={holdings}
              splitRatio={splitRatio}
              onSplitRatioChange={setSplitRatio}
              ratioError={ratioError}
              splitPreview={splitPreview}
              isPreviewMode={isPreviewMode}
              onCalculatePreview={handleCalculatePreview}
              onResetPreview={handleResetPreview}
              onSubmitSplit={handleSubmitSplit}
              onClose={() => handleSecuritySelect(null)}
              onUpdatePreviewRow={handleUpdatePreviewRow}
              validationErrors={validationErrors}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Split;
