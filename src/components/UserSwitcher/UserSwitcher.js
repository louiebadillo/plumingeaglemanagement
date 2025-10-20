import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import { Person as PersonIcon, AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import { useSupabase } from '../../context/SupabaseContext';
import { mockUsers } from '../../context/mock';

function UserSwitcher() {
  const { userProfile, user } = useSupabase();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('devUser') || '{}');
      // If no user or invalid user, default to admin
      if (!user.role || !user.firstName) {
        return mockUsers.admin;
      }
      return user;
    } catch {
      return mockUsers.admin;
    }
  });

  // Update current user when userProfile changes
  useEffect(() => {
    if (userProfile) {
      const devUser = {
        id: userProfile.id,
        firstName: userProfile.first_name || 'User',
        lastName: userProfile.last_name || '',
        email: userProfile.email,
        role: userProfile.role || 'employee',
        phoneNumber: userProfile.phone || '',
      };
      setCurrentUser(devUser);
    }
  }, [userProfile]);

  const switchUser = (userType) => {
    const user = mockUsers[userType];
    
    // Store the development user in localStorage for the switcher
    localStorage.setItem('devUser', JSON.stringify(user));
    
    // For development purposes, we'll update the userProfile in localStorage
    // and then reload the page to apply the new role
    const updatedProfile = {
      ...userProfile,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone: user.phoneNumber
    };
    
    // Store the updated profile in localStorage for the SupabaseContext to pick up
    localStorage.setItem('devUserProfile', JSON.stringify(updatedProfile));
    
    // Force a context update by triggering a re-render
    setCurrentUser(user);
    
    // Reload the page to apply new sidebar structure
    window.location.reload();
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminIcon />;
      case 'employee':
        return <PersonIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'employee':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ maxWidth: 400, margin: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          User Role Switcher (Development)
        </Typography>
        
        <Box mb={2}>
          <Typography variant="subtitle2" color="textSecondary">
            Current User:
          </Typography>
          <Box display="flex" alignItems="center" mt={1}>
            <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
              {getRoleIcon(currentUser.role)}
            </Avatar>
            <Box>
              <Typography variant="body1">
                {currentUser.firstName} {currentUser.lastName}
              </Typography>
              <Chip 
                label={(currentUser.role || 'employee').toUpperCase()} 
                sx={{
                  backgroundColor: getRoleColor(currentUser.role) === 'error' ? '#d32f2f' : 
                                  getRoleColor(currentUser.role) === 'primary' ? '#1976d2' : '#757575',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
                size="small"
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Switch to:
        </Typography>
        
        <Box display="flex" flexDirection="column" gap={1}>
          <Button
            variant={currentUser.role === 'admin' ? 'contained' : 'outlined'}
            sx={{ 
              backgroundColor: currentUser.role === 'admin' ? '#d32f2f' : 'transparent',
              color: currentUser.role === 'admin' ? 'white' : '#d32f2f',
              borderColor: '#d32f2f',
              '&:hover': {
                backgroundColor: currentUser.role === 'admin' ? '#b71c1c' : '#ffebee',
                borderColor: '#d32f2f'
              }
            }}
            startIcon={<AdminIcon />}
            onClick={() => switchUser('admin')}
            fullWidth
          >
            Admin User
          </Button>
          
          <Button
            variant={currentUser.role === 'employee' ? 'contained' : 'outlined'}
            sx={{ 
              backgroundColor: currentUser.role === 'employee' ? '#757575' : 'transparent',
              color: currentUser.role === 'employee' ? 'white' : '#757575',
              borderColor: '#757575',
              '&:hover': {
                backgroundColor: currentUser.role === 'employee' ? '#616161' : '#f5f5f5',
                borderColor: '#757575'
              }
            }}
            startIcon={<PersonIcon />}
            onClick={() => switchUser('employee')}
            fullWidth
          >
            Employee User
          </Button>
          
        </Box>

        <Box mt={2}>
          <Typography variant="caption" color="textSecondary">
            <strong>Admin:</strong> Full access to all features<br/>
            <strong>Employee:</strong> Limited access to reports and facilities
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default UserSwitcher;
