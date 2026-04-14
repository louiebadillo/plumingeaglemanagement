// Report scoring utilities for daily reports analytics
// Calculates various metrics from daily report data

/** String questionnaire field is answered (omit null, undefined, blank). */
export const questionnaireStringAnswered = (v) => v != null && String(v).trim() !== '';

/** Boolean / tri-state questionnaire field is answered (omit null and undefined; false is a real answer). */
export const questionnaireBoolAnswered = (v) => v != null;

/** Routine rating (1–5) is answered — omit null, undefined, blank. */
export const routineRatingAnswered = (v) => v != null && v !== '' && !Number.isNaN(Number(v));

/**
 * Calculate medication adherence score
 * @param {string} medicationStatus - The medication status from the report
 * @returns {number} Score as percentage (0-100)
 */
export const calculateMedicationAdherence = (medicationStatus) => {
  if (!medicationStatus) return 0;
  return medicationStatus === 'Taken' ? 100 : 0;
};

/**
 * [requiredField, statusField] for morning / afternoon / evening medication.
 * Adherence is only counted when the shift has medication_required === true.
 */
export const MEDICATION_ADHERENCE_SHIFTS = [
  ['medication_required', 'medication_status'],
  ['afternoon_medication_required', 'afternoon_medication_status'],
  ['evening_medication_required', 'evening_medication_status']
];

function eachApplicableMedicationScore(report, fn) {
  MEDICATION_ADHERENCE_SHIFTS.forEach(([reqKey, statusKey]) => {
    if (report[reqKey] !== true) return;
    const status = report[statusKey];
    if (!questionnaireStringAnswered(status)) return;
    fn(calculateMedicationAdherence(status));
  });
}

/** Morning, afternoon, and evening all explicitly "No medication required". */
export const allMedicationShiftsExplicitlyNotRequired = (report) =>
  MEDICATION_ADHERENCE_SHIFTS.every(([reqKey]) => report[reqKey] === false);

/**
 * Daily medication adherence % for summaries.
 * If every shift is explicitly "no meds required", returns 100% (nothing owed).
 * Otherwise averages only shifts where meds were required and status is recorded.
 */
export const getMedicationAdherenceAveragePercent = (report) => {
  if (allMedicationShiftsExplicitlyNotRequired(report)) return 100;
  const scores = [];
  eachApplicableMedicationScore(report, (s) => scores.push(s));
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
};

/**
 * Calculate sleep score
 * @param {boolean} wokeOnTime - Whether client woke up on time
 * @returns {number} Score as percentage (0-100)
 */
export const calculateSleepScore = (wokeOnTime) => {
  return wokeOnTime ? 100 : 0;
};

/**
 * Calculate diet score
 * @param {boolean} ateWell - Whether client ate well
 * @returns {number} Score as percentage (0-100)
 */
export const calculateDietScore = (ateWell) => {
  return ateWell ? 100 : 0;
};

/**
 * Calculate dental hygiene score
 * @param {boolean} dentalHygieneDone - Whether dental hygiene was done
 * @returns {number} Score as percentage (0-100)
 */
export const calculateDentalHygieneScore = (dentalHygieneDone) => {
  return dentalHygieneDone ? 100 : 0;
};



/**
 * Calculate overall score for a single report
 * @param {Object} reportData - Complete report data
 * @returns {Object} Object containing all calculated scores
 */
