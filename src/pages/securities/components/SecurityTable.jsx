import { useEffect, useRef, useState } from 'react';
import {
  Chip,
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
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { getTypeColor, getTypeLabel } from '../utils/helpers';
import { TABLE_CONFIG } from '../utils/constants';

/**
 * SecurityTable Component - Handles security table display with keyboard navigation
 */
const SecurityTable = ({ securities, securityTypes, onEdit, onDelete, currentPage, totalPages, onPageChange }) => {
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const tableContainerRef = useRef(null);
  const rowRefs = useRef([]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Handle Alt+E / Option+E for editing when a row is selected
      if (event.altKey && event.code === 'KeyE' && !event.ctrlKey && !event.metaKey) {
        if (activeRowIndex >= 0 && activeRowIndex < securities.length) {
          event.preventDefault();
          onEdit(securities[activeRowIndex]);
        }
        return;
      }

      // Handle Alt+Delete / Option+Delete for deleting when a row is selected
      // On Mac, Option+Delete sends 'Backspace', on Windows/Linux it's 'Delete'
      if (event.altKey && (event.code === 'Delete' || event.key === 'Delete' || event.code === 'Backspace' || event.key === 'Backspace') && !event.ctrlKey && !event.metaKey) {
        if (activeRowIndex >= 0 && activeRowIndex < securities.length) {
          event.preventDefault();
          onDelete(securities[activeRowIndex]._id);
        }
        return;
      }

      // Handle Alt+left/right arrow keys for pagination
      if (event.altKey && event.key === 'ArrowLeft' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (currentPage > 1) {
          onPageChange(currentPage - 1);
        }
        return;
      } else if (event.altKey && event.key === 'ArrowRight' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1);
        }
        return;
      }

      // Handle Alt+up/down arrow keys for row navigation
      if (securities.length === 0) return;

      if (event.altKey && event.key === 'ArrowDown' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex < securities.length - 1 ? prevIndex + 1 : prevIndex;
          // Scroll to the active row
          if (rowRefs.current[newIndex]) {
            rowRefs.current[newIndex].scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest' 
            });
          }
          return newIndex;
        });
      } else if (event.altKey && event.key === 'ArrowUp' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex > 0 ? prevIndex - 1 : 0;
          // Scroll to the active row
          if (rowRefs.current[newIndex]) {
            rowRefs.current[newIndex].scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest' 
            });
          }
          return newIndex;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [securities.length, currentPage, totalPages, onPageChange, activeRowIndex, securities, onEdit, onDelete]);

  // Reset active row when securities change
  useEffect(() => {
    setActiveRowIndex(-1);
    rowRefs.current = [];
  }, [securities]);

  return (
    <>
      <Divider />
      <TableContainer component={Paper} ref={tableContainerRef}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '35%', minWidth: '200px', padding: '8px 16px 8px 16px' }}>
                <strong>{TABLE_CONFIG.columns.name.label}</strong>
              </TableCell>
              <TableCell sx={{ width: '15%', minWidth: '120px', padding: '8px 16px 8px 16px' }}>
                <strong>{TABLE_CONFIG.columns.type.label}</strong>
              </TableCell>
              <TableCell sx={{ width: '20%', minWidth: '150px', padding: '8px 16px 8px 16px' }}>
                <strong>{TABLE_CONFIG.columns.strikePrice.label}</strong>
              </TableCell>
              <TableCell sx={{ width: '20%', minWidth: '150px', padding: '8px 16px 8px 16px' }}>
                <strong>{TABLE_CONFIG.columns.expiry.label}</strong>
              </TableCell>
              <TableCell sx={{ width: '10%', padding: '8px 16px 8px 16px' }}>
                <strong>{TABLE_CONFIG.columns.actions.label}</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {securities.length > 0 ? (
              securities.map((security, index) => (
                <TableRow 
                  key={security._id} 
                  hover
                  selected={activeRowIndex === index}
                  ref={(el) => (rowRefs.current[index] = el)}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setActiveRowIndex(index)}
                >
                  <TableCell component="th" scope="row" sx={{ width: '35%', minWidth: '200px', padding: '8px 16px 8px 16px' }}>
                    {security.name}
                  </TableCell>
                  <TableCell sx={{ width: '15%', minWidth: '120px', padding: '8px 16px 8px 16px' }}>
                    <Chip
                      label={getTypeLabel(security.type, securityTypes)}
                      color={getTypeColor(security.type)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell sx={{ width: '20%', minWidth: '150px', padding: '8px 16px 8px 16px' }}>
                    {security.strikePrice ? formatCurrency(security.strikePrice) : '-'}
                  </TableCell>
                  <TableCell sx={{ width: '20%', minWidth: '150px', padding: '8px 16px 8px 16px' }}>
                    {formatDate(security.expiry)}
                  </TableCell>
                  <TableCell sx={{ width: '10%', padding: '8px 16px 8px 16px' }}>
                    <IconButton onClick={() => onEdit(security)} size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => onDelete(security._id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No securities found. Click "Add Security" to create one.
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

export default SecurityTable;