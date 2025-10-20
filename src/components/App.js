import React from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { ConnectedRouter } from 'connected-react-router';
import { SnackbarProvider } from './Snackbar';

// components
import Layout from './Layout';

// pages
import Error from '../pages/error';
import Login from '../pages/login';
import Logout from '../pages/logout';

// context
import { SupabaseProvider, useSupabase } from '../context/SupabaseContext';
import { getHistory } from '../index';

function AppContent() {
  // global
  const { user, loading } = useSupabase();
  const isAuth = !!user;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SnackbarProvider>
        <ConnectedRouter history={getHistory()}>
          <Router history={getHistory()}>
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

                     <PrivateRoute path='/app' component={Layout} />
                     <PublicRoute path='/login' component={Login} />
                     <PublicRoute path='/logout' component={Logout} />
                     <Redirect from='*' to='/app/dashboard' />
              <Route component={Error} />
            </Switch>
          </Router>
        </ConnectedRouter>
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
