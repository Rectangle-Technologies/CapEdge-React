import { Box, Button, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import { Add as AddIcon, Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material';

/**
 * SearchAndActions Component - Handles search and action buttons
 */
const SearchAndActions = ({ searchName, onSearchChange, onSearch, onExport, onAdd }) => {
  // Detect platform for keyboard shortcut hint (Option on Mac, Alt on Windows/Linux)
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutHint = isMac ? '⌥N' : 'Alt+N';

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <TextField
        placeholder="Search by name..."
        value={searchName}
        onChange={onSearchChange}
        variant="outlined"
        size="small"
        sx={{
          minWidth: 250,
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper'
          }
        }}
        slotProps={{
          input: {
            startAdornment: (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </Box>
            )
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSearch();
          }
        }}
      />

      <Button variant="outlined" startIcon={<SearchIcon />} onClick={onSearch} size="small" sx={{ minWidth: 100 }}>
        Search
      </Button>

      <Tooltip title={`Add Broker (${shortcutHint})`} arrow>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          Add Broker
        </Button>
      </Tooltip>
    </Stack>
  );
};

export default SearchAndActions;
