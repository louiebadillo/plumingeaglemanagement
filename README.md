# 🏥 Healthcare Management System Template

A comprehensive, production-ready healthcare management system built with React and Material-UI. Perfect for healthcare facilities, group homes, and client management organizations.

## 🎯 Features

### Core Functionality
- **Client Management**: Complete CRUD operations for client profiles
- **Facility Management**: Multi-facility support with admin controls
- **Daily Reporting**: Comprehensive reporting system with analytics
- **Staff Management**: User management with role-based access control
- **Announcements**: Internal communication system
- **Analytics**: Patient progress tracking and reporting

### Technical Features
- **Role-Based Access**: Admin and Employee user roles
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Professional UI**: Material-UI components with custom theming
- **Authentication**: Secure login/logout system
- **Database Ready**: Prepared for SQLite integration
- **Export Functionality**: CSV export for reports and data

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Yarn or npm
- Git

### Installation

1. **Clone the template**
   ```bash
   git clone <your-template-repo>
   cd healthcare-management-template
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Start development server**
   ```bash
   yarn start
   # or
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Default Login Credentials
- **Email**: `admin@plumingeagle.com`
- **Password**: `admin123`

## 🛠 Customization Guide

### 1. Branding Setup

#### Company Information
Update the following files with your company details:

**Login Screen** (`src/pages/login/Login.js`):
```javascript
// Update company name and tagline
<Typography className={classes.logotypeText}>
  Your Company Name
</Typography>
<Typography className={classes.logotypeSubText}>
  Your Company Tagline
</Typography>
```

**Header** (`src/components/Header/Header.js`):
```javascript
// Update header title
<Typography variant="h6" noWrap>
  Your Company Name
</Typography>
```

#### Logo Replacement
1. Replace `src/images/pellogo.png` with your company logo
2. Update logo references in:
   - `src/components/Sidebar/Sidebar.js`
   - `src/pages/login/Login.js`

#### Color Scheme
Update theme colors in `src/themes/default.js`:
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

### 2. Database Integration

#### SQLite Setup
The system is prepared for SQLite integration. Key areas to implement:

