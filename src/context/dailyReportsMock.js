// Mock daily reports data for client analytics
// Each report contains questionnaire responses with numeric codes

export const mockDailyReports = [
  // Victoria Cantrel (Client ID: 1) - Reports from last 3 months
  {
    id: 1,
    clientId: 1,
    date: '2024-01-15',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 8, // 1-10 scale
      behavior: 7, // 1-10 scale
      socialInteraction: 6, // 1-10 scale
      medicationCompliance: 9, // 1-10 scale
      physicalActivity: 7, // 1-10 scale
      sleepQuality: 8, // 1-10 scale
      appetite: 8, // 1-10 scale
      therapyEngagement: 7 // 1-10 scale
    },
    notes: 'Good day overall. Participated well in group activities.'
  },
  {
    id: 2,
    clientId: 1,
    date: '2024-01-16',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 7,
      behavior: 8,
      socialInteraction: 7,
      medicationCompliance: 9,
      physicalActivity: 6,
      sleepQuality: 7,
      appetite: 7,
      therapyEngagement: 8
    },
    notes: 'Slightly tired but engaged in therapy session.'
  },
  {
    id: 3,
    clientId: 1,
    date: '2024-01-17',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 9,
      behavior: 8,
      socialInteraction: 8,
      medicationCompliance: 10,
      physicalActivity: 8,
      sleepQuality: 9,
      appetite: 8,
      therapyEngagement: 9
    },
    notes: 'Excellent day. Very positive and active.'
  },
  {
    id: 4,
    clientId: 1,
    date: '2024-01-18',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 6,
      behavior: 6,
      socialInteraction: 5,
      medicationCompliance: 8,
      physicalActivity: 5,
      sleepQuality: 6,
      appetite: 6,
      therapyEngagement: 6
    },
    notes: 'Quiet day, seemed withdrawn. Will monitor closely.'
  },
  {
    id: 5,
    clientId: 1,
    date: '2024-01-19',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 8,
      behavior: 7,
      socialInteraction: 7,
      medicationCompliance: 9,
      physicalActivity: 7,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 7
    },
    notes: 'Back to normal levels. Good recovery from yesterday.'
  },
  {
    id: 6,
    clientId: 1,
    date: '2024-01-20',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 8,
      behavior: 8,
      socialInteraction: 8,
      medicationCompliance: 9,
      physicalActivity: 8,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Consistent good performance across all areas.'
  },
  {
    id: 7,
    clientId: 1,
    date: '2024-01-21',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 9,
      behavior: 9,
      socialInteraction: 9,
      medicationCompliance: 10,
      physicalActivity: 9,
      sleepQuality: 9,
      appetite: 9,
      therapyEngagement: 9
    },
    notes: 'Outstanding day. All metrics at peak levels.'
  },
  {
    id: 8,
    clientId: 1,
    date: '2024-01-22',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 7,
      behavior: 7,
      socialInteraction: 7,
      medicationCompliance: 9,
      physicalActivity: 7,
      sleepQuality: 7,
      appetite: 7,
      therapyEngagement: 7
    },
    notes: 'Steady performance. Minor fatigue noted.'
  },
  {
    id: 9,
    clientId: 1,
    date: '2024-01-23',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 8,
      behavior: 8,
      socialInteraction: 8,
      medicationCompliance: 9,
      physicalActivity: 8,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Good consistency. Participating well in activities.'
  },
  {
    id: 10,
    clientId: 1,
    date: '2024-01-24',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 8,
      behavior: 8,
      socialInteraction: 8,
      medicationCompliance: 9,
      physicalActivity: 8,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Stable day. All metrics within normal range.'
  },

  // Robert Martinez (Client ID: 2) - Reports from last 2 months
  {
    id: 11,
    clientId: 2,
    date: '2024-01-10',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 6,
      behavior: 5,
      socialInteraction: 4,
      medicationCompliance: 7,
      physicalActivity: 5,
      sleepQuality: 6,
      appetite: 5,
      therapyEngagement: 6
    },
    notes: 'Early days. Still adjusting to new environment.'
  },
  {
    id: 12,
    clientId: 2,
    date: '2024-01-11',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 7,
      behavior: 6,
      socialInteraction: 5,
      medicationCompliance: 8,
      physicalActivity: 6,
      sleepQuality: 7,
      appetite: 6,
      therapyEngagement: 7
    },
    notes: 'Showing improvement. More comfortable with routine.'
  },
  {
    id: 13,
    clientId: 2,
    date: '2024-01-12',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 8,
      behavior: 7,
      socialInteraction: 6,
      medicationCompliance: 8,
      physicalActivity: 7,
      sleepQuality: 8,
      appetite: 7,
      therapyEngagement: 8
    },
    notes: 'Good progress. Engaging more with other residents.'
  },
  {
    id: 14,
    clientId: 2,
    date: '2024-01-13',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 7,
      behavior: 7,
      socialInteraction: 7,
      medicationCompliance: 9,
      physicalActivity: 7,
      sleepQuality: 7,
      appetite: 7,
      therapyEngagement: 7
    },
    notes: 'Stable day. Blood sugar levels well managed.'
  },
  {
    id: 15,
    clientId: 2,
    date: '2024-01-14',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 8,
      behavior: 8,
      socialInteraction: 8,
      medicationCompliance: 9,
      physicalActivity: 8,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Excellent day. All metrics showing improvement.'
  },
  {
    id: 16,
    clientId: 2,
    date: '2024-01-15',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 8,
      behavior: 8,
      socialInteraction: 8,
      medicationCompliance: 9,
      physicalActivity: 8,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Consistent good performance. Diabetes management going well.'
  },
  {
    id: 17,
    clientId: 2,
    date: '2024-01-16',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 9,
      behavior: 9,
      socialInteraction: 9,
      medicationCompliance: 10,
      physicalActivity: 9,
      sleepQuality: 9,
      appetite: 9,
      therapyEngagement: 9
    },
    notes: 'Peak performance day. Very engaged and positive.'
  },
  {
    id: 18,
    clientId: 2,
    date: '2024-01-17',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 8,
      behavior: 8,
      socialInteraction: 8,
      medicationCompliance: 9,
      physicalActivity: 8,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Maintaining good levels. Blood sugar stable.'
  },
  {
    id: 19,
    clientId: 2,
    date: '2024-01-18',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 7,
      behavior: 7,
      socialInteraction: 7,
      medicationCompliance: 8,
      physicalActivity: 7,
      sleepQuality: 7,
      appetite: 7,
      therapyEngagement: 7
    },
    notes: 'Slight dip but within normal range. Monitoring closely.'
  },
  {
    id: 20,
    clientId: 2,
    date: '2024-01-19',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 8,
      behavior: 8,
      socialInteraction: 8,
      medicationCompliance: 9,
      physicalActivity: 8,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Back to good levels. Recovery from minor setback.'
  },

  // Additional clients with fewer reports for variety
  {
    id: 21,
    clientId: 3,
    date: '2024-01-20',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 7,
      behavior: 6,
      socialInteraction: 5,
      medicationCompliance: 8,
      physicalActivity: 6,
      sleepQuality: 7,
      appetite: 6,
      therapyEngagement: 7
    },
    notes: 'New admission. Still adjusting to environment.'
  },
  {
    id: 22,
    clientId: 3,
    date: '2024-01-21',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 8,
      behavior: 7,
      socialInteraction: 6,
      medicationCompliance: 8,
      physicalActivity: 7,
      sleepQuality: 8,
      appetite: 7,
      therapyEngagement: 8
    },
    notes: 'Good progress. More comfortable with routine.'
  },
  {
    id: 23,
    clientId: 3,
    date: '2024-01-22',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 8,
      behavior: 8,
      socialInteraction: 7,
      medicationCompliance: 9,
      physicalActivity: 8,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Excellent adaptation. All metrics improving.'
  },

  // Extended data for Victoria Cantrel to test yearly ranges
  {
    id: 24,
    clientId: 1,
    date: '2023-06-15',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 5,
      behavior: 4,
      socialInteraction: 3,
      medicationCompliance: 6,
      physicalActivity: 4,
      sleepQuality: 5,
      appetite: 5,
      therapyEngagement: 5
    },
    notes: 'Early days. Still adjusting to new environment.'
  },
  {
    id: 25,
    clientId: 1,
    date: '2023-07-15',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 6,
      behavior: 5,
      socialInteraction: 4,
      medicationCompliance: 7,
      physicalActivity: 5,
      sleepQuality: 6,
      appetite: 6,
      therapyEngagement: 6
    },
    notes: 'Gradual improvement. More comfortable with routine.'
  },
  {
    id: 26,
    clientId: 1,
    date: '2023-08-15',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 7,
      behavior: 6,
      socialInteraction: 5,
      medicationCompliance: 8,
      physicalActivity: 6,
      sleepQuality: 7,
      appetite: 7,
      therapyEngagement: 7
    },
    notes: 'Good progress. Engaging more with activities.'
  },
  {
    id: 27,
    clientId: 1,
    date: '2023-09-15',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 7,
      behavior: 7,
      socialInteraction: 6,
      medicationCompliance: 8,
      physicalActivity: 7,
      sleepQuality: 7,
      appetite: 7,
      therapyEngagement: 7
    },
    notes: 'Stable progress. All metrics improving steadily.'
  },
  {
    id: 28,
    clientId: 1,
    date: '2023-10-15',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 8,
      behavior: 7,
      socialInteraction: 7,
      medicationCompliance: 9,
      physicalActivity: 7,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Excellent progress. Very engaged and positive.'
  },
  {
    id: 29,
    clientId: 1,
    date: '2023-11-15',
    staffMember: 'Mike Chen',
    questionnaire: {
      mood: 8,
      behavior: 8,
      socialInteraction: 8,
      medicationCompliance: 9,
      physicalActivity: 8,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Consistent good performance. All metrics at good levels.'
  },
  {
    id: 30,
    clientId: 1,
    date: '2023-12-15',
    staffMember: 'Sarah Johnson',
    questionnaire: {
      mood: 8,
      behavior: 8,
      socialInteraction: 8,
      medicationCompliance: 9,
      physicalActivity: 8,
      sleepQuality: 8,
      appetite: 8,
      therapyEngagement: 8
    },
    notes: 'Maintaining excellent progress. Ready for next phase.'
  }
];

