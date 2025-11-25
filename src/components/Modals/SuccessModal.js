import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

function SuccessModal({ open, onClose, title, message }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
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
          <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
          <Typography variant="h6" component="span">
            {title || 'Success!'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="primary"
          autoFocus
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SuccessModal;

