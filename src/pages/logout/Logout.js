import { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { CircularProgress, Typography, Box } from '@mui/material';
import { useSupabase } from '../../context/SupabaseContext';

function Logout(props) {
  const { signOut, user } = useSupabase();
  const [loggingOut, setLoggingOut] = useState(true);

  useEffect(() => {
    // Only sign out if user is actually logged in
    if (user) {
      console.log('🔄 Logout component: Starting logout...');
      signOut().then(() => {
        setLoggingOut(false);
        // Small delay before redirect to ensure cleanup
        setTimeout(() => {
          window.location.href = '/login';
        }, 200);
      }).catch((error) => {
        console.error('Logout error:', error);
        setLoggingOut(false);
        // Force redirect even on error
        setTimeout(() => {
          window.location.href = '/login';
        }, 200);
      });
    } else {
      // Already logged out, just redirect
      console.log('🔄 No user to log out, redirecting...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  }, [signOut, user]);

  // Show loading message while logging out
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        gap: 2
      }}
    >
      <CircularProgress size={48} thickness={4} />
      <Typography variant="h6" color="textSecondary">
        Logging out...
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
        Please wait while we sign you out...
      </Typography>
    </Box>
  );
}

export default withRouter(Logout);