export const calculateReportScores = (reportData) => {
  let medicationScore = 0;
  if (allMedicationShiftsExplicitlyNotRequired(reportData)) {
    medicationScore = 100;
  } else {
    const medicationScores = [];
    eachApplicableMedicationScore(reportData, (s) => medicationScores.push(s));
    medicationScore =
      medicationScores.length > 0
        ? Math.round(medicationScores.reduce((a, b) => a + b, 0) / medicationScores.length)
        : 0;
  }

  const sleepScores = [];
  if (questionnaireBoolAnswered(reportData.sleep_woke_on_time)) {
    sleepScores.push(calculateSleepScore(reportData.sleep_woke_on_time));
  }
  if (questionnaireBoolAnswered(reportData.afternoon_slept_on_time)) {
    sleepScores.push(calculateSleepScore(reportData.afternoon_slept_on_time));
  }
  const sleepScore =
    sleepScores.length > 0
      ? Math.round(sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length)
      : 0;

  const dietScores = [];
  if (questionnaireBoolAnswered(reportData.diet_ate_well)) {
    dietScores.push(calculateDietScore(reportData.diet_ate_well));
  }
  if (questionnaireBoolAnswered(reportData.afternoon_diet_ate_well)) {
    dietScores.push(calculateDietScore(reportData.afternoon_diet_ate_well));
  }
  const dietScore =
    dietScores.length > 0
      ? Math.round(dietScores.reduce((a, b) => a + b, 0) / dietScores.length)
      : 0;

  const dentalScores = [];
  if (questionnaireBoolAnswered(reportData.dental_hygiene_done)) {
    dentalScores.push(calculateDentalHygieneScore(reportData.dental_hygiene_done));
  }
  if (questionnaireBoolAnswered(reportData.afternoon_dental_hygiene_done)) {
    dentalScores.push(calculateDentalHygieneScore(reportData.afternoon_dental_hygiene_done));
  }
  const dentalScore =
    dentalScores.length > 0
      ? Math.round(dentalScores.reduce((a, b) => a + b, 0) / dentalScores.length)
      : 0;

  const routineScore = calculateRoutineScore(reportData);
  const behaviourScore = calculateBehaviourScore(reportData);

  return {
    medication: medicationScore,
    sleep: sleepScore,
    diet: dietScore,
    dental: dentalScore,
    routine: routineScore,
    behaviour: behaviourScore
  };
};

/**
 * Calculate average scores from multiple reports
 * @param {Array} reports - Array of report data
 * @returns {Object} Object containing average scores
 */
export const calculateAverageScores = (reports) => {
  if (!reports || reports.length === 0) {
    return {
      medication: 0,
      sleep: 0,
      diet: 0,
      dental: 0,
      routine: 0,
      behaviour: 0
    };
  }
  
  const scores = reports.map(report => calculateReportScores(report));
  
  const averages = {
    medication: 0,
    sleep: 0,
    diet: 0,
    dental: 0,
    routine: 0,
    behaviour: 0
  };
  
  // Calculate averages
  Object.keys(averages).forEach(metric => {
    const validScores = scores.map(s => s[metric]).filter(score => score !== null && score !== undefined);
    if (validScores.length > 0) {
      averages[metric] = Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
    }
  });
  
  return averages;
};

/**
 * Calculate trend for a metric over time
 * @param {Array} reports - Array of reports sorted by date
 * @param {string} metric - The metric to calculate trend for
 * @returns {string} 'improving', 'declining', or 'stable'
 */
export const calculateTrend = (reports, metric) => {
  if (!reports || reports.length < 2) return 'stable';
  
  const scores = reports.map(report => {
    const scores = calculateReportScores(report);
    return scores[metric];
  }).filter(score => score !== null && score !== undefined);
  
  if (scores.length < 2) return 'stable';
  
  // Take first half vs second half to determine trend
  const midPoint = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, midPoint);
  const secondHalf = scores.slice(midPoint);
  
  const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
};

/**
 * Format score for display
 * @param {number} score - The score to format
 * @returns {string} Formatted score with percentage
 */
export const formatScore = (score) => {
  return `${score}%`;
};

/**
 * Get score color based on value
 * @param {number} score - The score value
 * @returns {string} Color name for Material-UI
 */
export const getScoreColor = (score) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
};

// ===== NEW SCORING FUNCTIONS FOR AFTERNOON & EVENING SHIFTS =====

/**
 * Calculate overall medication score across all shifts where medication was required
 * @param {string} morningStatus - Morning medication status
 * @param {string} afternoonStatus - Afternoon medication status  
 * @param {string} eveningStatus - Evening medication status
 * @param {boolean} morningReq - Whether medication was required in morning
 * @param {boolean} afternoonReq - Whether medication was required in afternoon
 * @param {boolean} eveningReq - Whether medication was required in evening
 * @returns {number|null} Score as percentage (0-100) or null if no medication required
 */
export const calculateOverallMedicationScore = (morningStatus, afternoonStatus, eveningStatus, morningReq, afternoonReq, eveningReq) => {
  let totalShifts = 0;
  let totalPoints = 0;
  
  if (morningReq) {
    totalShifts++;
    totalPoints += (morningStatus === 'Taken' ? 1 : 0);
  }
  if (afternoonReq) {
    totalShifts++;
    totalPoints += (afternoonStatus === 'Taken' ? 1 : 0);
  }
  if (eveningReq) {
    totalShifts++;
    totalPoints += (eveningStatus === 'Taken' ? 1 : 0);
  }
  
  return totalShifts > 0 ? (totalPoints / totalShifts) * 100 : null;
};

