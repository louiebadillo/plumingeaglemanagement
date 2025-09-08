import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { getConfig, isFeatureEnabled } from '../../config/template';

// This is a test component to demonstrate configuration functionality
// You can remove this after testing
function ConfigTest() {
  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        🔧 Configuration Test
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Company Information:
        </Typography>
        <Typography>Name: {getConfig('COMPANY.NAME')}</Typography>
        <Typography>Tagline: {getConfig('COMPANY.TAGLINE')}</Typography>
        <Typography>Copyright: {getConfig('COMPANY.COPYRIGHT')}</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Authentication:
        </Typography>
        <Typography>Default Email: {getConfig('AUTH.DEFAULT_EMAIL')}</Typography>
        <Typography>Default Password: {getConfig('AUTH.DEFAULT_PASSWORD')}</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Features:
        </Typography>
        <Typography>Analytics: {isFeatureEnabled('ANALYTICS') ? '✅ Enabled' : '❌ Disabled'}</Typography>
        <Typography>Announcements: {isFeatureEnabled('ANNOUNCEMENTS') ? '✅ Enabled' : '❌ Disabled'}</Typography>
        <Typography>Staff Management: {isFeatureEnabled('STAFF_MANAGEMENT') ? '✅ Enabled' : '❌ Disabled'}</Typography>
        <Typography>Daily Reports: {isFeatureEnabled('DAILY_REPORTS') ? '✅ Enabled' : '❌ Disabled'}</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Theme Colors:
        </Typography>
        <Typography>Primary: {getConfig('THEME.PRIMARY_COLOR')}</Typography>
        <Typography>Secondary: {getConfig('THEME.SECONDARY_COLOR')}</Typography>
      </Box>

      <Typography variant="caption" color="textSecondary">
        This component shows that the configuration system is working. 
        You can remove this component after testing.
      </Typography>
    </Paper>
  );
}

export default ConfigTest;
