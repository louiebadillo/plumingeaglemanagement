module.exports = {
  plugins: ['react-hooks'],
  rules: {
    // Disable unused variable warnings for development
    'no-unused-vars': 'off',
    // Disable default case warnings
    'default-case': 'off',
    // Disable duplicate key warnings
    'no-dupe-keys': 'warn',
    // Disable React hooks exhaustive deps warnings (handled manually)
    'react-hooks/exhaustive-deps': 'off'
  }
};
