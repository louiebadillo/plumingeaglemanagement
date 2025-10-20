import React, { useState, useEffect } from 'react';
import Widget from '../Widget';
import { Link } from 'react-router-dom';
import { Box, Grid, Breadcrumbs, Tabs, Tab } from '@mui/material';
import { Typography, Button } from '../Wrappers';
import {
  NavigateNext as NavigateNextIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { withStyles } from '@mui/styles';
import useStyles from '../Layout/styles';
import structure from '../Sidebar/SidebarStructure';
import { parseClientSlug } from '../../utils/urlUtils';

// Supabase configuration
// Get Supabase URL from configuration
// Import Supabase configuration
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';

// Tab styling
const CustomTab = withStyles((theme) => ({
  root: {
    minWidth: 72,
    textTransform: 'none',
    fontWeight: 400,
  },
}))((props) => <Tab {...props} />);

//Sidebar structure
const BreadCrumbs = () => {
  const location = useLocation();
  const classes = useStyles();
  const [value, setValue] = React.useState(2);
  const [facilities, setFacilities] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(false);

  // Load facilities from Supabase
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        setLoading(true);
        const { supabaseUrl } = getSupabaseConfig();
        const response = await fetch(`${supabaseUrl}/rest/v1/facilities?select=*`, {
          method: 'GET',
          headers: {
            ...getSupabaseHeaders(),
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const facilitiesData = await response.json();
        setFacilities(facilitiesData || []);
      } catch (error) {
        console.error('💥 Error loading facilities for breadcrumbs:', error);
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    };

    loadFacilities();
  }, []);

  // Load client data when needed
  const loadClient = async (clientId) => {
    if (clients[clientId]) {
      return clients[clientId];
    }

    try {
      const { supabaseUrl } = getSupabaseConfig();
      const response = await fetch(`${supabaseUrl}/rest/v1/clients?select=*&id=eq.${clientId}`, {
        method: 'GET',
        headers: {
          ...getSupabaseHeaders(),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const clientData = await response.json();
      if (clientData && clientData.length > 0) {
        const client = clientData[0];
        setClients(prev => ({
          ...prev,
          [clientId]: client
        }));
        return client;
      }
    } catch (error) {
      console.error('💥 Error loading client for breadcrumbs:', error);
    }
    return null;
  };

  // Load client data by slug
  const loadClientBySlug = async (clientSlug) => {
    if (clients[clientSlug]) {
      return clients[clientSlug];
    }

    try {
      // Parse the client slug to get first and last name
      const { firstName, lastName } = parseClientSlug(clientSlug);
      
      const { supabaseUrl } = getSupabaseConfig();
      const response = await fetch(`${supabaseUrl}/rest/v1/clients?first_name=eq.${firstName}&last_name=eq.${lastName}&select=*`, {
        method: 'GET',
        headers: {
          ...getSupabaseHeaders(),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const clientData = await response.json();
      if (clientData && clientData.length > 0) {
        const client = clientData[0];
        setClients(prev => ({
          ...prev,
          [clientSlug]: client
        }));
        return client;
      }
    } catch (error) {
      console.error('💥 Error loading client by slug for breadcrumbs:', error);
    }
    return null;
  };

  const renderBreadCrumbs = () => {
    let url = location.pathname;
    let urlParts = url.split('/').slice(1);
    
    // Build breadcrumb items with proper handling
    let breadcrumbItems = [];
    let i = 0;
    
    while (i < urlParts.length) {
      const segment = urlParts[i];
      
      if (segment === 'facility' && i + 1 < urlParts.length) {
        // Handle facility route
        const facilityId = urlParts[i + 1];
        if (facilityId === 'management') {
          // Handle facility management route
          breadcrumbItems.push({
            label: 'Facility Management',
            url: '/app/facility/management'
          });
          i += 2; // Skip both 'facility' and 'management'
        } else {
          // Handle individual facility route - use Supabase data
          const facility = facilities.find(f => f.id === facilityId);
          const facilityName = facility ? facility.name : `Facility ${facilityId}`;
          breadcrumbItems.push({
            label: facilityName,
            url: '/' + urlParts.slice(0, i + 2).join('/')
          });
          i += 2; // Skip both 'facility' and facility ID
        }
      } else if (segment === 'client' && i + 1 < urlParts.length) {
        // Handle client route
        const clientSlug = urlParts[i + 1];
        let clientName = `Client ${clientSlug}`;
        let clientFacility = null;
        let facilityId = null;
        
        if (clientSlug === 'new') {
          clientName = 'New Client';
          // For new client, try to get facility from URL params
          const urlParams = new URLSearchParams(window.location.search);
          facilityId = urlParams.get('facility');
          if (facilityId) {
            const facility = facilities.find(f => f.id === facilityId);
            clientFacility = facility ? facility.name : `Facility ${facilityId}`;
          }
        } else {
          // For existing client, use cached client data or load it
          const client = clients[clientSlug];
          if (client) {
            clientName = `${client.first_name} ${client.last_name}`;
            // Find the facility for this client
            const facility = facilities.find(f => f.id === client.facility_id);
            if (facility) {
              clientFacility = facility.name;
              facilityId = facility.id;
            }
          } else {
            // Load client data asynchronously using the slug
            loadClientBySlug(clientSlug).then(client => {
              if (client) {
                // Update the clients state to trigger re-render
                setClients(prev => ({
                  ...prev,
                  [clientSlug]: client
                }));
              }
            });
            // Parse the slug to show a better name while loading
            try {
              const { firstName, lastName } = parseClientSlug(clientSlug);
              clientName = `${firstName} ${lastName}`;
            } catch (error) {
              clientName = `Client ${clientSlug}`;
            }
          }
        }
        
        // Add facility breadcrumb if we have facility info
        if (clientFacility && facilityId) {
          breadcrumbItems.push({
            label: clientFacility,
            url: `/app/facility/${facilityId}`
          });
        }
        
        // Add client breadcrumb
        breadcrumbItems.push({
          label: clientName,
          url: '/' + urlParts.slice(0, i + 2).join('/')
        });
        i += 2; // Skip both 'client' and client slug
      } else {
        // Handle regular segments
        const label = segment
          .split('-')
          .map((word) => word[0].toUpperCase() + word.slice(1))
          .join(' ');
        breadcrumbItems.push({
          label: label,
          url: '/' + urlParts.slice(0, i + 1).join('/')
        });
        i++;
      }
    }
    
    const length = breadcrumbItems.length;
    return breadcrumbItems.map((item, index) => {
      let middlewareUrl = item.url;

      return (
        <Breadcrumbs
          key={index + '_b'}
          separator={<NavigateNextIcon fontSize='small' />}
          aria-label='breadcrumb'
        >
          <Typography
            variant='h6'
            color={length === index + 1 ? 'primary' : ''}
          >
            {length === index + 1 ? (
              item.label
            ) : (
              <Link
                to={middlewareUrl}
                style={{ color: 'unset', textDecoration: 'none' }}
              >
                {item.label}
              </Link>
            )}
          </Typography>
        </Breadcrumbs>
      );
    });
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const date = () => {
    let dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    let d = new Date()
    let year = d.getFullYear()
    let month = d.getMonth()
    let date = d.getDate()
    let day = d.getDay() + 1
    return `${date} ${monthNames[month]} ${year}, ${dayNames[day - 1]}`
  }

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }
  return (
    <Widget
      disableWidgetMenu
      inheritHeight
      className={classes.margin}
      bodyClass={classes.navPadding}
    >
      <Grid
        container
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        wrap={'nowrap'}
        style={{ overflowX: 'auto' }}
      >
        {
          // eslint-disable-next-line array-callback-return
          structure.map((c) => {
            if (
              window.location.hash.includes(c.link) &&
              c.link &&
              c.label === 'Dashboard'
            ) {
              return (
                <Box display='flex' alignItems='center' key={c.id}>
                  <Breadcrumbs aria-label='breadcrumb'>
                    <Typography variant='h4'>{c.label}</Typography>
                  </Breadcrumbs>
                  {window.location.hash.includes('/app/dashboard') && (
                    <Tabs
                      value={value}
                      onChange={handleChange}
                      aria-label='simple tabs example'
                      variant='scrollable'
                      scrollButtons='auto'
                      style={{ marginLeft: 38 }}
                    >
                      <CustomTab label='Today' {...a11yProps(0)} />
                      <CustomTab label='This week' {...a11yProps(1)} />
                      <CustomTab label='This month' {...a11yProps(2)} />
                      <CustomTab label='This year' {...a11yProps(3)} />
                    </Tabs>
                  )}
                </Box>
              );
            }
          })
        }
        {window.location.hash.includes('/app/dashboard') ? (
          <Box display='flex' alignItems='center'>
            <CalendarIcon className={classes.calendarIcon} />
            <Typography className={classes.date} style={{ marginRight: 38 }}>
              {/*29 Oct 2019, Tuesday*/}
              {date()}
            </Typography>
            <Button
              variant='contained'
              color='secondary'
              className={classes.button}
            >
              Latest Reports
            </Button>
          </Box>
        ) : (
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize='small' />}
            aria-label='breadcrumb'
          >
            {renderBreadCrumbs()}
          </Breadcrumbs>
        )}
      </Grid>
    </Widget>
  );
};
export default BreadCrumbs;
