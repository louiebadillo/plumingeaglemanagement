import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, LinearProgress } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useSupabase } from '../../context/SupabaseContext';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_TIME = 14 * 60 * 1000; // 14 minutes - show warning 1 minute before logout
const WARNING_DURATION = 60 * 1000; // 1 minute warning duration

function AutoLogout({ children }) {
  const { user, signOut } = useSupabase();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(WARNING_DURATION);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);

  // Reset timers on user activity
  const resetTimers = () => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Reset activity timestamp
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    setShowWarning(false);
    setTimeRemaining(WARNING_DURATION);

    // Only set timers if user is authenticated
    if (!user) return;

    // Set warning timer (14 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      warningShownRef.current = true;
      
      // Start countdown
      const startTime = Date.now();
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, WARNING_DURATION - elapsed);
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }
      }, 1000);
      
      // Set logout timer (1 minute after warning)
      logoutTimeoutRef.current = setTimeout(() => {
        handleLogout();
      }, WARNING_DURATION);
    }, WARNING_TIME);

    // Set full logout timer (15 minutes)
    timeoutRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        // If warning wasn't shown (shouldn't happen, but safety check)
        handleLogout();
      }
    }, INACTIVITY_TIMEOUT);
  };

  // Handle logout
  const handleLogout = async () => {
    console.log('🔄 Auto-logout triggered due to inactivity');
    await signOut();
  };

  // Handle user choosing to stay logged in
  const handleStayLoggedIn = () => {
    resetTimers();
  };

  // Track user activity
  useEffect(() => {
    if (!user) {
      // Clear all timers if user is not authenticated
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setShowWarning(false);
      return;
    }

    // Activity events to track
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Function to handle activity
    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // Only reset if it's been at least 1 second since last activity (throttle)
      if (timeSinceLastActivity > 1000) {
        resetTimers();
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, true);
    });

    // Initialize timers
    resetTimers();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [user, signOut]);

  // Format time remaining
  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };

  return (
    <>
      {children}
      
      {/* Warning Dialog */}
      <Dialog 
        open={showWarning} 
        onClose={handleStayLoggedIn}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
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
              Session Timeout Warning
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You have been inactive for 14 minutes. Your session will expire in:
          </Typography>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="h4" color="error" align="center" gutterBottom>
              {formatTime(timeRemaining)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(timeRemaining / WARNING_DURATION) * 100} 
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="body2" color="textSecondary">
            Click "Stay Logged In" to continue your session, or you will be automatically logged out.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleStayLoggedIn} 
            variant="contained" 
            color="primary"
            autoFocus
            size="large"
          >
            Stay Logged In
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AutoLogout;

