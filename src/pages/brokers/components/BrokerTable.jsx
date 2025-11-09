import { useEffect, useRef, useState } from 'react';
import {
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
import { TABLE_CONFIG } from '../utils/constants';

/**
 * BrokerTable Component - Handles broker table display with keyboard navigation
 */
const BrokerTable = ({ brokers, onEdit, onDelete, currentPage, totalPages, onPageChange }) => {
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const tableContainerRef = useRef(null);
  const rowRefs = useRef([]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Handle Alt+E / Option+E for editing when a row is selected
      if (event.altKey && event.code === 'KeyE' && !event.ctrlKey && !event.metaKey) {
        if (activeRowIndex >= 0 && activeRowIndex < brokers.length) {
          event.preventDefault();
          onEdit(brokers[activeRowIndex]);
        }
        return;
      }

      // Handle Alt+Delete / Option+Delete for deleting when a row is selected
      // On Mac, Option+Delete sends 'Backspace', on Windows/Linux it's 'Delete'
      if (event.altKey && (event.code === 'Delete' || event.key === 'Delete' || event.code === 'Backspace' || event.key === 'Backspace') && !event.ctrlKey && !event.metaKey) {
        if (activeRowIndex >= 0 && activeRowIndex < brokers.length) {
          event.preventDefault();
          onDelete(brokers[activeRowIndex]._id);
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
      if (brokers.length === 0) return;

      if (event.altKey && event.key === 'ArrowDown' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveRowIndex((prevIndex) => {
          const newIndex = prevIndex < brokers.length - 1 ? prevIndex + 1 : prevIndex;
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
  }, [brokers.length, currentPage, totalPages, onPageChange, activeRowIndex, brokers, onEdit, onDelete]);

  // Reset active row when brokers change
  useEffect(() => {
    setActiveRowIndex(-1);
    rowRefs.current = [];
  }, [brokers]);

  return (
    <>
      <Divider />
      <TableContainer component={Paper} ref={tableContainerRef}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: TABLE_CONFIG.columns.name.width, minWidth: '200px', padding: TABLE_CONFIG.cellPadding }}>
                <strong>{TABLE_CONFIG.columns.name.label}</strong>
              </TableCell>
              <TableCell sx={{ width: TABLE_CONFIG.columns.panNumber.width, minWidth: '150px', padding: TABLE_CONFIG.cellPadding }}>
                <strong>{TABLE_CONFIG.columns.panNumber.label}</strong>
              </TableCell>
              <TableCell sx={{ width: TABLE_CONFIG.columns.address.width, minWidth: '200px', padding: TABLE_CONFIG.cellPadding }}>
                <strong>{TABLE_CONFIG.columns.address.label}</strong>
              </TableCell>
              <TableCell sx={{ width: TABLE_CONFIG.columns.actions.width, minWidth: '150px', padding: TABLE_CONFIG.cellPadding }}>
                <strong>{TABLE_CONFIG.columns.actions.label}</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brokers.length > 0 ? (
              brokers.map((broker, index) => (
                <TableRow 
                  key={broker._id}
                  hover
                  ref={(el) => (rowRefs.current[index] = el)}
                  selected={activeRowIndex === index}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setActiveRowIndex(index)}
                >
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ 
                      width: TABLE_CONFIG.columns.name.width,
                      minWidth: '200px', 
                      padding: '8px 16px 8px 16px', 
                      maxWidth: 0, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}
                  >
                    {broker.name}
                  </TableCell>
                  <TableCell sx={{ width: TABLE_CONFIG.columns.panNumber.width, minWidth: '150px', padding: TABLE_CONFIG.cellPadding }}>
                    {broker.panNumber}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      width: TABLE_CONFIG.columns.address.width, 
                      minWidth: '200px',
                      padding: TABLE_CONFIG.cellPadding, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}
                  >
                    {broker.address}
                  </TableCell>
                  <TableCell sx={{ width: TABLE_CONFIG.columns.actions.width, minWidth: '150px', padding: TABLE_CONFIG.cellPadding }}>
                    <IconButton onClick={() => onEdit(broker)} size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => onDelete(broker._id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No brokers found. Click "Add Broker" to create one.
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

export default BrokerTable;