import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { createStore, applyMiddleware, compose } from 'redux';
import ReduxThunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { routerMiddleware } from 'connected-react-router';
import { ThemeProvider as ThemeProviderV5, createTheme } from '@mui/material/styles';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';
import * as serviceWorker from './serviceWorker';
import { LayoutProvider } from './context/LayoutContext';
import { UserProvider } from './context/UserContext';
import { ManagementProvider } from './context/ManagementContext';
import createRootReducer from './reducers';
import {
  ThemeProvider as ThemeChangeProvider,
  ThemeStateContext,
} from './context/ThemeContext';
import CssBaseline from '@mui/material/CssBaseline';
import config from '../src/config';

import { createBrowserHistory, createMemoryHistory } from 'history';

// Create a minimal default theme as absolute fallback
const defaultMuiTheme = createTheme({
  palette: {
    primary: {
      main: '#536DFE',
      light: '#8A9BFF',
      dark: '#3A4FDB',
    },
    secondary: {
      main: '#FF5C93',
      light: '#FF8FB3',
      dark: '#E91E63',
    },
  },
});

const history =
  typeof window !== 'undefined'
    ? createBrowserHistory()
    : createMemoryHistory({
        initialEntries: [],
      });

export function getHistory() {
  return history;
}

axios.defaults.baseURL = config.baseURLApi;
axios.defaults.headers.common['Content-Type'] = 'application/json';
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
}

export const store = createStore(
  createRootReducer(history),
  compose(applyMiddleware(routerMiddleware(history), ReduxThunk)),
);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <Provider store={store}>
      <LayoutProvider>
        <UserProvider>
          <StyledEngineProvider injectFirst>
            <ThemeChangeProvider>
              <ThemeStateContext.Consumer>
                {(theme) => {
                  // Ensure theme is always valid
                  const validTheme = theme && theme.palette && theme.palette.primary ? theme : defaultMuiTheme;
                  return (
                    <ThemeProviderV5 theme={validTheme}>
                      <ManagementProvider>
                        <CssBaseline />
                        <App />
                      </ManagementProvider>
                    </ThemeProviderV5>
                  );
                }}
              </ThemeStateContext.Consumer>
            </ThemeChangeProvider>
          </StyledEngineProvider>
        </UserProvider>
      </LayoutProvider>
    </Provider>
  </ErrorBoundary>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