/**
 * Calculate overall dental hygiene score (average of morning and afternoon)
 * @param {boolean} morning - Morning dental hygiene done
 * @param {boolean} afternoon - Afternoon dental hygiene done
 * @returns {number} Score as percentage (0-100)
 */
export const calculateOverallDentalScore = (morning, afternoon) => {
  const morningPt = morning ? 1 : 0;
  const afternoonPt = afternoon ? 1 : 0;
  return ((morningPt + afternoonPt) / 2) * 100;
};

/**
 * Calculate overall routine score (average of morning and afternoon, out of 40 total)
 * @param {Object} morningScores - Morning routine scores
 * @param {Object} afternoonScores - Afternoon routine scores
 * @returns {number} Score as percentage (0-100)
 */
export const calculateOverallRoutineScore = (morningScores, afternoonScores) => {
  const morningTotal = Object.values(morningScores).reduce((a, b) => a + (b || 0), 0);
  const afternoonTotal = Object.values(afternoonScores).reduce((a, b) => a + (b || 0), 0);
  return ((morningTotal + afternoonTotal) / 40) * 100;
};

/**
 * Calculate overall behaviour score (average of morning and afternoon, out of 8 total)
 * @param {Object} morningScores - Morning behaviour scores
 * @param {Object} afternoonScores - Afternoon behaviour scores
 * @returns {number} Score as percentage (0-100)
 */
export const calculateOverallBehaviourScore = (morningScores, afternoonScores) => {
  const morningTotal = Object.values(morningScores).reduce((a, b) => (a + (b ? 1 : 0)), 0);
  const afternoonTotal = Object.values(afternoonScores).reduce((a, b) => (a + (b ? 1 : 0)), 0);
  return ((morningTotal + afternoonTotal) / 8) * 100;
};

/**
 * Calculate shower score
 * @param {boolean} showered - Whether client took a shower
 * @returns {number} Score as percentage (0-100)
 */
export const calculateShowerScore = (showered) => {
  return showered ? 100 : 0;
};

/**
 * Calculate school attendance score
 * @param {boolean} supposedToGo - Whether client was supposed to go to school
 * @param {string} status - School status
 * @returns {number|null} Score as percentage (0-100) or null if not applicable
 */
export const calculateSchoolScore = (supposedToGo, status) => {
  if (supposedToGo == null) return null;
  const st = questionnaireStringAnswered(status) ? String(status).trim() : '';
  if (!supposedToGo) {
    if (st === '') return null;
    return st === 'not enrolled' || st === 'weekend' || st === 'Holiday/No School' ? 100 : null;
  }
  if (st === '') return null;
  return st === 'Absent' ? 0 : 100;
};

/** For summaries: school day counts as present if answered and not Absent (incl. Late, Early Pick Up). */
export const isSchoolPresentStatus = (status) =>
  questionnaireStringAnswered(status) && status !== 'Absent';

/**
 * Calculate health appointments compliance score
 * @param {Array} appointments - Array of appointment objects
 * @returns {number|null} Score as percentage (0-100) or null if no health appointments
 */
export const calculateHealthAppointmentsScore = (appointments) => {
  if (!appointments || appointments.length === 0) return null;
  
  const healthAppts = appointments.filter(a => a.type === 'health');
  if (healthAppts.length === 0) return null;

  const answered = healthAppts.filter((a) => questionnaireStringAnswered(a.compliance));
  if (answered.length === 0) return null;

  const attended = answered.filter((a) => a.compliance === 'attended').length;
  return (attended / answered.length) * 100;
};

/**
 * Calculate social appointments compliance score
 * @param {Array} appointments - Array of appointment objects
 * @returns {number|null} Score as percentage (0-100) or null if no social appointments
 */
export const calculateSocialAppointmentsScore = (appointments) => {
  if (!appointments || appointments.length === 0) return null;
  
  const socialAppts = appointments.filter(a => a.type === 'non-health');
  if (socialAppts.length === 0) return null;

  const answered = socialAppts.filter((a) => questionnaireStringAnswered(a.compliance));
  if (answered.length === 0) return null;

  const attended = answered.filter((a) => a.compliance === 'attended').length;
  return (attended / answered.length) * 100;
};

/**
 * Calculate BIR score (count per day for trending)
 * @param {Object} birData - BIR incident data
 * @returns {number} Number of BIR incidents
 */
export const calculateBIRScore = (birData) => {
  return birData?.hasBIR ? (birData.incidents?.length || 0) : 0;
};

