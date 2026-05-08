import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { ConnectedRouter } from 'connected-react-router';
import { Box, CircularProgress, Typography } from '@mui/material';
import { SnackbarProvider } from './Snackbar';

// components
import Layout from './Layout';
import AutoLogout from './AutoLogout/AutoLogout';
import ProgressReportPrint from '../pages/reports/ProgressReportPrint';
import ProgressReportIncidentsPrint from '../pages/reports/ProgressReportIncidentsPrint';

// pages
import Error from '../pages/error';
import Login from '../pages/login';
import Logout from '../pages/logout';

// context
import { SupabaseProvider, useSupabase } from '../context/SupabaseContext';
import { getHistory } from '../index';

// Side-effect import: registers window.pemDebug.run() for on-site
// troubleshooting from the browser DevTools console. No-op otherwise.
import '../utils/employeeAccessDebug';

function AppContent() {
  // global
  const { user, loading } = useSupabase();
  const isAuth = !!user;

  if (loading) {
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
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <SnackbarProvider>
        <AutoLogout>
          {/* ConnectedRouter already renders react-router's Router; nesting a second Router
              caused duplicate context and broken refreshes on deep links (e.g. daily report). */}
          <ConnectedRouter history={getHistory()}>
            <Switch>
              <Route
                exact
                path='/'
                render={() => <Redirect to='/app/dashboard' />}
              />

              <Route
                exact
                path='/app'
                render={() => <Redirect to='/app/dashboard' />}
              />

              <PrivateRoute
                exact
                path='/app/reports/progress/print'
                component={ProgressReportPrint}
              />
              <PrivateRoute
                exact
                path='/app/reports/progress/print-incidents'
                component={ProgressReportIncidentsPrint}
              />
              <PrivateRoute path='/app' component={Layout} />
              <PublicRoute path='/login' component={Login} />
              <PublicRoute path='/logout' component={Logout} />
              <Redirect from='*' to='/app/dashboard' />
              <Route component={Error} />
            </Switch>
          </ConnectedRouter>
        </AutoLogout>
      </SnackbarProvider>
    </>
  );

  // #######################################################################

  function PrivateRoute({ component, ...rest }) {
    return (
      <Route
        {...rest}
        render={(props) =>
          isAuth ? (
            React.createElement(component, props)
          ) : (
            <Redirect to={'/login'} />
          )
        }
      />
    );
  }

  function PublicRoute({ component, ...rest }) {
    return (
      <Route
        {...rest}
        render={(props) => {
          // Allow logout route even when authenticated
          if (props.location.pathname === '/logout') {
            return React.createElement(component, props);
          }
          
          return isAuth ? (
            <Redirect
              to={{
                pathname: '/',
              }}
            />
          ) : (
            React.createElement(component, props)
          );
        }}
      />
    );
  }
}

export default function App() {
  return (
    <SupabaseProvider>
      <AppContent />
    </SupabaseProvider>
  );
}
