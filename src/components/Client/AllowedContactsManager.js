import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ContactPhone as ContactPhoneIcon } from '@mui/icons-material';

function AllowedContactsManager({ allowedContacts = [], onUpdate, canEdit = true }) {
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: ''
  });

  const handleAddContact = () => {
    setEditingContact(null);
    setFormData({ name: '', phone: '', relationship: '' });
    setOpen(true);
  };

  const handleEditContact = (contact, index) => {
    setEditingContact(index);
    setFormData({
      name: contact.name || '',
      phone: contact.phone || '',
      relationship: contact.relationship || ''
    });
    setOpen(true);
  };

  const handleDeleteContact = (index) => {
    const updatedContacts = allowedContacts.filter((_, i) => i !== index);
    onUpdate(updatedContacts);
  };

  const handleSaveContact = () => {
    if (!formData.name) {
      alert('Please enter a name');
      return;
    }

    const updatedContacts = [...allowedContacts];
    if (editingContact !== null) {
      updatedContacts[editingContact] = { ...formData };
    } else {
      updatedContacts.push({ ...formData });
    }
    onUpdate(updatedContacts);
    setOpen(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="textSecondary">
          Allowed Contacts
        </Typography>
        {canEdit && (
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddContact}>
            Add Contact
          </Button>
        )}
      </Box>

      {allowedContacts.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No allowed contacts added
        </Typography>
      ) : (
        <List dense>
          {allowedContacts.map((contact, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <ContactPhoneIcon />
              </ListItemIcon>
              <ListItemText
                primary={contact.name || 'Unknown'}
                secondary={
                  <>
                    {contact.phone && <Typography component="span" variant="caption" display="block">{contact.phone}</Typography>}
                    {contact.relationship && <Typography component="span" variant="caption" color="textSecondary" display="block">{contact.relationship}</Typography>}
                  </>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
              {canEdit && (
                <ListItemSecondaryAction>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEditContact(contact, index)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDeleteContact(index)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingContact !== null ? 'Edit Allowed Contact' : 'Add Allowed Contact'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Relationship"
                value={formData.relationship}
                onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                placeholder="e.g., Parent, Sibling, Friend"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveContact} variant="contained">
            {editingContact !== null ? 'Update' : 'Add'} Contact
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AllowedContactsManager;

