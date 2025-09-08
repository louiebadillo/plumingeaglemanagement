// Migration utilities for transitioning from localStorage to database
// This script helps migrate existing data when setting up the database

export const exportLocalStorageData = () => {
  const data = {
    dailyReports: JSON.parse(localStorage.getItem('dailyReports') || '[]'),
    clients: JSON.parse(localStorage.getItem('clients') || '[]'),
    users: JSON.parse(localStorage.getItem('users') || '[]'),
    facilities: JSON.parse(localStorage.getItem('facilities') || '[]'),
    announcements: JSON.parse(localStorage.getItem('announcements') || '[]'),
    exportDate: new Date().toISOString()
  };
  
  return data;
};

export const downloadDataAsJSON = (data, filename = 'plumingeagle-export.json') => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importDataToLocalStorage = (data) => {
  try {
    if (data.dailyReports) {
      localStorage.setItem('dailyReports', JSON.stringify(data.dailyReports));
    }
    if (data.clients) {
      localStorage.setItem('clients', JSON.stringify(data.clients));
    }
    if (data.users) {
      localStorage.setItem('users', JSON.stringify(data.users));
    }
    if (data.facilities) {
      localStorage.setItem('facilities', JSON.stringify(data.facilities));
    }
    if (data.announcements) {
      localStorage.setItem('announcements', JSON.stringify(data.announcements));
    }
    return { success: true, message: 'Data imported successfully' };
  } catch (error) {
    return { success: false, message: `Import failed: ${error.message}` };
  }
};

export const validateDataStructure = (data) => {
  const errors = [];
  
  // Validate daily reports structure
  if (data.dailyReports) {
    data.dailyReports.forEach((report, index) => {
      if (!report.clientId) errors.push(`Report ${index}: missing clientId`);
      if (!report.date) errors.push(`Report ${index}: missing date`);
      if (!report.questionnaire) errors.push(`Report ${index}: missing questionnaire`);
    });
  }
  
  // Validate clients structure
  if (data.clients) {
    data.clients.forEach((client, index) => {
      if (!client.firstName) errors.push(`Client ${index}: missing firstName`);
      if (!client.lastName) errors.push(`Client ${index}: missing lastName`);
      if (!client.dateOfBirth) errors.push(`Client ${index}: missing dateOfBirth`);
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const convertToDatabaseFormat = (localStorageData) => {
  // Convert localStorage format to database format
  const converted = {
    clients: localStorageData.clients?.map(client => ({
      first_name: client.firstName,
      last_name: client.lastName,
      date_of_birth: client.dateOfBirth,
      phone: client.phone,
      email: client.email,
      address: client.address,
      emergency_contact_name: client.emergencyContact?.name,
      emergency_contact_phone: client.emergencyContact?.phone,
      emergency_contact_relationship: client.emergencyContact?.relationship,
      secondary_emergency_contact_name: client.secondaryEmergencyContact?.name,
      secondary_emergency_contact_phone: client.secondaryEmergencyContact?.phone,
      secondary_emergency_contact_relationship: client.secondaryEmergencyContact?.relationship,
      dietary_restrictions: client.dietaryRestrictions,
      activity_preferences: client.activityPreferences,
      other_preferences: client.otherPreferences,
      medical_notes: client.medicalNotes,
      profile_photo_url: client.profilePhoto,
      facility_id: client.facilityId
    })) || [],
    
    daily_reports: localStorageData.dailyReports?.map(report => ({
      client_id: report.clientId,
      staff_member_id: report.staffMemberId || 1, // Default to admin user
      facility_id: report.facilityId,
      date: report.date,
      shift: report.shift,
      status: report.status,
      mood_score: report.questionnaire?.mood,
      behavior_score: report.questionnaire?.behavior,
      sleep_quality_score: report.questionnaire?.sleepQuality,
      appetite_score: report.questionnaire?.appetite,
      social_interaction_score: report.questionnaire?.socialInteraction,
      physical_activity_score: report.questionnaire?.physicalActivity,
      medication_compliance_score: report.questionnaire?.medicationCompliance,
      therapy_engagement_score: report.questionnaire?.therapyEngagement,
      notes: report.notes,
      incidents: report.incidents,
      medications: report.medications,
      goals_progress: report.goalsProgress
    })) || [],
    
    facilities: localStorageData.facilities?.map(facility => ({
      name: facility.name,
      description: facility.description,
      address: facility.address
    })) || [],
    
    users: localStorageData.users?.map(user => ({
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      password_hash: user.passwordHash || 'temp_hash', // Will need to be updated
      role: user.role || 'employee',
      phone: user.phone,
      profile_photo_url: user.profilePhoto,
      is_active: user.isActive !== false
    })) || []
  };
  
  return converted;
};

// Migration steps for database setup
export const migrationSteps = [
  {
    step: 1,
    title: 'Export Current Data',
    description: 'Export all localStorage data to JSON file',
    action: () => {
      const data = exportLocalStorageData();
      downloadDataAsJSON(data);
      return 'Data exported successfully';
    }
  },
  {
    step: 2,
    title: 'Validate Data Structure',
    description: 'Check data integrity and structure',
    action: (data) => {
      const validation = validateDataStructure(data);
      if (validation.isValid) {
        return 'Data structure is valid';
      } else {
        return `Validation errors: ${validation.errors.join(', ')}`;
      }
    }
  },
  {
    step: 3,
    title: 'Convert to Database Format',
    description: 'Transform data to match database schema',
    action: (data) => {
      const converted = convertToDatabaseFormat(data);
      downloadDataAsJSON(converted, 'database-import.json');
      return 'Data converted to database format';
    }
  },
  {
    step: 4,
    title: 'Import to Database',
    description: 'Use the generated SQL or JSON to import data',
    action: () => {
      return 'Run the SQL scripts or use your database import tool';
    }
  }
];

export default {
  exportLocalStorageData,
  downloadDataAsJSON,
  importDataToLocalStorage,
  validateDataStructure,
  convertToDatabaseFormat,
  migrationSteps
};
