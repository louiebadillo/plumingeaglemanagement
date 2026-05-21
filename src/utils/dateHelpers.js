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
 * Normalize a calendar date from DB/API/form to YYYY-MM-DD (no timezone shift).
 * @param {string|Date|null|undefined} value
 * @returns {string} YYYY-MM-DD or empty string
 */
export const normalizeDateOnly = (value) => {
  if (value == null || value === '') return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return formatDateLocal(value);
  }
  const str = String(value).trim();
  if (!str) return '';
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
};

/**
 * Format a calendar date for display (local calendar, not UTC midnight).
 * @param {string|Date|null|undefined} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export const formatDateOnly = (value, options = {}) => {
  if (!value) return 'N/A';
  const date = parseDateOfBirthLocal(value);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  });
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
  const reportDateObj = parseDateOfBirthLocal(reportDate);
  const operationalDateObj = parseDateOfBirthLocal(operationalDate);
  if (!reportDateObj || !operationalDateObj) return false;

  // Report is locked if it's from a date before the current operational date
  return reportDateObj < operationalDateObj;
};

/**
 * Parse a date-of-birth value as local calendar date.
 * `new Date('YYYY-MM-DD')` is UTC midnight, which shifts the day in western timezones
 * and breaks age vs. birthday comparisons — use year/month/day in local time instead.
 * @param {string|Date|null|undefined} dateOfBirth
 * @returns {Date|null}
 */
export const parseDateOfBirthLocal = (dateOfBirth) => {
  if (dateOfBirth == null || dateOfBirth === '') return null;
  if (dateOfBirth instanceof Date) {
    if (Number.isNaN(dateOfBirth.getTime())) return null;
    return new Date(
      dateOfBirth.getFullYear(),
      dateOfBirth.getMonth(),
      dateOfBirth.getDate()
    );
  }
  const str = String(dateOfBirth).trim();
  const datePart = str.split('T')[0];
  const parts = datePart.split('-').map(Number);
  if (parts.length < 3) return null;
  const [y, m, d] = parts;
  if ([y, m, d].some((n) => Number.isNaN(n))) return null;
  const birthDate = new Date(y, m - 1, d);
  if (Number.isNaN(birthDate.getTime())) return null;
  return birthDate;
};

/**
 * Calculate age from date of birth (completed full years, local calendar).
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number|string} Age in years or 'N/A' if invalid
 */
export const calculateAge = (dateOfBirth) => {
  const birthDate = parseDateOfBirthLocal(dateOfBirth);
  if (!birthDate) return 'N/A';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

