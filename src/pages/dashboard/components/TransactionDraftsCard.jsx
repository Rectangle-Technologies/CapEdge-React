import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import { loadDrafts, deleteDraft } from 'utils/transactionDrafts';
import { formatDate } from 'utils/formatDate';

const TransactionDraftsCard = () => {
  const navigate = useNavigate();
  const userAccount = useSelector((state) => state.app.currentUserAccount);
  const [drafts, setDrafts] = useState([]);

  const refresh = () => {
    if (!userAccount?._id) {
      setDrafts([]);
      return;
    }
    setDrafts(loadDrafts(userAccount._id));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAccount?._id]);

  // Pick up drafts saved from another tab/window.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key && e.key.startsWith('capedge:transaction-drafts:')) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAccount?._id]);

  const onOpen = (draft) => {
    if (draft.isEditMode && draft.editSnapshot?._id) {
      navigate(`/edit-transaction/${draft.editSnapshot._id}`, {
        state: { draftId: draft.id, editTransaction: draft.editSnapshot }
      });
    } else {
      navigate('/add-transaction', { state: { draftId: draft.id } });
    }
  };

  const onDelete = (e, draft) => {
    e.stopPropagation();
    deleteDraft(userAccount._id, draft.id);
    refresh();
  };

  if (!userAccount?._id || drafts.length === 0) return null;

  return (
    <Grid size={{ xs: 12 }}>
      <Card>
        <CardHeader
          avatar={<DraftsOutlinedIcon color="action" />}
          title={
            <Typography variant="h5" component="div">
              Saved Drafts ({drafts.length})
            </Typography>
          }
          subheader="Resume an in-progress transaction"
        />
        <Divider />
        <List disablePadding>
          {drafts.map((draft) => {
            const dateLabel = draft.transactionDate ? formatDate(draft.transactionDate) : 'No date';
            const refLabel = draft.referenceNumber?.trim() || 'No ref';
            const rowCount = Array.isArray(draft.transactions) ? draft.transactions.length : 0;
            const savedAtLabel = draft.savedAt ? new Date(draft.savedAt).toLocaleString('en-GB') : '';
            return (
              <ListItem
                key={draft.id}
                disablePadding
                divider
                secondaryAction={
                  <Tooltip title="Delete draft" arrow>
                    <IconButton edge="end" color="error" onClick={(e) => onDelete(e, draft)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemButton onClick={() => onOpen(draft)}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {dateLabel} • {refLabel}
                        </Typography>
                        {draft.isEditMode && <Chip size="small" label="Edit" color="warning" variant="outlined" />}
                        <Chip size="small" label={`${rowCount} row${rowCount === 1 ? '' : 's'}`} variant="outlined" />
                      </Box>
                    }
                    secondary={savedAtLabel ? `Saved ${savedAtLabel}` : null}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Card>
    </Grid>
  );
};

export default TransactionDraftsCard;
