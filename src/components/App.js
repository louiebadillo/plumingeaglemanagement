import React from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { ConnectedRouter } from 'connected-react-router';
import { SnackbarProvider } from './Snackbar';

// components
import Layout from './Layout';

// pages
import Error from '../pages/error';
import Login from '../pages/login';
import Verify from '../pages/verify';
import Reset from '../pages/reset';
import Logout from '../pages/logout';

// context
import { useUserState } from '../context/UserContext';
import { getHistory } from '../index';

export default function App() {
  // global
  let { isAuthenticated } = useUserState();
  const isAuth = isAuthenticated();

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
              <PublicRoute path='/verify-email' exact component={Verify} />
              <PublicRoute path='/password-reset' exact component={Reset} />
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
        render={(props) =>
          isAuth ? (
            <Redirect
              to={{
                pathname: '/',
              }}
            />
          ) : (
            React.createElement(component, props)
          )
        }
      />
    );
  }
}
