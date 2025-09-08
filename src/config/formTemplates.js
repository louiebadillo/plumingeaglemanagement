// Form Templates Configuration
// This file allows easy customization of forms for different companies and use cases

// Base field types that can be used in any form
export const FIELD_TYPES = {
  SCALE: 'scale',           // 1-10 rating scale
  TEXT: 'text',             // Free text input
  TEXTAREA: 'textarea',     // Multi-line text
  YES_NO: 'yes_no',         // Yes/No radio buttons
  SELECT: 'select',         // Dropdown selection
  MULTI_SELECT: 'multi_select', // Multiple choice
  CHECKBOX: 'checkbox',     // Single checkbox
  DATE: 'date',            // Date picker
  TIME: 'time',            // Time picker
  NUMBER: 'number',        // Numeric input
  EMAIL: 'email',          // Email input
  PHONE: 'phone',          // Phone number input
  FILE: 'file'             // File upload
};

// Default form template (current healthcare metrics)
export const DEFAULT_FORM_TEMPLATE = {
  id: 'healthcare_metrics',
  name: 'Healthcare Daily Report',
  description: 'Standard healthcare metrics for daily client reports',
  version: '1.0',
  fields: {
    // Current metrics (keeping as requested)
    mood: {
      type: FIELD_TYPES.SCALE,
      label: 'Mood',
      description: 'How is the client\'s overall mood today?',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 5,
      category: 'emotional_wellbeing'
    },
    behavior: {
      type: FIELD_TYPES.SCALE,
      label: 'Behavior',
      description: 'How was the client\'s behavior today?',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 5,
      category: 'behavioral'
    },
    sleepQuality: {
      type: FIELD_TYPES.SCALE,
      label: 'Sleep Quality',
      description: 'How was the client\'s sleep quality?',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 5,
      category: 'physical_health'
    },
    appetite: {
      type: FIELD_TYPES.SCALE,
      label: 'Appetite',
      description: 'How was the client\'s appetite today?',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 5,
      category: 'physical_health'
    },
    socialInteraction: {
      type: FIELD_TYPES.SCALE,
      label: 'Social Interaction',
      description: 'How was the client\'s social engagement?',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 5,
      category: 'social_behavior'
    },
    physicalActivity: {
      type: FIELD_TYPES.SCALE,
      label: 'Physical Activity',
      description: 'How was the client\'s physical activity level?',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 5,
      category: 'physical_health'
    },
    medicationCompliance: {
      type: FIELD_TYPES.SCALE,
      label: 'Medication Compliance',
      description: 'How well did the client follow medication schedule?',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 5,
      category: 'medical_compliance'
    },
    therapyEngagement: {
      type: FIELD_TYPES.SCALE,
      label: 'Therapy Engagement',
      description: 'How engaged was the client in therapy sessions?',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 5,
      category: 'therapeutic'
    }
  },
  categories: {
    emotional_wellbeing: {
      label: 'Emotional Wellbeing',
      description: 'Client\'s emotional state and mood',
      order: 1
    },
    behavioral: {
      label: 'Behavioral',
      description: 'Client\'s behavior and conduct',
      order: 2
    },
    physical_health: {
      label: 'Physical Health',
      description: 'Physical health indicators',
      order: 3
    },
    social_behavior: {
      label: 'Social Behavior',
      description: 'Social interaction and engagement',
      order: 4
    },
    medical_compliance: {
      label: 'Medical Compliance',
      description: 'Medication and treatment adherence',
      order: 5
    },
    therapeutic: {
      label: 'Therapeutic',
      description: 'Therapy and treatment engagement',
      order: 6
    }
  }
};

// Alternative form templates for different companies/use cases

