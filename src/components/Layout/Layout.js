import React, { useEffect, useState } from 'react';
import { Route, Switch, withRouter, Redirect as RouterRedirect } from 'react-router-dom';
import classnames from 'classnames';


import { IconButton } from '@mui/material';
import { connect } from 'react-redux';
// styles
import useStyles from './styles';

// components
import Header from '../Header';
import Sidebar from '../Sidebar';
import { Link } from '../Wrappers';
import { getSupabaseConfig, getSupabaseHeaders } from '../../utils/supabaseConfig';

import EditUser from '../../pages/user/EditUser';
import ClientProfile from '../../pages/client/ClientProfile';
import ClientMasterlist from '../../pages/client/ClientMasterlist';
import ClientFiles from '../../pages/client/ClientFiles';

// pages
import Dashboard from '../../pages/dashboard';
import FacilityPage from '../../pages/facility/FacilityPage';
import FacilityManagement from '../../pages/facility/FacilityManagement';
import CreateReport from '../../pages/reports/CreateReport';
import DailyReportForm from '../../pages/reports/DailyReportForm';
import MyReports from '../../pages/reports/MyReports';
import AdminReports from '../../pages/reports/AdminReports';
import ProgressReport from '../../pages/reports/ProgressReport';
import StaffManagement from '../../pages/staff/StaffManagement';
// Template pages removed - not in use

import BreadCrumbs from '../../components/BreadCrumbs';

// context
import { useLayoutState } from '../../context/LayoutContext';
import { useSupabase } from '../../context/SupabaseContext';

//Sidebar structure
import { getSidebarStructure } from '../Sidebar/getSidebarStructure';
import { useDraftReportsCount } from '../../hooks/useDraftReportsCount';

const Redirect = (props) => {
  useEffect(() => window.location.replace(props.url));
  return <span>Redirecting...</span>;
};

function Layout(props) {
  const classes = useStyles();

  // global
  let layoutState = useLayoutState();
  const { userProfile } = useSupabase();
  const [facilities, setFacilities] = useState([]);
  const { draftCount } = useDraftReportsCount();
  
  // Load facilities from Supabase
  // Reload when navigating to/from facility management (to refresh after deletions)
  // Also listen for custom events when facilities are modified
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        console.log('🔄 Loading facilities for sidebar...');
        
        const { supabaseUrl } = getSupabaseConfig();
        // Only fetch active facilities (exclude any that might have a status field indicating deletion)
        // Since facilities are hard-deleted, this should only return existing facilities
        const response = await fetch(`${supabaseUrl}/rest/v1/facilities?select=*&order=name.asc`, {
          method: 'GET',
          headers: {
            ...getSupabaseHeaders(),
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const facilitiesData = await response.json();
        // Filter out any null or undefined facilities (safety check)
        const validFacilities = (facilitiesData || []).filter(f => f && f.id && f.name);
        console.log('✅ Loaded facilities for sidebar:', validFacilities);
        setFacilities(validFacilities);
      } catch (error) {
        console.error('💥 Error loading facilities for sidebar:', error);
        setFacilities([]);
      }
    };

    loadFacilities();

    // Listen for facility changes (when facilities are added/deleted/updated)
    const handleFacilitiesChanged = () => {
      console.log('🔄 Facilities changed event detected, reloading...');
      loadFacilities();
    };

    window.addEventListener('facilitiesChanged', handleFacilitiesChanged);

    return () => {
      window.removeEventListener('facilitiesChanged', handleFacilitiesChanged);
    };
  }, [props.location?.pathname]); // Reload when route changes (especially after facility management actions)
  
  // Get sidebar structure based on user role from Supabase
  const userRole = userProfile?.role || 'employee'; // Default to employee if no role
  const sidebarStructure = getSidebarStructure(userRole, facilities, draftCount);
  
  console.log('🔍 Layout - User role:', userRole, 'Profile:', userProfile, 'Facilities:', facilities, 'Draft count:', draftCount);

  return (
    <div className={classes.root}>
      <Header history={props.history} />
      <Sidebar structure={sidebarStructure}/>
      <div
        className={classnames(classes.content, {
          [classes.contentShift]: layoutState.isSidebarOpened,
        })}
      >
        <div className={classes.fakeToolbar} />
        <BreadCrumbs />
        <Switch>
          <Route path='/app/dashboard' component={Dashboard} />

          {/* Facility Management Routes */}
          <Route path="/app/facility/management" component={FacilityManagement} />
          <Route path="/app/facility/:facilityId" component={FacilityPage} />

          {/* Daily Reports Routes */}
          <Route exact path="/app/reports" render={() => {
            // Redirect based on user role
            if (userRole === 'admin') {
              return <RouterRedirect to="/app/reports/admin-reports" />;
            } else {
              return <RouterRedirect to="/app/reports/my-reports" />;
            }
          }} />
          <Route path="/app/reports/create" component={CreateReport} />
          <Route path="/app/reports/daily-report" component={DailyReportForm} />
          <Route path="/app/reports/my-reports" component={MyReports} />
          <Route path="/app/reports/admin-reports" component={AdminReports} />
          <Route path="/app/reports/progress" render={() => {
            // Only allow admins to access progress reports
            if (userRole === 'admin') {
              return <ProgressReport />;
            } else {
              return <RouterRedirect to="/app/dashboard" />;
            }
          }} />

          {/* Staff Management Routes */}
          <Route path="/app/staff/management" component={StaffManagement} />

          {/* Client Management Routes */}
          <Route path="/app/client-masterlist" component={ClientMasterlist} />
          <Route path="/app/client/:clientId/files" component={ClientFiles} />


          {/* Template pages removed - not in use */}

          <Route exact path="/app/facility" render={() => {
            // Redirect to the first available facility, or facility management if none exist
            if (facilities && facilities.length > 0) {
              return <RouterRedirect to={`/app/facility/${facilities[0].id}`} />;
            } else {
              return <RouterRedirect to="/app/facility/management" />;
            }
          }} />

          <Route exact path="/app/client/new" component={ClientProfile} />
          <Route path="/app/client/:clientSlug" component={ClientProfile} />

        </Switch>
      </div>
    </div>
  );
}

export default withRouter(connect()(Layout));
