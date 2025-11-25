/**
 * Format a date to YYYY-MM-DD using local time (not UTC)
 * This prevents timezone issues when converting dates
 * @param {Date} date - Date object to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateLocal = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get the current operational date based on 6am-6am logic
 * If current time < 6:00 AM: operational date = yesterday
 * If current time >= 6:00 AM: operational date = today
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getOperationalDate = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const operationalDate = new Date(now);
  
  // If before 6 AM, use yesterday's date
  if (currentHour < 6) {
    operationalDate.setDate(operationalDate.getDate() - 1);
  }
  
  // Use local date formatting to avoid timezone issues
  return formatDateLocal(operationalDate);
};

/**
 * Check if a report is locked based on 6:00 AM next day cutoff
 * Reports are locked if:
 * - Current time >= 6:00 AM AND report_date < current operational date
 * This means reports from previous operational dates are locked after 6 AM
 * @param {string} reportDate - Date string in YYYY-MM-DD format
 * @returns {boolean} True if report is locked
 */
export const isReportLocked = (reportDate) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // Total minutes since midnight
  const cutoffTime = 6 * 60; // 6:00 AM in minutes
  
  // If before 6:00 AM, reports are never locked
  if (currentTime < cutoffTime) {
    return false;
  }
  
  // After 6:00 AM, check if report date is before current operational date
  const operationalDate = getOperationalDate();
  const reportDateObj = new Date(reportDate);
  const operationalDateObj = new Date(operationalDate);
  
  // Report is locked if it's from a date before the current operational date
  return reportDateObj < operationalDateObj;
};

/**
 * Calculate age from date of birth
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number|string} Age in years or 'N/A' if invalid
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'N/A';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