// Medication-focused template
export const MEDICATION_FORM_TEMPLATE = {
  id: 'medication_tracking',
  name: 'Medication Administration Report',
  description: 'Track medication administration and compliance',
  version: '1.0',
  fields: {
    medicationType: {
      type: FIELD_TYPES.SELECT,
      label: 'Medication Type',
      description: 'Type of medication administered',
      required: true,
      options: [
        { value: 'prescription', label: 'Prescription Medication' },
        { value: 'over_the_counter', label: 'Over-the-Counter' },
        { value: 'supplement', label: 'Vitamin/Supplement' },
        { value: 'as_needed', label: 'As Needed (PRN)' }
      ],
      category: 'medication_info'
    },
    medicationName: {
      type: FIELD_TYPES.TEXT,
      label: 'Medication Name',
      description: 'Name of the medication',
      required: true,
      placeholder: 'e.g., Acetaminophen 500mg',
      category: 'medication_info'
    },
    dosage: {
      type: FIELD_TYPES.TEXT,
      label: 'Dosage',
      description: 'Amount and frequency',
      required: true,
      placeholder: 'e.g., 1 tablet every 6 hours',
      category: 'medication_info'
    },
    administered: {
      type: FIELD_TYPES.YES_NO,
      label: 'Medication Administered',
      description: 'Was the medication given to the client?',
      required: true,
      defaultValue: false,
      category: 'administration'
    },
    timeAdministered: {
      type: FIELD_TYPES.TIME,
      label: 'Time Administered',
      description: 'What time was the medication given?',
      required: true,
      category: 'administration'
    },
    clientTook: {
      type: FIELD_TYPES.YES_NO,
      label: 'Client Took Medication',
      description: 'Did the client actually take the medication?',
      required: true,
      defaultValue: false,
      category: 'compliance'
    },
    sideEffects: {
      type: FIELD_TYPES.TEXTAREA,
      label: 'Side Effects Observed',
      description: 'Any side effects or adverse reactions noted',
      required: false,
      placeholder: 'Describe any side effects observed...',
      category: 'monitoring'
    },
    notes: {
      type: FIELD_TYPES.TEXTAREA,
      label: 'Additional Notes',
      description: 'Any additional observations or notes',
      required: false,
      placeholder: 'Additional notes about medication administration...',
      category: 'notes'
    }
  },
  categories: {
    medication_info: {
      label: 'Medication Information',
      description: 'Details about the medication',
      order: 1
    },
    administration: {
      label: 'Administration',
      description: 'When and how medication was given',
      order: 2
    },
    compliance: {
      label: 'Compliance',
      description: 'Client compliance with medication',
      order: 3
    },
    monitoring: {
      label: 'Monitoring',
      description: 'Side effects and reactions',
      order: 4
    },
    notes: {
      label: 'Notes',
      description: 'Additional observations',
      order: 5
    }
  }
};

