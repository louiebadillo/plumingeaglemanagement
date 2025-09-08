import React from "react";
import {
  Grid,
  Box
} from "@mui/material";
import { useTheme } from '@mui/styles';

// styles
import useStyles from "./styles";

// components
import Widget from "../../components/Widget";
import { Chip, Typography, Avatar } from "../../components/Wrappers";
import UserSwitcher from "../../components/UserSwitcher/UserSwitcher";
import ConfigTest from "../../components/ConfigTest/ConfigTest";


function Dashboard() {
  let classes = useStyles();
  let theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* User Switcher - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <Grid item xs={12}>
          <UserSwitcher />
        </Grid>
      )}

      {/* Configuration Test - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <Grid item xs={12}>
          <ConfigTest />
        </Grid>
      )}
      
      {/* Welcome Profile Section */}
      <Grid item lg={6} sm={12} xs={12}>
        <Widget>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={3} md={2}>
              <Box display="flex" justifyContent="center">
                <Avatar
                  sx={{ 
                    width: 80, 
                    height: 80,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '2rem'
                  }}
                >
                  JS
                </Avatar>
              </Box>
            </Grid>
            <Grid item xs={12} sm={9} md={10}>
              <Box>
                <Typography variant="h3" gutterBottom>
                  Welcome back, John Smith!
                </Typography>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Healthcare Administrator at Pluming Eagle Lodge
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                  <Chip 
                    label="Admin" 
                    color="primary" 
                    size="small"
                  />
                  <Chip 
                    label="Active" 
                    color="success" 
                    size="small"
                  />
                  <Chip 
                    label="Last Login: Today" 
                    color="info" 
                    size="small"
                  />
              </Box>
              </Box>
            </Grid>
          </Grid>
        </Widget>
      </Grid>
      
      <Grid item lg={6} sm={12} xs={12}>
        <Widget
            title="Announcements"
            className={classes.card}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Latest Announcements
            </Typography>
            <Box mb={2}>
              <Box 
                display="flex" 
                alignItems="center" 
                p={2} 
                sx={{ 
                  backgroundColor: 'rgba(25, 118, 210, 0.08)', 
                  borderRadius: 1, 
                  mb: 1 
                }}
              >
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    backgroundColor: 'primary.main', 
                    borderRadius: '50%', 
                    mr: 2 
                  }} 
                />
                <Box flex={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Staff Meeting Reminder
                      </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Weekly staff meeting tomorrow at 2:00 PM in the conference room.
                      </Typography>
                  <Typography variant="caption" color="textSecondary">
                    2 hours ago
              </Typography>
                </Box>
              </Box>
              
              <Box 
                display="flex" 
                alignItems="center" 
                p={2} 
                sx={{ 
                  backgroundColor: 'rgba(76, 175, 80, 0.08)', 
                  borderRadius: 1, 
                  mb: 1 
                }}
              >
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    backgroundColor: 'success.main', 
                    borderRadius: '50%', 
                    mr: 2 
                  }} 
                />
                <Box flex={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    New Client Admission
            </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Please review the care plan for the new client arriving next week.
            </Typography>
                  <Typography variant="caption" color="textSecondary">
                    1 day ago
            </Typography>
                </Box>
              </Box>
              
              <Box 
                display="flex" 
                alignItems="center" 
                p={2} 
                sx={{ 
                  backgroundColor: 'rgba(255, 152, 0, 0.08)', 
                  borderRadius: 1 
                }}
              >
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    backgroundColor: 'warning.main', 
                    borderRadius: '50%', 
                    mr: 2 
                  }} 
                />
                <Box flex={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Policy Update
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Updated medication administration procedures are now in effect.
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    3 days ago
                            </Typography>
                          </Box>
              </Box>
            </Box>
          </Box>
        </Widget>
      </Grid>
    </Grid>
  );
}


export default Dashboard;
