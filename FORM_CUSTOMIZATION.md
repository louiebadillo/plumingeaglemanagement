# Form Customization Guide

## Overview
The form system is designed to be highly flexible and customizable for different companies and use cases. You can easily create new form templates, modify existing ones, or add new field types.

## Quick Start

### 1. Using Existing Templates
The system comes with three pre-built templates:

- **Healthcare Metrics** (Default): 1-10 scale ratings for mood, behavior, sleep, etc.
- **Medication Tracking**: Yes/No questions, medication types, administration times
- **Behavioral Assessment**: Incident tracking, behavior ratings, follow-up notes

### 2. Creating Custom Templates
Add your own form template in `src/config/formTemplates.js`:

```javascript
export const MY_COMPANY_FORM_TEMPLATE = {
  id: 'my_company_form',
  name: 'My Company Daily Report',
  description: 'Custom form for my company',
  version: '1.0',
  fields: {
    // Define your fields here
  },
  categories: {
    // Organize fields into categories
  }
};
```

## Field Types

### Available Field Types

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

### Field Configuration

Each field can be configured with:

```javascript
fieldName: {
  type: FIELD_TYPES.SCALE,           // Field type
  label: 'Field Label',              // Display label
  description: 'Field description',  // Help text
  required: true,                    // Required field
  defaultValue: 5,                   // Default value
  placeholder: 'Enter value...',     // Placeholder text
  min: 1,                           // Minimum value (for scale/number)
  max: 10,                          // Maximum value (for scale/number)
  options: [                        // Options (for select/multi_select)
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ],
  category: 'category_name'          // Category grouping
}
```

## Examples

### Example 1: Medication Tracking Form

```javascript
export const MEDICATION_FORM = {
  id: 'medication_tracking',
  name: 'Medication Administration',
  fields: {
    medicationName: {
      type: FIELD_TYPES.TEXT,
      label: 'Medication Name',
      description: 'Name of the medication',
      required: true,
      placeholder: 'e.g., Acetaminophen 500mg'
    },
    administered: {
      type: FIELD_TYPES.YES_NO,
      label: 'Medication Administered',
      description: 'Was the medication given?',
      required: true
    },
    timeAdministered: {
      type: FIELD_TYPES.TIME,
      label: 'Time Administered',
      description: 'What time was it given?',
      required: true
    },
    sideEffects: {
      type: FIELD_TYPES.TEXTAREA,
      label: 'Side Effects',
      description: 'Any observed side effects',
      required: false,
      placeholder: 'Describe any side effects...'
    }
  }
};
```

### Example 2: Behavioral Assessment Form

```javascript
export const BEHAVIORAL_FORM = {
  id: 'behavioral_assessment',
  name: 'Behavioral Assessment',
  fields: {
    overallBehavior: {
      type: FIELD_TYPES.SELECT,
      label: 'Overall Behavior',
      description: 'Rate the client\'s behavior',
      required: true,
      options: [
        { value: 'excellent', label: 'Excellent' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' },
        { value: 'poor', label: 'Poor' }
      ]
    },
    incidentsOccurred: {
      type: FIELD_TYPES.YES_NO,
      label: 'Incidents Occurred',
      description: 'Were there any incidents?',
      required: true
    },
    incidentTypes: {
      type: FIELD_TYPES.MULTI_SELECT,
      label: 'Incident Types',
      description: 'What types of incidents?',
      required: false,
      options: [
        { value: 'aggression', label: 'Aggression' },
        { value: 'self_harm', label: 'Self-Harm' },
        { value: 'property_damage', label: 'Property Damage' }
      ]
    }
  }
};
```

### Example 3: Custom Company Form

```javascript
export const CUSTOM_COMPANY_FORM = {
  id: 'custom_company',
  name: 'Daily Activity Report',
  fields: {
    activityType: {
      type: FIELD_TYPES.SELECT,
      label: 'Activity Type',
      description: 'What type of activity was conducted?',
      required: true,
      options: [
        { value: 'therapy', label: 'Therapy Session' },
        { value: 'recreation', label: 'Recreation' },
        { value: 'education', label: 'Educational Activity' },
        { value: 'life_skills', label: 'Life Skills Training' }
      ]
    },
    duration: {
      type: FIELD_TYPES.NUMBER,
      label: 'Duration (minutes)',
      description: 'How long did the activity last?',
      required: true,
      min: 1,
      max: 480
    },
    clientEngagement: {
      type: FIELD_TYPES.SCALE,
      label: 'Client Engagement',
      description: 'How engaged was the client?',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 5
    },
    notes: {
      type: FIELD_TYPES.TEXTAREA,
      label: 'Activity Notes',
      description: 'Additional observations',
      required: false,
      placeholder: 'Describe the activity and client response...'
    }
  }
};
```