// Behavioral assessment template
export const BEHAVIORAL_FORM_TEMPLATE = {
  id: 'behavioral_assessment',
  name: 'Behavioral Assessment Report',
  description: 'Daily behavioral assessment and incident tracking',
  version: '1.0',
  fields: {
    overallBehavior: {
      type: FIELD_TYPES.SELECT,
      label: 'Overall Behavior',
      description: 'How would you rate the client\'s overall behavior today?',
      required: true,
      options: [
        { value: 'excellent', label: 'Excellent' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' },
        { value: 'poor', label: 'Poor' },
        { value: 'concerning', label: 'Concerning' }
      ],
      category: 'assessment'
    },
    incidentsOccurred: {
      type: FIELD_TYPES.YES_NO,
      label: 'Incidents Occurred',
      description: 'Were there any behavioral incidents today?',
      required: true,
      defaultValue: false,
      category: 'incidents'
    },
    incidentType: {
      type: FIELD_TYPES.MULTI_SELECT,
      label: 'Type of Incidents',
      description: 'What types of incidents occurred? (if any)',
      required: false,
      options: [
        { value: 'aggression', label: 'Aggression' },
        { value: 'self_harm', label: 'Self-Harm' },
        { value: 'property_damage', label: 'Property Damage' },
        { value: 'elopement', label: 'Elopement' },
        { value: 'medication_refusal', label: 'Medication Refusal' },
        { value: 'other', label: 'Other' }
      ],
      category: 'incidents'
    },
    triggers: {
      type: FIELD_TYPES.TEXTAREA,
      label: 'Potential Triggers',
      description: 'What might have triggered any incidents?',
      required: false,
      placeholder: 'Describe any potential triggers...',
      category: 'analysis'
    },
    interventions: {
      type: FIELD_TYPES.TEXTAREA,
      label: 'Interventions Used',
      description: 'What interventions were used to address incidents?',
      required: false,
      placeholder: 'Describe interventions used...',
      category: 'analysis'
    },
    followUpNeeded: {
      type: FIELD_TYPES.YES_NO,
      label: 'Follow-up Needed',
      description: 'Does this incident require follow-up?',
      required: true,
      defaultValue: false,
      category: 'follow_up'
    },
    followUpNotes: {
      type: FIELD_TYPES.TEXTAREA,
      label: 'Follow-up Notes',
      description: 'Notes for follow-up actions',
      required: false,
      placeholder: 'Describe follow-up actions needed...',
      category: 'follow_up'
    }
  },
  categories: {
    assessment: {
      label: 'Behavioral Assessment',
      description: 'Overall behavior evaluation',
      order: 1
    },
    incidents: {
      label: 'Incidents',
      description: 'Incident tracking and classification',
      order: 2
    },
    analysis: {
      label: 'Analysis',
      description: 'Trigger and intervention analysis',
      order: 3
    },
    follow_up: {
      label: 'Follow-up',
      description: 'Follow-up actions and notes',
      order: 4
    }
  }
};

// Company-specific form templates
export const FORM_TEMPLATES = {
  healthcare_metrics: DEFAULT_FORM_TEMPLATE,
  medication_tracking: MEDICATION_FORM_TEMPLATE,
  behavioral_assessment: BEHAVIORAL_FORM_TEMPLATE
};

// Helper functions for form management
export const getFormTemplate = (templateId) => {
  return FORM_TEMPLATES[templateId] || DEFAULT_FORM_TEMPLATE;
};

export const getAvailableTemplates = () => {
  return Object.values(FORM_TEMPLATES).map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
    version: template.version
  }));
};

export const getFieldsByCategory = (templateId) => {
  const template = getFormTemplate(templateId);
  const categories = {};
  
  Object.entries(template.fields).forEach(([fieldKey, fieldConfig]) => {
    const category = fieldConfig.category;
    if (!categories[category]) {
      categories[category] = {
        ...template.categories[category],
        fields: []
      };
    }
    categories[category].fields.push({
      key: fieldKey,
      ...fieldConfig
    });
  });
  
  // Sort categories by order
  return Object.values(categories).sort((a, b) => a.order - b.order);
};

export const validateFormData = (templateId, data) => {
  const template = getFormTemplate(templateId);
  const errors = [];
  
  Object.entries(template.fields).forEach(([fieldKey, fieldConfig]) => {
    const value = data[fieldKey];
    
    // Check required fields
    if (fieldConfig.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldConfig.label} is required`);
    }
    
    // Type-specific validation
    if (value !== undefined && value !== null && value !== '') {
      switch (fieldConfig.type) {
        case FIELD_TYPES.SCALE:
          if (value < fieldConfig.min || value > fieldConfig.max) {
            errors.push(`${fieldConfig.label} must be between ${fieldConfig.min} and ${fieldConfig.max}`);
          }
          break;
        case FIELD_TYPES.EMAIL:
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${fieldConfig.label} must be a valid email address`);
          }
          break;
        case FIELD_TYPES.NUMBER:
          if (isNaN(value)) {
            errors.push(`${fieldConfig.label} must be a valid number`);
          }
          break;
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  FIELD_TYPES,
  DEFAULT_FORM_TEMPLATE,
  FORM_TEMPLATES,
  getFormTemplate,
  getAvailableTemplates,
  getFieldsByCategory,
  validateFormData
};
