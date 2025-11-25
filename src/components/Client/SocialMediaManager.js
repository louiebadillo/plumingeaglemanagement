import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Link as LinkIcon } from '@mui/icons-material';

const SOCIAL_MEDIA_PLATFORMS = [
  'Facebook',
  'Instagram',
  'Twitter',
  'LinkedIn',
  'TikTok',
  'Snapchat',
  'YouTube',
  'Other'
];

function SocialMediaManager({ socialMediaLinks = [], onUpdate, canEdit = true }) {
  const [open, setOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    platform: '',
    url: ''
  });

  const handleAddLink = () => {
    setEditingLink(null);
    setFormData({ platform: '', url: '' });
    setOpen(true);
  };

  const handleEditLink = (link, index) => {
    setEditingLink(index);
    setFormData({ platform: link.platform || '', url: link.url || '' });
    setOpen(true);
  };

  const handleDeleteLink = (index) => {
    const updatedLinks = socialMediaLinks.filter((_, i) => i !== index);
    onUpdate(updatedLinks);
  };

  const handleSaveLink = () => {
    if (!formData.platform || !formData.url) {
      alert('Please fill in both platform and URL');
      return;
    }

    const updatedLinks = [...socialMediaLinks];
    if (editingLink !== null) {
      updatedLinks[editingLink] = { ...formData };
    } else {
      updatedLinks.push({ ...formData });
    }
    onUpdate(updatedLinks);
    setOpen(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="textSecondary">
          Social Media Links
        </Typography>
        {canEdit && (
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddLink}>
            Add Link
          </Button>
        )}
      </Box>

      {socialMediaLinks.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No social media links added
        </Typography>
      ) : (
        <List dense>
          {socialMediaLinks.map((link, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <LinkIcon />
              </ListItemIcon>
              <ListItemText
                primary={link.platform || 'Unknown Platform'}
                secondary={link.url || 'No URL'}
              />
              {canEdit && (
                <ListItemSecondaryAction>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEditLink(link, index)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDeleteLink(index)} color="error">
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
        <DialogTitle>{editingLink !== null ? 'Edit Social Media Link' : 'Add Social Media Link'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Platform</InputLabel>
                <Select
                  value={formData.platform}
                  label="Platform"
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                >
                  {SOCIAL_MEDIA_PLATFORMS.map(platform => (
                    <MenuItem key={platform} value={platform}>{platform}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveLink} variant="contained">
            {editingLink !== null ? 'Update' : 'Add'} Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SocialMediaManager;