// Helper functions for analytics
export const getReportsByClientId = async (clientId) => {
  // Import dataService dynamically to avoid circular dependencies
  const { dataService } = await import('../services/dataService');
  
  try {
    // Try to get reports from data service (handles both localStorage and database)
    const reports = await dataService.getReportsByClientId(clientId);
    return reports;
  } catch (error) {
    console.warn('Failed to get reports from data service, falling back to localStorage:', error);
    
    // Fallback to localStorage
    const savedReports = JSON.parse(localStorage.getItem('dailyReports') || '[]');
    const savedReportsForClient = savedReports.filter(report => report.clientId === clientId);
    
    // Combine with mock data for demonstration
    const mockReportsForClient = mockDailyReports.filter(report => report.clientId === clientId);
    
    // Merge and sort by date
    const allReports = [...savedReportsForClient, ...mockReportsForClient];
    return allReports.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
};

export const getReportsByDateRange = (clientId, startDate, endDate) => {
  const allReports = getReportsByClientId(clientId);
  return allReports.filter(report => 
    report.date >= startDate &&
    report.date <= endDate
  );
};

export const getMonthlyReports = (clientId, year, month) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
  return getReportsByDateRange(clientId, startDate, endDate);
};

export const getYearlyReports = (clientId, year) => {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  return getReportsByDateRange(clientId, startDate, endDate);
};

