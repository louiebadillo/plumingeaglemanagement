// Report scoring utilities for daily reports analytics
// Calculates various metrics from daily report data

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
  const {
    medication_status,
    sleep_woke_on_time,
    diet_ate_well,
    dental_hygiene_done,
    routine_made_bed,
    routine_put_clothes_away,
    routine_cleared_floor,
    routine_washed_dishes,
    behaviour_observation,
    behaviour_followed_rules,
    behaviour_listened,
    behaviour_control
  } = reportData;
  
  const medicationScore = calculateMedicationAdherence(medication_status);
  const sleepScore = calculateSleepScore(sleep_woke_on_time);
  const dietScore = calculateDietScore(diet_ate_well);
  const dentalScore = calculateDentalHygieneScore(dental_hygiene_done);
  
  const routineScore = calculateRoutineScore({
    madeBed: routine_made_bed,
    putClothesAway: routine_put_clothes_away,
    clearedFloor: routine_cleared_floor,
    washedDishes: routine_washed_dishes
  });
  
  const behaviourScore = calculateBehaviourScore({
    observation: behaviour_observation,
    followedRules: behaviour_followed_rules,
    listened: behaviour_listened,
    control: behaviour_control
  });
  
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
  if (!supposedToGo) {
    // Not enrolled, weekend, holiday
    return status === 'not enrolled' || status === 'weekend' || status === 'Holiday/No School' ? 100 : null;
  }
  // Attended, Late, Early Pick Up = 100%, Absent = 0%
  return status === 'Absent' ? 0 : 100;
};

/**
 * Calculate health appointments compliance score
 * @param {Array} appointments - Array of appointment objects
 * @returns {number|null} Score as percentage (0-100) or null if no health appointments
 */
export const calculateHealthAppointmentsScore = (appointments) => {
  if (!appointments || appointments.length === 0) return null;
  
  const healthAppts = appointments.filter(a => a.type === 'health');
  if (healthAppts.length === 0) return null;
  
  const attended = healthAppts.filter(a => a.compliance === 'attended').length;
  return (attended / healthAppts.length) * 100;
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
  
  const attended = socialAppts.filter(a => a.compliance === 'attended').length;
  return (attended / socialAppts.length) * 100;
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
  
  // Medication adherence (morning, afternoon, evening)
  if (report.medication_status) {
    scores.push(calculateMedicationAdherence(report.medication_status));
  }
  if (report.afternoon_medication_status) {
    scores.push(calculateMedicationAdherence(report.afternoon_medication_status));
  }
  if (report.evening_medication_status) {
    scores.push(calculateMedicationAdherence(report.evening_medication_status));
  }
  
  // Sleep score (morning and afternoon)
  if (report.sleep_woke_on_time !== undefined) {
    scores.push(calculateSleepScore(report.sleep_woke_on_time));
  }
  if (report.afternoon_slept_on_time !== undefined) {
    scores.push(calculateSleepScore(report.afternoon_slept_on_time));
  }
  
  // Diet score (morning and afternoon)
  if (report.diet_ate_well !== undefined) {
    scores.push(calculateDietScore(report.diet_ate_well));
  }
  if (report.afternoon_diet_ate_well !== undefined) {
    scores.push(calculateDietScore(report.afternoon_diet_ate_well));
  }
  
  // Dental hygiene (morning and afternoon)
  if (report.dental_hygiene_done !== undefined) {
    scores.push(calculateDentalHygieneScore(report.dental_hygiene_done));
  }
  if (report.afternoon_dental_hygiene_done !== undefined) {
    scores.push(calculateDentalHygieneScore(report.afternoon_dental_hygiene_done));
  }
  
  // Shower score
  if (report.afternoon_shower_taken !== undefined) {
    scores.push(calculateShowerScore(report.afternoon_shower_taken));
  }
  
  // Health appointments compliance
  if (report.appointments && Array.isArray(report.appointments)) {
    const healthAppointments = report.appointments.filter(apt => apt.type === 'health');
    if (healthAppointments.length > 0) {
      scores.push(calculateHealthAppointmentsScore(healthAppointments));
    }
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
};

/**
 * Calculate overall routine score from all routine tasks
 * @param {Object} report - Daily report data
 * @returns {number} Routine score as percentage (0-100)
 */
export const calculateRoutineScore = (report) => {
  const morningRoutine = [
    report.routine_made_bed || 0,
    report.routine_put_clothes_away || 0,
    report.routine_cleared_floor || 0,
    report.routine_washed_dishes || 0
  ];
  
  const afternoonRoutine = [
    report.afternoon_routine_made_bed || 0,
    report.afternoon_routine_put_clothes_away || 0,
    report.afternoon_routine_cleared_floor || 0,
    report.afternoon_routine_washed_dishes || 0
  ];
  
  const allRoutine = [...morningRoutine, ...afternoonRoutine];
  const totalPoints = allRoutine.reduce((sum, score) => sum + score, 0);
  const maxPoints = allRoutine.length * 5; // Each task is 1-5 scale
  
  return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
};

/**
 * Calculate overall well-being score from school and social appointments
 * @param {Object} report - Daily report data
 * @returns {number} Well-being score as percentage (0-100)
 */
export const calculateWellBeingScore = (report) => {
  const scores = [];
  
  // School attendance
  if (report.afternoon_school_supposed_to_go !== undefined) {
    scores.push(calculateSchoolScore(report.afternoon_school_supposed_to_go, report.afternoon_school_status));
  }
  
  // Social appointments compliance
  if (report.appointments && Array.isArray(report.appointments)) {
    const socialAppointments = report.appointments.filter(apt => apt.type === 'social');
    if (socialAppointments.length > 0) {
      scores.push(calculateSocialAppointmentsScore(socialAppointments));
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
  
  // Morning behaviour
  if (report.behaviour_observation) {
    scores.push(report.behaviour_observation === 'positive' ? 100 : 0);
  }
  if (report.behaviour_followed_rules !== undefined) {
    scores.push(report.behaviour_followed_rules ? 100 : 0);
  }
  if (report.behaviour_listened !== undefined) {
    scores.push(report.behaviour_listened ? 100 : 0);
  }
  if (report.behaviour_control !== undefined) {
    scores.push(report.behaviour_control ? 100 : 0);
  }
  
  // Afternoon behaviour
  if (report.afternoon_behaviour_observation) {
    scores.push(report.afternoon_behaviour_observation === 'positive' ? 100 : 0);
  }
  if (report.afternoon_behaviour_followed_rules !== undefined) {
    scores.push(report.afternoon_behaviour_followed_rules ? 100 : 0);
  }
  if (report.afternoon_behaviour_listened !== undefined) {
    scores.push(report.afternoon_behaviour_listened ? 100 : 0);
  }
  if (report.afternoon_behaviour_control !== undefined) {
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