**Database Schema** (create these tables):
```sql
-- Clients table
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  date_of_birth DATE,
  phone VARCHAR(50),
  facility_id INTEGER,
  dietary_restrictions TEXT,
  activity_preferences TEXT,
  medical_notes TEXT,
  emergency_contact VARCHAR(255),
  secondary_emergency_contact VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Facilities table
CREATE TABLE facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Staff table
CREATE TABLE staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'employee',
  status VARCHAR(20) DEFAULT 'active',
  username VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily Reports table
CREATE TABLE daily_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  facility_id INTEGER NOT NULL,
  report_date DATE NOT NULL,
  shift VARCHAR(50),
  mood_score INTEGER,
  sleep_quality INTEGER,
  appetite_score INTEGER,
  activity_level INTEGER,
  social_interaction INTEGER,
  medication_compliance INTEGER,
  behavior_score INTEGER,
  overall_wellbeing INTEGER,
  notes TEXT,
  incidents TEXT,
  medications TEXT,
  goals_progress TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  priority VARCHAR(50) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT 1,
  created_by VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**API Integration Points**:
- Replace mock data in `src/context/mock.js`
- Update API calls in components
- Implement authentication endpoints

### 3. Form Customization & Metrics Configuration

#### Overview
The system includes a flexible form builder that allows you to create custom forms for different companies and use cases. You can easily modify existing forms or create completely new ones without changing any code.

#### Available Form Templates

**1. Healthcare Metrics (Default)**
- 1-10 scale ratings for mood, behavior, sleep quality, etc.
- Perfect for healthcare facilities and group homes

**2. Medication Tracking**
- Yes/No questions for medication administration
- Time tracking for medication schedules
- Side effects monitoring

**3. Behavioral Assessment**
- Incident tracking and classification
- Behavior rating systems
- Follow-up action planning

#### Creating Custom Forms

**Step 1: Define Your Form Template**
Create a new form template in `src/config/formTemplates.js`:

```javascript
export const MY_COMPANY_FORM = {
  id: 'my_company_form',
  name: 'My Company Daily Report',
  description: 'Custom form for my company needs',
  version: '1.0',
  fields: {
    // Define your fields here
    activityType: {
      type: 'select',
      label: 'Activity Type',
      description: 'What type of activity was conducted?',
      required: true,
      options: [
        { value: 'therapy', label: 'Therapy Session' },
        { value: 'recreation', label: 'Recreation' },
        { value: 'education', label: 'Educational Activity' }
      ],
      category: 'activity_info'
    },
    clientEngagement: {
      type: 'scale',
      label: 'Client Engagement',
      description: 'How engaged was the client?',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 5,
      category: 'assessment'
    },
    notes: {
      type: 'textarea',
      label: 'Activity Notes',
      description: 'Additional observations',
      required: false,
      placeholder: 'Describe the activity and client response...',
      category: 'notes'
    }
  },
  categories: {
    activity_info: {
      label: 'Activity Information',
      description: 'Details about the activity',
      order: 1
    },
    assessment: {
      label: 'Assessment',
      description: 'Client assessment metrics',
      order: 2
    },
    notes: {
      label: 'Notes',
      description: 'Additional observations',
      order: 3
    }
  }
};
```

**Step 2: Add to Form Templates**
Add your template to the `FORM_TEMPLATES` object:

```javascript
export const FORM_TEMPLATES = {
  healthcare_metrics: DEFAULT_FORM_TEMPLATE,
  medication_tracking: MEDICATION_FORM_TEMPLATE,
  behavioral_assessment: BEHAVIORAL_FORM_TEMPLATE,
  my_company_form: MY_COMPANY_FORM  // Add your template here
};
```

#### Available Field Types

| Type | Description | Example Use |
|------|-------------|-------------|
| `scale` | 1-10 rating scale | Mood, behavior ratings |
| `text` | Single-line text input | Names, short descriptions |
| `textarea` | Multi-line text input | Notes, detailed observations |
| `yes_no` | Yes/No radio buttons | Binary questions |
| `select` | Dropdown selection | Choose from predefined options |
| `multi_select` | Multiple choice checkboxes | Select multiple options |
| `checkbox` | Single checkbox | Terms acceptance, flags |
| `date` | Date picker | Birth dates, event dates |
| `time` | Time picker | Medication times, appointment times |
| `number` | Numeric input | Quantities, counts |
| `email` | Email input | Contact information |
| `phone` | Phone number input | Contact information |
| `file` | File upload | Documents, images |

#### Field Configuration Options

```javascript
fieldName: {
  type: 'scale',                    // Field type (required)
  label: 'Field Label',             // Display label (required)
  description: 'Field description', // Help text
  required: true,                   // Required field
  defaultValue: 5,                  // Default value
  placeholder: 'Enter value...',    // Placeholder text
  min: 1,                          // Minimum value (for scale/number)
  max: 10,                         // Maximum value (for scale/number)
  options: [                       // Options (for select/multi_select)
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ],
  category: 'category_name'         // Category grouping
}
```

#### Metrics & Analytics Configuration

**For Charts and Analytics:**
Only fields with numeric values (scale, number) will automatically appear in analytics charts. To include other field types in analytics:

1. **Text Fields**: Will show in reports but not in charts
2. **Yes/No Fields**: Can be converted to percentages in analytics
3. **Select Fields**: Can be grouped and counted in analytics
4. **Date/Time Fields**: Can be used for timeline analysis

**Example: Adding Custom Metrics to Analytics**
```javascript
// In your form template, ensure numeric fields for charts:
clientEngagement: {
  type: 'scale',
  label: 'Client Engagement',
  min: 1,
  max: 10,
  // This will automatically appear in analytics charts
},
activityDuration: {
  type: 'number',
  label: 'Activity Duration (minutes)',
  min: 1,
  max: 480,
  // This will also appear in analytics
}
```

#### Using the Form Template Selector

**In Your Components:**
```javascript
import FormTemplateSelector from '../components/FormTemplateSelector/FormTemplateSelector';
import FormRenderer from '../components/FormRenderer/FormRenderer';

function MyReportPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('healthcare_metrics');
  const [formData, setFormData] = useState({});
  
  const template = dataService.getFormTemplate(selectedTemplate);
  
  return (
    <div>
      <FormTemplateSelector 
        onTemplateSelect={setSelectedTemplate}
        currentTemplate={selectedTemplate}
      />
      <FormRenderer
        template={template}
        data={formData}
        onChange={(field, value) => {
          setFormData(prev => ({ ...prev, [field]: value }));
        }}
      />
    </div>
  );
}
```

#### Database Integration for Custom Forms

**Update Database Schema:**
When adding new form fields, update your database schema:

```sql
-- Add columns for new form fields
ALTER TABLE daily_reports ADD COLUMN activity_type VARCHAR(100);
ALTER TABLE daily_reports ADD COLUMN client_engagement INTEGER;
ALTER TABLE daily_reports ADD COLUMN activity_notes TEXT;

-- For flexible form data, consider using JSON columns:
ALTER TABLE daily_reports ADD COLUMN form_data JSON;
```

**Update API Endpoints:**
```javascript
// In your backend API
app.post('/api/reports', (req, res) => {
  const { clientId, formData, templateId } = req.body;
  
  // Store form data based on template
  const report = {
    client_id: clientId,
    template_id: templateId,
    form_data: JSON.stringify(formData),
    created_at: new Date()
  };
  
  // Save to database
  db.run('INSERT INTO daily_reports SET ?', report);
});
```

#### Form Validation

**Automatic Validation:**
The system automatically validates forms based on your configuration:

```javascript
// Required fields are automatically validated
// Field types are validated (email format, number ranges, etc.)
// Custom validation can be added in the template

const validation = dataService.validateReportData(formData, templateId);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}
```

#### Best Practices

**1. Field Naming:**
- Use camelCase: `clientEngagement`, `activityType`
- Be descriptive: "Client Engagement" not just "Engagement"
- Include helpful descriptions for complex fields

**2. Categories:**
- Group related fields logically
- Use clear category names and descriptions
- Order categories by importance

**3. Analytics:**
- Use scale fields (1-10) for metrics that need charts
- Use text fields for qualitative data
- Use yes/no fields for binary tracking

**4. User Experience:**
- Provide helpful descriptions
- Use appropriate field types
- Set reasonable defaults
- Make required fields clear

#### Testing Your Forms

**1. Use the Preview Feature:**
The FormTemplateSelector includes a preview mode to test your forms before implementing.

**2. Test Validation:**
```javascript
// Test your form validation
const testData = {
  activityType: 'therapy',
  clientEngagement: 8,
  notes: 'Great session today'
};