// Chart data processing functions
export const processChartData = (reports, metric) => {
  return reports.map(report => ({
    date: report.date,
    value: report.questionnaire[metric],
    staffMember: report.staffMember
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const getAverageByMetric = (reports, metric) => {
  if (reports.length === 0) return 0;
  const sum = reports.reduce((acc, report) => acc + report.questionnaire[metric], 0);
  return Math.round((sum / reports.length) * 10) / 10; // Round to 1 decimal
};

export const getTrend = (reports, metric) => {
  if (reports.length < 2) return 'stable';
  const sortedReports = reports.sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstHalf = sortedReports.slice(0, Math.floor(sortedReports.length / 2));
  const secondHalf = sortedReports.slice(Math.floor(sortedReports.length / 2));
  
  const firstAvg = getAverageByMetric(firstHalf, metric);
  const secondAvg = getAverageByMetric(secondHalf, metric);
  
  const difference = secondAvg - firstAvg;
  if (difference > 0.5) return 'improving';
  if (difference < -0.5) return 'declining';
  return 'stable';
};

// Available metrics for charts
export const availableMetrics = [
  { key: 'mood', label: 'Mood', description: 'Overall emotional state (1-10)' },
  { key: 'behavior', label: 'Behavior', description: 'Behavioral compliance (1-10)' },
  { key: 'socialInteraction', label: 'Social Interaction', description: 'Engagement with others (1-10)' },
  { key: 'medicationCompliance', label: 'Medication Compliance', description: 'Adherence to medication (1-10)' },
  { key: 'physicalActivity', label: 'Physical Activity', description: 'Level of physical engagement (1-10)' },
  { key: 'sleepQuality', label: 'Sleep Quality', description: 'Quality of rest (1-10)' },
  { key: 'appetite', label: 'Appetite', description: 'Eating habits and nutrition (1-10)' },
  { key: 'therapyEngagement', label: 'Therapy Engagement', description: 'Participation in therapy (1-10)' }
];
