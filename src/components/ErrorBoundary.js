import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Suppress ResizeObserver errors and React 19 deprecation warnings - don't show error boundary for these
    const errorMessage = error?.message?.toString() || error?.toString() || '';
    const errorStack = error?.stack?.toString() || '';
    const fullErrorText = errorMessage + ' ' + errorStack;
    
    if (fullErrorText.includes('ResizeObserver loop') || 
        fullErrorText.includes('ResizeObserver loop completed with undelivered notifications') ||
        fullErrorText.includes('Accessing element.ref was removed in React 19') ||
        fullErrorText.includes('ref is now a regular prop')) {
      // Don't update state for ResizeObserver errors or React 19 deprecation warnings - just return null to ignore
      return null;
    }
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Suppress ResizeObserver errors and React 19 deprecation warnings - don't log these
    const errorMessage = error?.message?.toString() || error?.toString() || '';
    const errorStack = error?.stack?.toString() || '';
    const componentStack = errorInfo?.componentStack?.toString() || '';
    const fullErrorText = errorMessage + ' ' + errorStack + ' ' + componentStack;
    
    if (fullErrorText.includes('ResizeObserver loop') || 
        fullErrorText.includes('ResizeObserver loop completed with undelivered notifications') ||
        fullErrorText.includes('Accessing element.ref was removed in React 19') ||
        fullErrorText.includes('ref is now a regular prop')) {
      // Don't log ResizeObserver errors or React 19 deprecation warnings
      return;
    }
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1 style={{ color: '#d32f2f' }}>Something went wrong</h1>
          <p>There was an error loading the application. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error Details (Development Only)</summary>
              <pre style={{ 
                backgroundColor: '#f0f0f0', 
                padding: '10px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxWidth: '600px'
              }}>
                {this.state.error && this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
