import React, { useEffect, useState } from 'react';
import { Route, Switch, withRouter, Redirect as RouterRedirect } from 'react-router-dom';
import classnames from 'classnames';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { IconButton } from '@mui/material';
import { connect } from 'react-redux';
// styles
import useStyles from './styles';

// components
import Header from '../Header';
import Sidebar from '../Sidebar';
import { Link } from '../Wrappers';
import { supabase } from '../../lib/supabase';

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
  const queryClient = useQueryClient();
  const { draftCount } = useDraftReportsCount();
  
  // ✅ FIX #4: Cached facilities query - 30 minute cache (facilities rarely change)
  // ✅ FIX #1: Replaced fetch() with Supabase client (parameterized, secure)
  const { data: facilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch facilities: ${error.message}`);
      }
      
      // Filter out any null or undefined facilities (safety check)
      return (data || []).filter(f => f && f.id && f.name);
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes (facilities rarely change)
    onError: (error) => {
      console.error('💥 Error loading facilities for sidebar:', error);
    },
  });

  // Listen for facility changes (when facilities are added/deleted/updated)
  useEffect(() => {
    const handleFacilitiesChanged = () => {
      console.log('🔄 Facilities changed event detected, invalidating cache...');
      queryClient.invalidateQueries(['facilities']);
    };

    window.addEventListener('facilitiesChanged', handleFacilitiesChanged);

    return () => {
      window.removeEventListener('facilitiesChanged', handleFacilitiesChanged);
    };
  }, [queryClient]);
  
  // Get sidebar structure based on user role from Supabase
  const userRole = userProfile?.role || 'employee'; // Default to employee if no role
  const sidebarStructure = getSidebarStructure(userRole, facilities, draftCount);

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
