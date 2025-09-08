import React from 'react';
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
import { getClientById } from '../../context/clientMock';
import useStyles from '../Layout/styles';
import structure from '../Sidebar/SidebarStructure';

// Facility information for breadcrumbs
const facilityData = {
  'facility-a': 'Facility A',
  'facility-b': 'Facility B', 
  'facility-c': 'Facility C'
};

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
          // Handle individual facility route
          const facilityName = facilityData[facilityId] || `Facility ${facilityId}`;
          breadcrumbItems.push({
            label: facilityName,
            url: '/' + urlParts.slice(0, i + 2).join('/')
          });
          i += 2; // Skip both 'facility' and 'facility-a'
        }
      } else if (segment === 'client' && i + 1 < urlParts.length) {
        // Handle client route
        const clientId = urlParts[i + 1];
        let clientName;
        let clientFacility = null;
        
        if (clientId === 'new') {
          clientName = 'New Client';
          // For new client, try to get facility from URL params
          const urlParams = new URLSearchParams(window.location.search);
          const facilityParam = urlParams.get('facility');
          if (facilityParam) {
            clientFacility = facilityData[facilityParam] || `Facility ${facilityParam}`;
          }
        } else {
          const client = getClientById(parseInt(clientId));
          if (client) {
            clientName = `${client.firstName} ${client.lastName}`;
            clientFacility = facilityData[client.facility] || `Facility ${client.facility}`;
          } else {
            clientName = `Client ${clientId}`;
          }
        }
        
        // Add facility breadcrumb if we have facility info
        if (clientFacility) {
          let facilityId;
          if (clientId === 'new') {
            facilityId = new URLSearchParams(window.location.search).get('facility');
          } else {
            const client = getClientById(parseInt(clientId));
            facilityId = client ? client.facility : null;
          }
          
          if (facilityId) {
            breadcrumbItems.push({
              label: clientFacility,
              url: `/app/facility/${facilityId}`
            });
          }
        }
        
        // Add client breadcrumb
        breadcrumbItems.push({
          label: clientName,
          url: '/' + urlParts.slice(0, i + 2).join('/')
        });
        i += 2; // Skip both 'client' and client ID
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
