const webpack = require('webpack');
const path = require('path');
module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify'),
    url: require.resolve('url'),
    vm: require.resolve('vm-browserify'),
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);
  const modules = config.resolve.modules;
  config.resolve.modules = [...modules, path.resolve(__dirname, 'src')];
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false,
    },
  });
  
  // Suppress ResizeObserver runtime errors in webpack-dev-server overlay
  if (config.devServer) {
    config.devServer.client = config.devServer.client || {};
    config.devServer.client.overlay = {
      errors: true, // Show critical errors
      warnings: false, // Suppress warnings
      runtimeErrors: (error) => {
        // Filter out ResizeObserver errors
        const errorMessage = error?.message?.toString() || error?.toString() || '';
        if (errorMessage.includes('ResizeObserver loop') || 
            errorMessage.includes('ResizeObserver loop completed with undelivered notifications')) {
          return false; // Don't show in overlay
        }
        return true; // Show other runtime errors
      },
    };
  }
  
  return config;
};
