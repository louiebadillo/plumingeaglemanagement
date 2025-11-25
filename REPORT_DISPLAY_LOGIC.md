# Report Display Logic for Employees

## Overview
This document explains how reports are displayed for employees in the Dashboard and "My Reports" page.

## Operational Date Logic

The system uses a **6 AM - 6 AM operational day** concept:

- **If current time < 6:00 AM**: Operational date = **yesterday**
- **If current time >= 6:00 AM**: Operational date = **today**

**Example:**
- If it's 5:30 AM on November 20, 2025 → Operational date = November 19, 2025
- If it's 6:00 AM on November 20, 2025 → Operational date = November 20, 2025
- If it's 11:59 PM on November 20, 2025 → Operational date = November 20, 2025
- If it's 1:00 AM on November 21, 2025 → Operational date = November 20, 2025 (still the same operational day until 6 AM)

## Employee Dashboard Logic

**Location:** `src/pages/dashboard/Dashboard.js`

### What Employees See:

1. **Section 2: Client List**
   - Shows **active clients** in their **geofenced facility**
   - Each client shows their report status for **today's operational date**:
     - **"Not Started"** - No report exists for the operational date
     - **"In Progress"** - Draft report exists for the operational date
     - **"Submitted"** - Submitted report exists for the operational date

2. **Report Fetching:**
   ```javascript
   // Line 174: Fetches reports for operational date
   report_date=eq.${operationalDate}&client_id=eq.${clientId}
   ```
   - Only fetches reports matching the **operational date**
   - Filters out `null_report` entries
   - Prioritizes draft reports over submitted reports

3. **Section 3: Previous Day Reports**
   - Shows **submitted reports** from the **previous operational day**
   - Only shows submitted reports (not drafts)
   - This is for viewing history, not editing

### Key Points:
- ✅ Reports shown are for the **operational date** (6 AM - 6 AM logic)
- ✅ **NOT** based on employee's current shift time
- ✅ Employees see clients in their **geofenced facility** only
- ✅ Only shows reports for **today's operational date**

## My Reports Page Logic

**Location:** `src/pages/reports/MyReports.js`

### What Employees See:

1. **In-Progress Reports Table**
   - Shows **draft reports** (status = 'draft')
   - Filters by:
     - **Facility ID** (geofenced facility)
     - **Operational Date** (today's operational date)
     - **Client's Facility ID** (double-check)

2. **Report Fetching:**
   ```javascript
   // Line 105: Employee query
   status=eq.draft&facility_id=eq.${currentFacilityId}&report_date=eq.${operationalDate}
   ```
   - Only fetches draft reports
   - Only for the geofenced facility
   - Only for the operational date

3. **Additional Filtering:**
   ```javascript
   // Lines 128-135: JavaScript filter
   - Filters by client's facility_id
   - Ensures report_date matches operational date
   ```

### Key Points:
- ✅ Shows **draft reports** only (in-progress)
- ✅ Only for **operational date** (6 AM - 6 AM logic)
- ✅ Only for clients in their **geofenced facility**
- ✅ **NOT** based on employee's current shift time
- ✅ Does **NOT** show past draft reports

## Summary

### Operational Date vs. Shift Time

**Important:** The reports shown are based on the **operational date** (6 AM - 6 AM), **NOT** the employee's current shift time.

**Operational Date Examples:**
- **Morning Shift (6 AM - 2 PM)**: Operational date = today
- **Afternoon Shift (2 PM - 10 PM)**: Operational date = today
- **Evening Shift (10 PM - 6 AM)**: 
  - Before midnight: Operational date = today
  - After midnight (1 AM - 5:59 AM): Operational date = yesterday (still the same operational day)

### What This Means:

1. **All employees working during the same operational day (6 AM - 6 AM) see the same reports**
2. **The operational date doesn't change based on shift start time**
3. **A report created at 2 PM and a report created at 10 PM on the same calendar day are both for the same operational date**
4. **After 6 AM the next day, a new operational date starts, and employees see a fresh list**

### Example Timeline:

**November 20, 2025:**
- 6:00 AM - Operational date = Nov 20
- 2:00 PM - Operational date = Nov 20 (afternoon shift starts)
- 10:00 PM - Operational date = Nov 20 (evening shift starts)
- 11:59 PM - Operational date = Nov 20

**November 21, 2025:**
- 1:00 AM - Operational date = Nov 20 (still same operational day)
- 5:59 AM - Operational date = Nov 20 (still same operational day)
- 6:00 AM - Operational date = Nov 21 (new operational day starts)

All employees working between 6 AM Nov 20 and 6 AM Nov 21 will see reports for the operational date of **November 20, 2025**.