const validation = dataService.validateReportData(testData, 'my_company_form');
console.log('Valid:', validation.isValid);
```

**3. Test Analytics:**
Ensure your numeric fields appear correctly in the analytics charts.

#### Migration from Existing Forms

**If you have existing forms:**
1. Map your current fields to the new field types
2. Create your form template configuration
3. Test with the preview feature
4. Update your database schema
5. Migrate existing data
6. Deploy the new form

### 4. Feature Configuration

#### Enable/Disable Features
Create a configuration file `src/config/features.js`:
```javascript
export const FEATURES = {
  ANALYTICS: true,
  ANNOUNCEMENTS: true,
  STAFF_MANAGEMENT: true,
  FACILITY_MANAGEMENT: true,
  DAILY_REPORTS: true,
  EXPORT_FUNCTIONALITY: true,
};
```

#### Role Configuration
Update user roles in `src/context/UserContext.js`:
```javascript
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  // Add more roles as needed
};
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header/         # Navigation header
│   ├── Sidebar/        # Navigation sidebar
│   ├── Layout/         # Main layout wrapper
│   └── Widget/         # Dashboard widgets
├── pages/              # Page components
│   ├── dashboard/      # Dashboard page
│   ├── client/         # Client management
│   ├── facility/       # Facility management
│   ├── reports/        # Daily reports
│   ├── staff/          # Staff management
│   ├── announcements/  # Announcements
│   └── login/          # Authentication
├── context/            # React Context providers
├── themes/             # Material-UI themes
├── images/             # Static assets
└── config/             # Configuration files
```

## 🔧 Development

### Available Scripts

- `yarn start` - Start development server
- `yarn build` - Build for production
- `yarn test` - Run tests
- `yarn eject` - Eject from Create React App

### Environment Variables

Create a `.env` file in the root directory:
```env
REACT_APP_BACKEND=false
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_COMPANY_NAME=Your Company Name
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
- **Netlify**: Connect repository and deploy
- **Heroku**: Use buildpack for React apps
- **AWS S3**: Build and upload static files

## 📋 TODO for Production

- [ ] Implement SQLite database integration
- [ ] Add data validation and error handling
- [ ] Implement backup and restore functionality
- [ ] Add audit logging
- [ ] Set up automated testing
- [ ] Configure production environment variables
- [ ] Set up monitoring and analytics
- [ ] Implement security best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This template is available for commercial and personal use. Please customize it according to your needs.

## 📚 Quick Reference

### Form Customization Cheat Sheet

**1. Create New Form Template:**
```javascript
// In src/config/formTemplates.js
export const MY_FORM = {
  id: 'my_form',
  name: 'My Form Name',
  fields: { /* your fields */ },
  categories: { /* your categories */ }
};
```

**2. Add to Available Templates:**
```javascript
export const FORM_TEMPLATES = {
  // ... existing templates
  my_form: MY_FORM
};
```

**3. Use in Components:**
```javascript
import { dataService } from '../services/dataService';
const template = dataService.getFormTemplate('my_form');
```

### Common Field Types for Different Use Cases

**Healthcare Metrics:**
```javascript
mood: { type: 'scale', min: 1, max: 10, label: 'Mood' }
behavior: { type: 'scale', min: 1, max: 10, label: 'Behavior' }
```

**Medication Tracking:**
```javascript
medicationName: { type: 'text', label: 'Medication Name' }
administered: { type: 'yes_no', label: 'Administered' }
timeGiven: { type: 'time', label: 'Time Given' }
```

**Behavioral Assessment:**
```javascript
incidentType: { type: 'select', options: [...] }
followUpNeeded: { type: 'yes_no', label: 'Follow-up Needed' }
notes: { type: 'textarea', label: 'Notes' }
```

**Activity Tracking:**
```javascript
activityType: { type: 'select', options: [...] }
duration: { type: 'number', label: 'Duration (minutes)' }
engagement: { type: 'scale', min: 1, max: 10 }
```

### Analytics Integration

**For Charts (use these field types):**
- `scale` (1-10 ratings) - Perfect for trend charts
- `number` (quantities) - Good for bar charts
- `yes_no` - Can be converted to percentages

**For Reports Only:**
- `text` - Shows in reports, not charts
- `textarea` - Detailed observations
- `select` - Categorical data
- `date/time` - Timeline information

## 🆘 Support

For questions or issues:
1. Check the documentation
2. Review the code comments
3. Create an issue in the repository
4. Contact the development team

### Form Customization Support
- **Documentation**: See `FORM_CUSTOMIZATION.md` for detailed guide
- **Examples**: Check `src/config/formTemplates.js` for examples
- **Testing**: Use the FormTemplateSelector preview feature
- **Validation**: All forms include automatic validation

---

**Built with ❤️ for healthcare professionals**