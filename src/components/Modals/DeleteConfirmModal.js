import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

function DeleteConfirmModal({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message,
  itemName,
  warningMessage,
  loading = false
}) {
  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <WarningIcon color="warning" sx={{ fontSize: 32 }} />
          <Typography variant="h6" component="span">
            {title || 'Confirm Deletion'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {warningMessage || 'This action cannot be undone.'}
        </Alert>
        <Typography variant="body1" gutterBottom>
          {message || `Are you sure you want to delete ${itemName ? `"${itemName}"` : 'this item'}?`}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          autoFocus
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteConfirmModal;

