// Template Configuration File
// This file contains all customizable settings for the healthcare management system

export const TEMPLATE_CONFIG = {
  // Company Information
  COMPANY: {
    NAME: 'Pluming Eagle Lodge',
    TAGLINE: 'Empowering The Next Generation',
    LOGO: '/images/pellogo.png',
    COPYRIGHT: '© 2024 Pluming Eagle Lodge. All rights reserved.',
  },

  // Application Settings
  APP: {
    TITLE: 'Healthcare Management System',
    DESCRIPTION: 'A comprehensive healthcare management system for facilities and group homes',
    VERSION: '1.0.0',
  },

  // Authentication
  AUTH: {
    DEFAULT_EMAIL: 'admin@plumingeagle.com',
    DEFAULT_PASSWORD: 'admin123',
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },

  // Features (Enable/Disable functionality)
  FEATURES: {
    ANALYTICS: true,
    ANNOUNCEMENTS: true,
    STAFF_MANAGEMENT: true,
    FACILITY_MANAGEMENT: true,
    DAILY_REPORTS: true,
    EXPORT_FUNCTIONALITY: true,
    FORGOT_PASSWORD: true,
    USER_REGISTRATION: false, // Disabled for security
  },

  // User Roles
  ROLES: {
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    // Add more roles as needed
  },

  // Theme Configuration
  THEME: {
    PRIMARY_COLOR: '#1976d2',
    SECONDARY_COLOR: '#dc004e',
    SUCCESS_COLOR: '#2e7d32',
    WARNING_COLOR: '#ed6c02',
    ERROR_COLOR: '#d32f2f',
  },

  // Database Configuration
  DATABASE: {
    TYPE: 'sqlite', // sqlite, postgresql, mysql
    HOST: 'localhost',
    PORT: 5432,
    NAME: 'healthcare_management',
    // Add other database settings as needed
  },

  // API Configuration
  API: {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
  },

  // File Upload Settings
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    UPLOAD_PATH: '/uploads/',
  },

  // Pagination Settings
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 25, 50],
  },

  // Notification Settings
  NOTIFICATIONS: {
    AUTO_HIDE_DURATION: 6000, // 6 seconds
    MAX_NOTIFICATIONS: 5,
  },

  // Export Settings
  EXPORT: {
    DEFAULT_FORMAT: 'csv',
    SUPPORTED_FORMATS: ['csv', 'xlsx', 'pdf'],
  },
};

// Helper function to get configuration value
export const getConfig = (path) => {
  const keys = path.split('.');
  let value = TEMPLATE_CONFIG;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Configuration key "${path}" not found`);
      return null;
    }
  }
  
  return value;
};

// Helper function to check if feature is enabled
export const isFeatureEnabled = (feature) => {
  return TEMPLATE_CONFIG.FEATURES[feature] === true;
};

export default TEMPLATE_CONFIG;
