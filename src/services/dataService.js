// Centralized data service for database integration
// This service abstracts data operations and makes it easy to switch from localStorage to database

import config from '../config';

// Import form templates
import { getFormTemplate, validateFormData as validateTemplateData, FORM_TEMPLATES } from '../config/formTemplates';

// Legacy support - will be replaced by form templates
export const QUESTIONNAIRE_METRICS = {
  mood: {
    key: 'mood',
    label: 'Mood',
    description: 'How is the client\'s overall mood today?',
    type: 'scale',
    min: 1,
    max: 10,
    required: true
  },
  behavior: {
    key: 'behavior',
    label: 'Behavior',
    description: 'How was the client\'s behavior today?',
    type: 'scale',
    min: 1,
    max: 10,
    required: true
  },
  sleepQuality: {
    key: 'sleepQuality',
    label: 'Sleep Quality',
    description: 'How was the client\'s sleep quality?',
    type: 'scale',
    min: 1,
    max: 10,
    required: true
  },
  appetite: {
    key: 'appetite',
    label: 'Appetite',
    description: 'How was the client\'s appetite today?',
    type: 'scale',
    min: 1,
    max: 10,
    required: true
  },
  socialInteraction: {
    key: 'socialInteraction',
    label: 'Social Interaction',
    description: 'How was the client\'s social engagement?',
    type: 'scale',
    min: 1,
    max: 10,
    required: true
  },
  physicalActivity: {
    key: 'physicalActivity',
    label: 'Physical Activity',
    description: 'How was the client\'s physical activity level?',
    type: 'scale',
    min: 1,
    max: 10,
    required: true
  },
  medicationCompliance: {
    key: 'medicationCompliance',
    label: 'Medication Compliance',
    description: 'How well did the client follow medication schedule?',
    type: 'scale',
    min: 1,
    max: 10,
    required: true
  },
  therapyEngagement: {
    key: 'therapyEngagement',
    label: 'Therapy Engagement',
    description: 'How engaged was the client in therapy sessions?',
    type: 'scale',
    min: 1,
    max: 10,
    required: true
  }
};

// Database configuration
export const DB_CONFIG = {
  // Will be replaced with actual database connection
  type: config.isBackend ? 'database' : 'localStorage',
  endpoint: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000
};

// Data service class
class DataService {
  constructor() {
    this.isBackend = config.isBackend;
  }

  // Generic save method - works with both localStorage and database
  async saveReport(reportData) {
    if (this.isBackend) {
      return this.saveToDatabase(reportData);
    } else {
      return this.saveToLocalStorage(reportData);
    }
  }

  // Generic get method
  async getReportsByClientId(clientId) {
    if (this.isBackend) {
      return this.getFromDatabase('reports', { clientId });
    } else {
      return this.getFromLocalStorage('dailyReports', clientId);
    }
  }

  // Generic get all reports method
  async getAllReports(filters = {}) {
    if (this.isBackend) {
      return this.getFromDatabase('reports', filters);
    } else {
      return this.getAllFromLocalStorage('dailyReports', filters);
    }
  }

  // Database methods (to be implemented)
  async saveToDatabase(data) {
    try {
      const response = await fetch(`${DB_CONFIG.endpoint}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Database save error:', error);
      throw error;
    }
  }

  async getFromDatabase(table, filters) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`${DB_CONFIG.endpoint}/${table}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Database fetch error:', error);
      throw error;
    }
  }

  // LocalStorage methods (current implementation)
  async saveToLocalStorage(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const reports = JSON.parse(localStorage.getItem('dailyReports') || '[]');
        const newReport = {
          ...data,
          id: Date.now(),
          createdAt: new Date().toISOString()
        };
        reports.push(newReport);
        localStorage.setItem('dailyReports', JSON.stringify(reports));
        resolve({ success: true, id: newReport.id, data: newReport });
      }, 500); // Simulate network delay
    });
  }

  async getFromLocalStorage(key, clientId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const reports = JSON.parse(localStorage.getItem(key) || '[]');
        const filteredReports = reports.filter(report => report.clientId === clientId);
        resolve(filteredReports);
      }, 200);
    });
  }

  async getAllFromLocalStorage(key, filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const reports = JSON.parse(localStorage.getItem(key) || '[]');
        let filteredReports = reports;
        
        // Apply filters
        if (filters.clientId) {
          filteredReports = filteredReports.filter(report => report.clientId === filters.clientId);
        }
        if (filters.status) {
          filteredReports = filteredReports.filter(report => report.status === filters.status);
        }
        if (filters.dateFrom) {
          filteredReports = filteredReports.filter(report => report.date >= filters.dateFrom);
        }
        if (filters.dateTo) {
          filteredReports = filteredReports.filter(report => report.date <= filters.dateTo);
        }
        
        resolve(filteredReports);
      }, 200);
    });
  }

  // Utility methods
  getQuestionnaireMetrics() {
    return Object.values(QUESTIONNAIRE_METRICS);
  }

  getQuestionnaireKeys() {
    return Object.keys(QUESTIONNAIRE_METRICS);
  }

  // Form template methods
  getFormTemplate(templateId = 'healthcare_metrics') {
    return getFormTemplate(templateId);
  }

  getAvailableFormTemplates() {
    return Object.values(FORM_TEMPLATES).map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      version: template.version
    }));
  }

  validateReportData(data, templateId = 'healthcare_metrics') {
    // Use form template validation if available
    if (templateId && templateId !== 'healthcare_metrics') {
      return validateTemplateData(templateId, data);
    }
    
    // Legacy validation for healthcare metrics
    const errors = [];
    
    // Check required fields
    if (!data.clientId) errors.push('Client ID is required');
    if (!data.date) errors.push('Date is required');
    if (!data.staffMember) errors.push('Staff member is required');
    
    // Check questionnaire data
    const metrics = this.getQuestionnaireKeys();
    metrics.forEach(metric => {
      if (data.questionnaire[metric] === undefined || data.questionnaire[metric] === null) {
        errors.push(`${QUESTIONNAIRE_METRICS[metric].label} is required`);
      } else if (data.questionnaire[metric] < 1 || data.questionnaire[metric] > 10) {
        errors.push(`${QUESTIONNAIRE_METRICS[metric].label} must be between 1 and 10`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const dataService = new DataService();

// Export for easy testing and configuration
export default DataService;
