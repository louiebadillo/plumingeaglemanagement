# 🚀 Template Setup Guide

This guide will help you customize the healthcare management system template for your organization.

## 📋 Configuration Files Explained

### What are Configuration Files?
Configuration files contain settings that control how your application behaves. Instead of hardcoding values in your code, you put them in central files for easy management.

**Benefits:**
- ✅ Easy customization without code changes
- ✅ Different settings for development vs production
- ✅ All settings in one place
- ✅ Better security and maintainability

## 🛠 Setup Steps

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
# Company Information
REACT_APP_COMPANY_NAME=Your Company Name
REACT_APP_COMPANY_TAGLINE=Your Company Tagline

# API Settings
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_BACKEND=false

# Default Login Credentials
REACT_APP_DEFAULT_EMAIL=admin@yourcompany.com
REACT_APP_DEFAULT_PASSWORD=admin123

# Feature Flags (true/false)
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ANNOUNCEMENTS=true
REACT_APP_ENABLE_STAFF_MANAGEMENT=true
REACT_APP_ENABLE_FACILITY_MANAGEMENT=true
REACT_APP_ENABLE_DAILY_REPORTS=true
REACT_APP_ENABLE_EXPORT=true

# Theme Colors
REACT_APP_PRIMARY_COLOR=#1976d2
REACT_APP_SECONDARY_COLOR=#dc004e
```

### 2. Branding Customization

#### Company Name and Logo
1. **Replace Logo**: Put your logo file in `src/images/` and name it `company-logo.png`
2. **Update Company Name**: Edit `src/config/template.js`
3. **Update Tagline**: Change the tagline in the same file

#### Color Scheme
Update colors in `src/themes/default.js`:
```javascript
export default {
  palette: {
    primary: {
      main: '#your-primary-color',
    },
    secondary: {
      main: '#your-secondary-color',
    },
  },
};
```

### 3. Feature Configuration

Enable/disable features in `src/config/template.js`:
```javascript
FEATURES: {
  ANALYTICS: true,           // Patient analytics and charts
  ANNOUNCEMENTS: true,       // Internal announcements system
  STAFF_MANAGEMENT: true,    // Staff user management
  FACILITY_MANAGEMENT: true, // Multi-facility support
  DAILY_REPORTS: true,       // Daily reporting system
  EXPORT_FUNCTIONALITY: true, // CSV/Excel export
  FORGOT_PASSWORD: true,     // Password reset functionality
  USER_REGISTRATION: false,  // New user registration (security)
},
```

### 4. Database Setup

#### SQLite Integration
The system is ready for SQLite. You'll need to:

1. **Install SQLite dependencies**:
   ```bash
   npm install sqlite3 express cors body-parser
   ```

2. **Create database schema** (see README.md for SQL commands)

3. **Replace mock data** with real API calls

#### Database Tables Needed:
- `clients` - Client/patient information
- `facilities` - Facility/location data
- `staff` - Staff user accounts
- `daily_reports` - Daily reporting data
- `announcements` - Internal announcements

### 5. User Roles

Customize user roles in `src/config/template.js`:
```javascript
ROLES: {
  ADMIN: 'admin',        // Full access
  EMPLOYEE: 'employee',  // Limited access
  MANAGER: 'manager',    // Add more roles as needed
  NURSE: 'nurse',
},
```

## 🎯 Quick Customization Checklist

- [ ] Update company name and tagline
- [ ] Replace logo files
- [ ] Update color scheme
- [ ] Configure feature flags
- [ ] Set up database
- [ ] Update default login credentials
- [ ] Test all functionality
- [ ] Deploy to production

## 🔧 Advanced Configuration

### Custom Fields
Add custom fields to forms by editing:
- `src/pages/client/ClientProfile.js` - Client information
- `src/pages/staff/StaffManagement.js` - Staff information
- `src/pages/reports/CreateReport.js` - Daily reports

### Custom Reports
Create custom analytics by modifying:
- `src/pages/client/ClientProfile.js` - Client analytics
- `src/pages/dashboard/Dashboard.js` - Dashboard widgets

### API Integration
Replace mock data in:
- `src/context/mock.js` - Main mock data
- `src/context/clientMock.js` - Client data
- `src/context/mockStaff.js` - Staff data

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically

### Other Platforms
- **Netlify**: Connect repo and deploy
- **Heroku**: Use React buildpack
- **AWS**: Upload to S3 bucket

## 📞 Support

For customization help:
1. Check this setup guide
2. Review code comments
3. Create an issue in the repository
4. Contact the development team

---

**Happy Customizing! 🎉**
