import React from 'react';
import ReactDOM from 'react-dom/client';
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


export const store = createStore(
  createRootReducer(history),
  compose(applyMiddleware(routerMiddleware(history), ReduxThunk)),
);

// Global error handler to suppress ResizeObserver errors before React catches them
const originalError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  const errorMessage = message?.toString() || error?.message?.toString() || '';
  if (errorMessage.includes('ResizeObserver loop') || 
      errorMessage.includes('ResizeObserver loop completed with undelivered notifications')) {
    // Suppress ResizeObserver errors completely
    return true;
  }
  // Call original error handler for other errors
  if (originalError) {
    return originalError(message, source, lineno, colno, error);
  }
  return false;
};

// Also suppress unhandled promise rejections for ResizeObserver
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message?.toString() || event.reason?.toString() || '';
  if (errorMessage.includes('ResizeObserver loop') || 
      errorMessage.includes('ResizeObserver loop completed with undelivered notifications')) {
    event.preventDefault();
  }
});

// Global error event listener in capture phase
window.addEventListener('error', (event) => {
  const errorMessage = event.message?.toString() || event.error?.message?.toString() || '';
  if (errorMessage.includes('ResizeObserver loop') || 
      errorMessage.includes('ResizeObserver loop completed with undelivered notifications')) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
}, true);

// Suppress React's error overlay for ResizeObserver errors
if (window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__) {
  const originalOnError = window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__.onError;
  window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__.onError = (error) => {
    const errorMessage = error?.message?.toString() || error?.toString() || '';
    if (errorMessage.includes('ResizeObserver loop') || 
        errorMessage.includes('ResizeObserver loop completed with undelivered notifications')) {
      return; // Suppress ResizeObserver errors
    }
    if (originalOnError) {
      return originalOnError(error);
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <Provider store={store}>
      <LayoutProvider>
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
      </LayoutProvider>
    </Provider>
  </ErrorBoundary>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
