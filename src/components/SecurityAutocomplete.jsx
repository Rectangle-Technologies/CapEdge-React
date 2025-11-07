import { useState, useEffect, useRef } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { get } from '../utils/apiUtil';
import { showErrorSnackbar } from '../store/utils';

const SECURITY_SEARCH_MIN_CHARS = 1;
const SECURITY_SEARCH_DEBOUNCE_MS = 500;

/**
 * Reusable Security Autocomplete Component
 * @param {Object} props - Component props
 * @param {Object|null} props.value - Selected security object
 * @param {Function} props.onChange - Callback when security is selected/changed
 * @param {string} props.label - Label for the autocomplete field
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.size - Size of the component ('small', 'medium')
 * @param {boolean} props.disabled - Whether the field is disabled
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.fullWidth - Whether to use full width
 */
const SecurityAutocomplete = ({
  value = null,
  onChange,
  label = 'Security',
  required = false,
  size = null,
  disabled = false,
  placeholder = `Type at least ${SECURITY_SEARCH_MIN_CHARS} character${SECURITY_SEARCH_MIN_CHARS > 1 ? 's' : ''} to search securities`,
  fullWidth = true,
  ...otherProps
}) => {
  const [securities, setSecurities] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef(null);

  const fetchSecurities = (searchTerm = '') => {
    // Check minimum character requirement
    if (searchTerm && searchTerm.length < SECURITY_SEARCH_MIN_CHARS) {
      setSecurities([]);
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set up debounced fetch
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await get(`/security/get-all?name=&pageNo=1&limit=20&search=${encodeURIComponent(searchTerm)}`);
        const fetchedSecurities = response.securities || [];
        setSecurities(fetchedSecurities);
      } catch (error) {
        console.error('Error fetching securities:', error);
        showErrorSnackbar('Failed to fetch securities');
      } finally {
        setLoading(false);
      }
    }, SECURITY_SEARCH_DEBOUNCE_MS);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Autocomplete
      {...(size && { size })}
      fullWidth={fullWidth}
      value={value}
      disabled={disabled}
      onChange={(event, newValue) => onChange(newValue)}
      onInputChange={(event, newInputValue, reason) => {
        if (reason === 'input') {
          if (newInputValue.length < SECURITY_SEARCH_MIN_CHARS) {
            setSecurities([]);
            return;
          }
          fetchSecurities(newInputValue);
        }
      }}
      options={securities}
      getOptionLabel={(option) => option.name || ''}
      isOptionEqualToValue={(option, value) => option._id === value._id}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      noOptionsText={`Type at least ${SECURITY_SEARCH_MIN_CHARS} character${SECURITY_SEARCH_MIN_CHARS > 1 ? 's' : ''} to search securities`}
      {...otherProps}
    />
  );
};

export default SecurityAutocomplete;
