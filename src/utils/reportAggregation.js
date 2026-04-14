// Data aggregation utilities for progress reports
// Processes daily reports data to generate analytics and charts

/**
 * Aggregate reports data for a specific date range
 * @param {Array} reports - Array of daily reports
 * @param {Object} dateRange - Date range object with start and end dates
 * @returns {Object} Aggregated data with scores and metrics
 */
export const aggregateReportsData = (reports, dateRange) => {
  const emptyBirSummary = { trueDays: 0, totalDays: 0, averagePercent: 0 };

  if (!reports || reports.length === 0) {
    return {
      healthScore: 0,
      routineScore: 0,
      wellbeingScore: 0,
      behaviourScore: 0,
      overallScore: 0,
      indicator: 'Needs Improvement',
      pieChartData: {},
      trendData: [],
      summaryTables: {},
      birSummary: emptyBirSummary,
      routineChores: []
    };
  }

  // Filter out null reports (exclude from analytics)
  const validReports = reports.filter(report => report.status !== 'null_report');
  
  if (validReports.length === 0) {
    return {
      healthScore: 0,
      routineScore: 0,
      wellbeingScore: 0,
      behaviourScore: 0,
      overallScore: 0,
      indicator: 'Needs Improvement',
      pieChartData: {},
      trendData: [],
      summaryTables: {},
      birSummary: emptyBirSummary,
      routineChores: []
    };
  }

  // Calculate section scores for each report
  const sectionScores = validReports.map(report => ({
    health: calculateHealthScore(report),
    routine: calculateRoutineScore(report),
    wellbeing: calculateWellBeingScore(report),
    behaviour: calculateBehaviourScore(report)
  }));

  // Calculate average scores
  const healthScore = Math.round(sectionScores.reduce((sum, s) => sum + s.health, 0) / sectionScores.length);
  const routineScore = Math.round(sectionScores.reduce((sum, s) => sum + s.routine, 0) / sectionScores.length);
  const wellbeingScore = Math.round(sectionScores.reduce((sum, s) => sum + s.wellbeing, 0) / sectionScores.length);
  const behaviourScore = Math.round(sectionScores.reduce((sum, s) => sum + s.behaviour, 0) / sectionScores.length);

  const overallScore = Math.round((healthScore + routineScore + wellbeingScore + behaviourScore) / 4);
  const indicator = getIndicatorValue(overallScore);

  const birTrueDays = validReports.filter(
    (r) => r.bir_incidents && r.bir_incidents.hasBIR
  ).length;
  const birTotalDays = validReports.length;
  const birAveragePercent =
    birTotalDays > 0
      ? Math.round(((birTotalDays - birTrueDays) / birTotalDays) * 100)
      : 0;

  return {
    healthScore,
    routineScore,
    wellbeingScore,
    behaviourScore,
    overallScore,
    indicator,
    pieChartData: generatePieChartData(validReports),
    trendData: generateTrendData(validReports, sectionScores),
    summaryTables: generateSummaryTables(validReports),
    birSummary: {
      trueDays: birTrueDays,
      totalDays: birTotalDays,
      averagePercent: birAveragePercent
    },
    routineChores: computeRoutineChoreAverages(validReports)
  };
};

/**
 * Per-chore average star rating (1–5) across filtered reports; only answered cells count.
 * @param {Array} reports
 * @returns {{ key: string, name: string, average: number|null }[]}
 */
export const computeRoutineChoreAverages = (reports) => {
  if (!reports || reports.length === 0) return [];

  return ROUTINE_CHORE_FIELDS.map(({ key, name, morning, afternoon }) => {
    let sum = 0;
    let n = 0;
    reports.forEach((r) => {
      [morning, afternoon].forEach((field) => {
        const v = r[field];
        if (routineRatingAnswered(v)) {
          sum += Number(v);
          n += 1;
        }
      });
    });
    return { key, name, average: n > 0 ? sum / n : null };
  });
};

const ROUTINE_CHORE_FIELDS = [
  { key: 'madeBed', name: 'Made Bed', morning: 'routine_made_bed', afternoon: 'afternoon_routine_made_bed' },
  {
    key: 'putClothesAway',
    name: 'Put Dirty Clothes Away',
    morning: 'routine_put_clothes_away',
    afternoon: 'afternoon_routine_put_clothes_away'
  },
  {
    key: 'clearedFloor',
    name: 'Cleared Bedroom Floor',
    morning: 'routine_cleared_floor',
    afternoon: 'afternoon_routine_cleared_floor'
  },
  {
    key: 'washedDishes',
    name: 'Washed Dishes',
    morning: 'routine_washed_dishes',
    afternoon: 'afternoon_routine_washed_dishes'
  }
];