## Categories

Organize fields into logical groups:

```javascript
categories: {
  basic_info: {
    label: 'Basic Information',
    description: 'Essential client information',
    order: 1
  },
  assessment: {
    label: 'Assessment',
    description: 'Daily assessment metrics',
    order: 2
  },
  notes: {
    label: 'Notes',
    description: 'Additional observations',
    order: 3
  }
}
```

## Integration

### 1. Add to Form Templates
Add your template to the `FORM_TEMPLATES` object:

```javascript
export const FORM_TEMPLATES = {
  healthcare_metrics: DEFAULT_FORM_TEMPLATE,
  medication_tracking: MEDICATION_FORM_TEMPLATE,
  behavioral_assessment: BEHAVIORAL_FORM_TEMPLATE,
  my_company_form: MY_COMPANY_FORM_TEMPLATE  // Add your template here
};
```

### 2. Update Database Schema
If using a database, add corresponding columns:

```sql
-- For medication tracking
ALTER TABLE daily_reports ADD COLUMN medication_name VARCHAR(255);
ALTER TABLE daily_reports ADD COLUMN medication_administered BOOLEAN;
ALTER TABLE daily_reports ADD COLUMN time_administered TIME;

-- For behavioral assessment
ALTER TABLE daily_reports ADD COLUMN overall_behavior VARCHAR(50);
ALTER TABLE daily_reports ADD COLUMN incidents_occurred BOOLEAN;
ALTER TABLE daily_reports ADD COLUMN incident_types TEXT; -- JSON array
```

### 3. Update Analytics
Modify analytics to handle new field types:

```javascript
// In analytics processing
const processCustomData = (reports, fieldName) => {
  return reports.map(report => ({
    date: report.date,
    value: report[fieldName],
    // Handle different data types
    numericValue: typeof report[fieldName] === 'number' ? report[fieldName] : null,
    textValue: typeof report[fieldName] === 'string' ? report[fieldName] : null,
    booleanValue: typeof report[fieldName] === 'boolean' ? report[fieldName] : null
  }));
};
```

## Best Practices

### 1. Field Naming
- Use camelCase for field keys: `medicationName`, `timeAdministered`
- Use descriptive labels: "Medication Name" instead of "Name"
- Include helpful descriptions for complex fields

### 2. Validation
- Mark required fields appropriately
- Set reasonable min/max values for numeric fields
- Provide clear error messages

### 3. User Experience
- Group related fields in categories
- Use appropriate field types for data
- Provide helpful placeholder text
- Include descriptions for complex fields

### 4. Data Structure
- Keep field names consistent across templates
- Use standard data types (string, number, boolean)
- Consider database storage requirements

## Migration

### From Existing Forms
If you have existing forms, you can migrate them:

1. **Identify field types**: Map your current fields to available types
2. **Create template**: Build your form template configuration
3. **Test thoroughly**: Use the preview feature to test your form
4. **Update database**: Add necessary database columns
5. **Deploy**: Update your application with the new template

### Version Control
- Use version numbers for templates: `version: '1.0'`
- Document changes in template descriptions
- Test new versions before deploying

## Troubleshooting

### Common Issues

1. **Field not rendering**: Check field type is valid
2. **Validation errors**: Ensure required fields have values
3. **Data not saving**: Verify field names match database schema
4. **Analytics not working**: Update analytics to handle new field types

### Debug Mode
Enable debug logging to troubleshoot:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

## Support

For questions or issues:
1. Check the form template configuration
2. Verify field types and validation rules
3. Test with the preview feature
4. Check browser console for errors
5. Review the database schema if using backend

The form system is designed to be flexible and powerful while remaining easy to use and customize for your specific needs.
