import {
  Box,
  TextField,
  Button,
  IconButton,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

/**
 * Search and Actions Component
 * Contains search functionality and action buttons
 */
function SearchAndActions({ 
  searchName, 
  onSearchChange, 
  onSearch, 
  onExport, 
  onAddUser 
}) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <TextField
        placeholder="Search by name..."
        value={searchName}
        onChange={(e) => onSearchChange(e.target.value)}
        variant="outlined"
        size="small"
        sx={{ 
          minWidth: 250,
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
          }
        }}
        slotProps={{
          input: {
            startAdornment: (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </Box>
            ),
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSearch();
          }
        }}
      />
      
      <Button
        variant="outlined"
        startIcon={<SearchIcon />}
        onClick={onSearch}
        size="small"
        sx={{ minWidth: 100 }}
      >
        Search
      </Button>
      
      <IconButton
        onClick={onExport}
        color="primary"
        title="Export to Excel"
        sx={{ 
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: 1
        }}
      >
        <DownloadIcon />
      </IconButton>
      
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAddUser}>
        Add User Account
      </Button>
    </Stack>
  );
}

export default SearchAndActions;