/**
 * Generate pie chart data for various metrics
 * @param {Array} reports - Array of daily reports
 * @returns {Object} Pie chart data for different metrics
 */
export const generatePieChartData = (reports) => {
  const pieChartData = {};

  // Medication adherence pie — only shifts where medication was required
  const medicationData = reports.reduce((acc, report) => {
    MEDICATION_ADHERENCE_SHIFTS.forEach(([reqKey, statusKey]) => {
      if (report[reqKey] !== true) return;
      const status = report[statusKey];
      if (!questionnaireStringAnswered(status)) return;
      if (status === 'Taken') acc.taken++;
      else acc.notTaken++;
    });
    return acc;
  }, { taken: 0, notTaken: 0 });
  pieChartData.medication = [
    { name: 'Taken', value: medicationData.taken, color: '#4caf50' },
    { name: 'Not Taken', value: medicationData.notTaken, color: '#f44336' }
  ];

  // Sleep score pie chart (each answered shift; omit null)
  const sleepData = reports.reduce((acc, report) => {
    if (questionnaireBoolAnswered(report.sleep_woke_on_time)) {
      if (report.sleep_woke_on_time) acc.onTime++;
      else acc.late++;
    }
    if (questionnaireBoolAnswered(report.afternoon_slept_on_time)) {
      if (report.afternoon_slept_on_time) acc.onTime++;
      else acc.late++;
    }
    return acc;
  }, { onTime: 0, late: 0 });
  pieChartData.sleep = [
    { name: 'On Time', value: sleepData.onTime, color: '#4caf50' },
    { name: 'Late', value: sleepData.late, color: '#f44336' }
  ];

  // Diet score pie chart
  const dietData = reports.reduce((acc, report) => {
    if (questionnaireBoolAnswered(report.diet_ate_well)) {
      if (report.diet_ate_well) acc.ateWell++;
      else acc.skipped++;
    }
    if (questionnaireBoolAnswered(report.afternoon_diet_ate_well)) {
      if (report.afternoon_diet_ate_well) acc.ateWell++;
      else acc.skipped++;
    }
    return acc;
  }, { ateWell: 0, skipped: 0 });
  pieChartData.diet = [
    { name: 'Ate Well', value: dietData.ateWell, color: '#4caf50' },
    { name: 'Skipped/Poor', value: dietData.skipped, color: '#f44336' }
  ];

  // Dental hygiene pie chart
  const dentalData = reports.reduce((acc, report) => {
    if (questionnaireBoolAnswered(report.dental_hygiene_done)) {
      if (report.dental_hygiene_done) acc.done++;
      else acc.notDone++;
    }
    if (questionnaireBoolAnswered(report.afternoon_dental_hygiene_done)) {
      if (report.afternoon_dental_hygiene_done) acc.done++;
      else acc.notDone++;
    }
    return acc;
  }, { done: 0, notDone: 0 });
  pieChartData.dental = [
    { name: 'Done', value: dentalData.done, color: '#4caf50' },
    { name: 'Not Done', value: dentalData.notDone, color: '#f44336' }
  ];

  // Shower pie chart
  const showerData = reports.reduce((acc, report) => {
    if (questionnaireBoolAnswered(report.afternoon_shower_taken)) {
      if (report.afternoon_shower_taken) acc.taken++;
      else acc.notTaken++;
    }
    return acc;
  }, { taken: 0, notTaken: 0 });
  pieChartData.shower = [
    { name: 'Taken', value: showerData.taken, color: '#4caf50' },
    { name: 'Not Taken', value: showerData.notTaken, color: '#f44336' }
  ];

  // Health appointments pie chart
  const healthAppointments = reports.flatMap(report => 
    (report.appointments || []).filter(apt => apt.type === 'health')
  );
  const healthApptData = healthAppointments.reduce((acc, apt) => {
    if (!questionnaireStringAnswered(apt.compliance)) return acc;
    if (apt.compliance === 'attended') acc.attended++;
    else acc.notAttended++;
    return acc;
  }, { attended: 0, notAttended: 0 });
  pieChartData.healthAppointments = [
    { name: 'Attended', value: healthApptData.attended, color: '#4caf50' },
    { name: 'Not Attended', value: healthApptData.notAttended, color: '#f44336' }
  ];

  // School attendance pie — days supposed to go: Present = not Absent (incl. Late, Early Pick Up)
  const schoolData = reports.reduce((acc, report) => {
    if (report.afternoon_school_supposed_to_go !== true) return acc;
    if (!questionnaireStringAnswered(report.afternoon_school_status)) return acc;
    if (isSchoolPresentStatus(report.afternoon_school_status)) acc.present++;
    else acc.absent++;
    return acc;
  }, { present: 0, absent: 0 });
  pieChartData.school = [
    { name: 'Present (incl. late / early pick up)', value: schoolData.present, color: '#4caf50' },
    { name: 'Absent', value: schoolData.absent, color: '#f44336' }
  ];

  // Behaviour pie charts (omit unanswered questionnaire cells)
  const behaviourData = reports.reduce((acc, report) => {
    if (questionnaireStringAnswered(report.behaviour_observation)) {
      if (report.behaviour_observation === 'positive') acc.observation.positive++;
      else acc.observation.negative++;
    }
    if (questionnaireStringAnswered(report.afternoon_behaviour_observation)) {
      if (report.afternoon_behaviour_observation === 'positive') acc.observation.positive++;
      else acc.observation.negative++;
    }

    if (questionnaireBoolAnswered(report.behaviour_followed_rules)) {
      if (report.behaviour_followed_rules) acc.followedRules.yes++;
      else acc.followedRules.no++;
    }
    if (questionnaireBoolAnswered(report.afternoon_behaviour_followed_rules)) {
      if (report.afternoon_behaviour_followed_rules) acc.followedRules.yes++;
      else acc.followedRules.no++;
    }

    if (questionnaireBoolAnswered(report.behaviour_listened)) {
      if (report.behaviour_listened) acc.listened.yes++;
      else acc.listened.no++;
    }
    if (questionnaireBoolAnswered(report.afternoon_behaviour_listened)) {
      if (report.afternoon_behaviour_listened) acc.listened.yes++;
      else acc.listened.no++;
    }

    if (questionnaireBoolAnswered(report.behaviour_control)) {
      if (report.behaviour_control) acc.control.yes++;
      else acc.control.no++;
    }
    if (questionnaireBoolAnswered(report.afternoon_behaviour_control)) {
      if (report.afternoon_behaviour_control) acc.control.yes++;
      else acc.control.no++;
    }

    return acc;
  }, {
    observation: { positive: 0, negative: 0 },
    followedRules: { yes: 0, no: 0 },
    listened: { yes: 0, no: 0 },
    control: { yes: 0, no: 0 }
  });

  pieChartData.behaviour = {
    observation: [
      { name: 'Positive', value: behaviourData.observation.positive, color: '#4caf50' },
      { name: 'Negative', value: behaviourData.observation.negative, color: '#f44336' }
    ],
    followedRules: [
      { name: 'Yes', value: behaviourData.followedRules.yes, color: '#4caf50' },
      { name: 'No', value: behaviourData.followedRules.no, color: '#f44336' }
    ],
    listened: [
      { name: 'Yes', value: behaviourData.listened.yes, color: '#4caf50' },
      { name: 'No', value: behaviourData.listened.no, color: '#f44336' }
    ],
    control: [
      { name: 'Yes', value: behaviourData.control.yes, color: '#4caf50' },
      { name: 'No', value: behaviourData.control.no, color: '#f44336' }
    ]
  };

  // BIR, AWOL, and Injury pie charts
  const incidentData = reports.reduce((acc, report) => {
    // BIR incidents
    if (report.bir_incidents && report.bir_incidents.hasBIR) {
      report.bir_incidents.incidents.forEach(incident => {
        acc.bir[incident] = (acc.bir[incident] || 0) + 1;
      });
    }
    
    // AWOL incidents - support both old format (awol_incident) and new format (awol_incidents array)
    if (report.awol_incidents && Array.isArray(report.awol_incidents) && report.awol_incidents.length > 0) {
      report.awol_incidents.forEach(awol => {
        if (awol.status) {
          acc.awol[awol.status] = (acc.awol[awol.status] || 0) + 1;
        }
      });
    } else if (report.awol_incident) {
      // Legacy format support
      acc.awol[report.awol_status] = (acc.awol[report.awol_status] || 0) + 1;
    }
    
    // Injuries - support both old format (injury_occurred) and new format (injuries array)
    if (report.injuries && Array.isArray(report.injuries) && report.injuries.length > 0) {
      report.injuries.forEach(injury => {
        if (injury.type) {
          acc.injury[injury.type] = (acc.injury[injury.type] || 0) + 1;
        }
      });
    } else if (report.injury_occurred) {
      // Legacy format support
      acc.injury[report.injury_type] = (acc.injury[report.injury_type] || 0) + 1;
    }
    
    return acc;
  }, { bir: {}, awol: {}, injury: {} });

  pieChartData.incidents = {
    bir: Object.entries(incidentData.bir).map(([type, count]) => ({
      name: type,
      value: count,
      color: getRandomColor()
    })),
    awol: Object.entries(incidentData.awol).map(([type, count]) => ({
      name: type,
      value: count,
      color: getRandomColor()
    })),
    injury: Object.entries(incidentData.injury).map(([type, count]) => ({
      name: type,
      value: count,
      color: getRandomColor()
    }))
  };

  // Generate bar chart data for BIR incidents
  pieChartData.birBarChart = Object.entries(incidentData.bir)
    .map(([type, count]) => ({
      name: type,
      count: count
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  return pieChartData;
};

/**
 * Generate trend data for line graphs
 * @param {Array} reports - Array of daily reports
 * @param {Array} sectionScores - Array of section scores for each report
 * @returns {Array} Trend data for line graphs
 */
export const generateTrendData = (reports, sectionScores) => {
  return reports.map((report, index) => ({
    date: report.report_date,
    day: index + 1,
    health: sectionScores[index]?.health || 0,
    routine: sectionScores[index]?.routine || 0,
    wellbeing: sectionScores[index]?.wellbeing || 0,
    behaviour: sectionScores[index]?.behaviour || 0
  }));
};

/**
 * Generate summary tables for appointments, BIRs, AWOLs, and injuries
 * @param {Array} reports - Array of daily reports
 * @returns {Object} Summary tables data
 */
export const generateSummaryTables = (reports) => {
  const summaryTables = {
    healthAppointments: [],
    socialAppointments: [],
    birs: [],
    awols: [],
    injuries: []
  };

  reports.forEach(report => {
    // Health appointments
    if (report.appointments && Array.isArray(report.appointments)) {
      const healthAppointments = report.appointments.filter(apt => apt.type === 'health');
      healthAppointments.forEach(apt => {
        summaryTables.healthAppointments.push({
          date: report.report_date,
          type: apt.type || 'N/A',
          nature: apt.nature || 'N/A',
          compliance: apt.compliance || 'N/A',
          remarks: apt.remarks || 'N/A'
        });
      });

      const socialAppointments = report.appointments.filter(apt => apt.type === 'social');
      socialAppointments.forEach(apt => {
        summaryTables.socialAppointments.push({
          date: report.report_date,
          type: apt.type || 'N/A',
          compliance: apt.compliance || 'N/A',
          remarks: apt.remarks || 'N/A'
        });
      });
    }

    // BIR incidents
    if (report.bir_incidents && report.bir_incidents.hasBIR && report.bir_incidents.incidents) {
      report.bir_incidents.incidents.forEach(incident => {
        summaryTables.birs.push({
          date: report.report_date,
          type: incident,
          remarks: report.bir_incidents.remarks || 'N/A'
        });
      });
    }

    // AWOL incidents - support both old format (awol_incident) and new format (awol_incidents array)
    if (report.awol_incidents && Array.isArray(report.awol_incidents) && report.awol_incidents.length > 0) {
      report.awol_incidents.forEach(awol => {
        summaryTables.awols.push({
          date: report.report_date,
          type: awol.status || 'N/A'
        });
      });
    } else if (report.awol_incident) {
      // Legacy format support
      summaryTables.awols.push({
        date: report.report_date,
        type: report.awol_status || 'N/A'
      });
    }

    // Injuries - support both old format (injury_occurred) and new format (injuries array)
    if (report.injuries && Array.isArray(report.injuries) && report.injuries.length > 0) {
      report.injuries.forEach(injury => {
        summaryTables.injuries.push({
          date: report.report_date,
          type: injury.type || 'N/A',
          perpetrator: injury.perpetrator || 'N/A',
          remarks: injury.remarks || 'N/A'
        });
      });
    } else if (report.injury_occurred) {
      // Legacy format support
      summaryTables.injuries.push({
        date: report.report_date,
        type: report.injury_type || 'N/A',
        perpetrator: report.injury_perpetrator || 'N/A',
        remarks: report.injury_remarks || 'N/A'
      });
    }
  });

  return summaryTables;
};

/**
 * Calculate pie chart data for a specific field
 * @param {Array} reports - Array of daily reports
 * @param {string} field - Field name to analyze
 * @returns {Array} Pie chart data
 */
export const calculatePieChartData = (reports, field) => {
  const data = {};
  
  reports.forEach(report => {
    const value = report[field];
    if (value !== undefined && value !== null) {
      data[value] = (data[value] || 0) + 1;
    }
  });

  return Object.entries(data).map(([name, value]) => ({
    name,
    value,
    color: getRandomColor()
  }));
};

/**
 * Generate random color for pie chart segments
 * @returns {string} Random color hex code
 */
const getRandomColor = () => {
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Import scoring functions
import {
  calculateHealthScore,
  calculateRoutineScore,
  calculateWellBeingScore,
  calculateBehaviourScore,
  getIndicatorValue,
  questionnaireStringAnswered,
  questionnaireBoolAnswered,
  routineRatingAnswered,
  MEDICATION_ADHERENCE_SHIFTS,
  isSchoolPresentStatus
} from './reportScoring';
