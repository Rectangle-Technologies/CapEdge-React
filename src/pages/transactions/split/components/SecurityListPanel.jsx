import { useState, useRef, useEffect } from 'react';
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
  Chip,
  Box,
  Pagination,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const SecurityListPanel = ({
  securities,
  selectedSecurity,
  searchName,
  onSearchChange,
  onSearch,
  onSecuritySelect,
  page,
  totalPages,
  onPageChange
}) => {
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const rowRefs = useRef([]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (securities.length === 0) return;

      // Navigate with arrow keys
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex < securities.length - 1 ? prevIndex + 1 : prevIndex;
          if (rowRefs.current[newIndex]) {
            rowRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          return newIndex;
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex > 0 ? prevIndex - 1 : 0;
          if (rowRefs.current[newIndex]) {
            rowRefs.current[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          return newIndex;
        });
      } else if (event.key === 'Enter' && activeRowIndex >= 0) {
        event.preventDefault();
        onSecuritySelect(securities[activeRowIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [securities, activeRowIndex, onSecuritySelect]);

  // Reset active row when securities change
  useEffect(() => {
    setActiveRowIndex(-1);
    rowRefs.current = [];
  }, [securities]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'EQUITY':
        return 'primary';
      case 'MF':
        return 'success';
      case 'BOND':
        return 'warning';
      case 'FD':
        return 'info';
      case 'FUTURES':
        return 'secondary';
      case 'OPTIONS':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Select Security"
        subheader="Choose a security to view and manage split"
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ width: 200 }}
            />
            <Button variant="outlined" size="small" onClick={onSearch}>
              Search
            </Button>
          </Box>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {securities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                    No securities found
                  </TableCell>
                </TableRow>
              ) : (
                securities.map((security, index) => (
                  <TableRow
                    key={security._id}
                    ref={(el) => (rowRefs.current[index] = el)}
                    hover
                    selected={selectedSecurity?._id === security._id || activeRowIndex === index}
                    onClick={() => onSecuritySelect(security)}
                    sx={{
                      cursor: 'pointer',
                      '&.Mui-selected': {
                        backgroundColor: 'primary.lighter'
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'primary.light'
                      }
                    }}
                  >
                    <TableCell>{security.name}</TableCell>
                    <TableCell>
                      <Chip label={security.type} color={getTypeColor(security.type)} size="small" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination count={totalPages} page={page} onChange={(event, value) => onPageChange(value)} size="small" />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityListPanel;