/**
 * Calculate AWOL score (boolean for tracking)
 * @param {boolean} awolIncident - Whether AWOL incident occurred
 * @returns {number} 1 if AWOL occurred, 0 otherwise
 */
export const calculateAWOLScore = (awolData) => {
  // Support both old format (boolean) and new format (array)
  if (Array.isArray(awolData)) {
    return awolData.length > 0 ? awolData.length : 0;
  }
  // Legacy format support
  if (typeof awolData === 'boolean') {
    return awolData ? 1 : 0;
  }
  // Support object format with hasAWOL property
  if (awolData && awolData.hasAWOL) {
    return 1;
  }
  return 0;
};

/**
 * Calculate injury score (boolean for tracking)
 * @param {boolean} injuryOccurred - Whether injury occurred
 * @returns {number} 1 if injury occurred, 0 otherwise
 */
export const calculateInjuryScore = (injuryOccurred) => {
  return injuryOccurred ? 1 : 0;
};

// ===== NEW PROGRESS REPORT SCORING FUNCTIONS =====

/**
 * Calculate overall health score from multiple health metrics
 * @param {Object} report - Daily report data
 * @returns {number} Health score as percentage (0-100)
 */
export const calculateHealthScore = (report) => {
  const scores = [];
  
  // Medication adherence —100% if all shifts "no meds required"; else only required+answered shifts
  if (allMedicationShiftsExplicitlyNotRequired(report)) {
    scores.push(100);
  } else {
    eachApplicableMedicationScore(report, (s) => scores.push(s));
  }
  
  // Sleep score (morning and afternoon)
  if (questionnaireBoolAnswered(report.sleep_woke_on_time)) {
    scores.push(calculateSleepScore(report.sleep_woke_on_time));
  }
  if (questionnaireBoolAnswered(report.afternoon_slept_on_time)) {
    scores.push(calculateSleepScore(report.afternoon_slept_on_time));
  }
  
  // Diet score (morning and afternoon)
  if (questionnaireBoolAnswered(report.diet_ate_well)) {
    scores.push(calculateDietScore(report.diet_ate_well));
  }
  if (questionnaireBoolAnswered(report.afternoon_diet_ate_well)) {
    scores.push(calculateDietScore(report.afternoon_diet_ate_well));
  }
  
  // Dental hygiene (morning and afternoon)
  if (questionnaireBoolAnswered(report.dental_hygiene_done)) {
    scores.push(calculateDentalHygieneScore(report.dental_hygiene_done));
  }
  if (questionnaireBoolAnswered(report.afternoon_dental_hygiene_done)) {
    scores.push(calculateDentalHygieneScore(report.afternoon_dental_hygiene_done));
  }
  
  // Shower score
  if (questionnaireBoolAnswered(report.afternoon_shower_taken)) {
    scores.push(calculateShowerScore(report.afternoon_shower_taken));
  }
  
  // Health appointments compliance
  if (report.appointments && Array.isArray(report.appointments)) {
    const healthAppointments = report.appointments.filter(apt => apt.type === 'health');
    if (healthAppointments.length > 0) {
      const apptScore = calculateHealthAppointmentsScore(healthAppointments);
      if (apptScore != null) {
        scores.push(apptScore);
      }
    }
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
};

/**
 * Period routine % from 1–5 ratings (only answered tasks in that period).
 * @returns {number|null} Percentage or null if nothing answered in that period
 */
const routinePeriodPercent = (values) => {
  const answered = values.filter(routineRatingAnswered);
  if (answered.length === 0) return null;
  const total = answered.reduce((sum, v) => sum + Number(v), 0);
  return (total / (answered.length * 5)) * 100;
};

/**
 * Calculate overall routine score (matches single-day ReportViewer logic:
 * average of morning % and afternoon %, each period scored from its own answered 1–5 tasks).
 * Unanswered periods are omitted from the average (not treated as 0%).
 * @param {Object} report - Daily report data
 * @returns {number} Routine score as percentage (0-100)
 */
export const calculateRoutineScore = (report) => {
  const morningPct = routinePeriodPercent([
    report.routine_made_bed,
    report.routine_put_clothes_away,
    report.routine_cleared_floor,
    report.routine_washed_dishes
  ]);

  const afternoonPct = routinePeriodPercent([
    report.afternoon_routine_made_bed,
    report.afternoon_routine_put_clothes_away,
    report.afternoon_routine_cleared_floor,
    report.afternoon_routine_washed_dishes
  ]);

  const parts = [morningPct, afternoonPct].filter((p) => p != null);
  if (parts.length === 0) return 0;

  return Math.round(parts.reduce((sum, p) => sum + p, 0) / parts.length);
};

/**
 * Calculate overall well-being score from school and social appointments
 * @param {Object} report - Daily report data
 * @returns {number} Well-being score as percentage (0-100)
 */
export const calculateWellBeingScore = (report) => {
  const scores = [];
  
  // School attendance (omit when school block unanswered / incomplete)
  if (questionnaireBoolAnswered(report.afternoon_school_supposed_to_go)) {
    const schoolScore = calculateSchoolScore(
      report.afternoon_school_supposed_to_go,
      report.afternoon_school_status
    );
    if (schoolScore != null) {
      scores.push(schoolScore);
    }
  }
  
  // Social appointments compliance
  if (report.appointments && Array.isArray(report.appointments)) {
    const socialAppointments = report.appointments.filter(apt => apt.type === 'social');
    if (socialAppointments.length > 0) {
      const socialScore = calculateSocialAppointmentsScore(socialAppointments);
      if (socialScore != null) {
        scores.push(socialScore);
      }
    }
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
};

/**
 * Calculate overall behaviour score including inverted BIR/AWOL scores
 * @param {Object} report - Daily report data
 * @returns {number} Behaviour score as percentage (0-100)
 */
export const calculateBehaviourScore = (report) => {
  const scores = [];
  
  // Morning behaviour (omit null / undefined / blank — do not treat as 0%)
  if (questionnaireStringAnswered(report.behaviour_observation)) {
    scores.push(report.behaviour_observation === 'positive' ? 100 : 0);
  }
  if (questionnaireBoolAnswered(report.behaviour_followed_rules)) {
    scores.push(report.behaviour_followed_rules ? 100 : 0);
  }
  if (questionnaireBoolAnswered(report.behaviour_listened)) {
    scores.push(report.behaviour_listened ? 100 : 0);
  }
  if (questionnaireBoolAnswered(report.behaviour_control)) {
    scores.push(report.behaviour_control ? 100 : 0);
  }
  
  // Afternoon behaviour
  if (questionnaireStringAnswered(report.afternoon_behaviour_observation)) {
    scores.push(report.afternoon_behaviour_observation === 'positive' ? 100 : 0);
  }
  if (questionnaireBoolAnswered(report.afternoon_behaviour_followed_rules)) {
    scores.push(report.afternoon_behaviour_followed_rules ? 100 : 0);
  }
  if (questionnaireBoolAnswered(report.afternoon_behaviour_listened)) {
    scores.push(report.afternoon_behaviour_listened ? 100 : 0);
  }
  if (questionnaireBoolAnswered(report.afternoon_behaviour_control)) {
    scores.push(report.afternoon_behaviour_control ? 100 : 0);
  }
  
  // BIR score (inverted - 0 BIRs = 100%, any BIRs = 0%)
  if (report.bir_incidents && report.bir_incidents.hasBIR) {
    scores.push(0); // Any BIR incidents = 0%
  } else {
    scores.push(100); // No BIR incidents = 100%
  }
  
  // AWOL score (inverted - 0 AWOLs = 100%, any AWOLs = 0%)
  // Support both old format (awol_incident) and new format (awol_incidents array)
  const hasAWOL = (report.awol_incidents && Array.isArray(report.awol_incidents) && report.awol_incidents.length > 0) || report.awol_incident;
  if (hasAWOL) {
    scores.push(0); // Any AWOL incidents = 0%
  } else {
    scores.push(100); // No AWOL incidents = 100%
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
};

/**
 * Calculate overall score from all section scores
 * @param {Object} sectionScores - Object containing health, routine, wellbeing, behaviour scores
 * @returns {number} Overall score as percentage (0-100)
 */
export const calculateOverallScore = (sectionScores) => {
  const { health, routine, wellbeing, behaviour } = sectionScores;
  const scores = [health, routine, wellbeing, behaviour].filter(score => score !== undefined);
  
  return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
};

/**
 * Get indicator value based on score
 * @param {number} score - Score as percentage (0-100)
 * @returns {string} Indicator value
 */
export const getIndicatorValue = (score) => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 51) return 'Fair';
  return 'Needs Improvement';
};

/**
 * Invert negative scores (for BIR/AWOL)
 * @param {number} count - Count of incidents
 * @returns {number} Inverted score (0 incidents = 100%, any incidents = 0%)
 */
export const invertNegativeScore = (count) => {
  return count === 0 ? 100 : 0;
};
