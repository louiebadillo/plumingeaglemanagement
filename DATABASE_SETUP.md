# Database Integration Setup Guide

## Overview
This guide will help you transition from localStorage to a proper database system. The application is designed to work seamlessly with both localStorage (development) and database (production).

## Quick Start

### 1. Choose Your Database
- **SQLite** (Recommended for small to medium deployments)
- **PostgreSQL** (Recommended for production)
- **MySQL** (Alternative option)

### 2. Environment Setup
```bash
# Copy the environment template
cp env.example .env

# Edit .env with your database settings
DATABASE_URL=sqlite:./plumingeagle.db
REACT_APP_BACKEND=true
REACT_APP_API_URL=http://localhost:3001/api
```

### 3. Database Schema
Run the SQL scripts from `DATABASE_SCHEMA.md` to create your database structure.

### 4. Data Migration
Use the migration utilities to export your current localStorage data and import it to the database.

## Step-by-Step Setup

### Step 1: Backend API Setup

#### Option A: Node.js/Express Backend
```bash
# Create backend directory
mkdir backend
cd backend

# Initialize project
npm init -y

# Install dependencies
npm install express sqlite3 cors body-parser bcryptjs jsonwebtoken
npm install --save-dev nodemon

# Create server.js
```

#### Option B: Use Existing Backend
If you have an existing backend, ensure it implements the API endpoints listed in `DATABASE_SCHEMA.md`.

### Step 2: Database Connection

#### SQLite Setup
```javascript
// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'plumingeagle.db');
const db = new sqlite3.Database(dbPath);

module.exports = db;
```

#### PostgreSQL Setup
```javascript
// backend/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
```

### Step 3: API Endpoints

Create the following endpoints in your backend:

```javascript
// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    const { clientId, status, dateFrom, dateTo } = req.query;
    let query = 'SELECT * FROM daily_reports WHERE 1=1';
    const params = [];
    
    if (clientId) {
      query += ' AND client_id = ?';
      params.push(clientId);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (dateFrom) {
      query += ' AND date >= ?';
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ' AND date <= ?';
      params.push(dateTo);
    }
    
    query += ' ORDER BY date DESC';
    
    const reports = await db.all(query, params);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reports
router.post('/', async (req, res) => {
  try {
    const {
      client_id, staff_member_id, facility_id, date, shift, status,
      mood_score, behavior_score, sleep_quality_score, appetite_score,
      social_interaction_score, physical_activity_score,
      medication_compliance_score, therapy_engagement_score,
      notes, incidents, medications, goals_progress
    } = req.body;
    
    const query = `
      INSERT INTO daily_reports (
        client_id, staff_member_id, facility_id, date, shift, status,
        mood_score, behavior_score, sleep_quality_score, appetite_score,
        social_interaction_score, physical_activity_score,
        medication_compliance_score, therapy_engagement_score,
        notes, incidents, medications, goals_progress
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      client_id, staff_member_id, facility_id, date, shift, status,
      mood_score, behavior_score, sleep_quality_score, appetite_score,
      social_interaction_score, physical_activity_score,
      medication_compliance_score, therapy_engagement_score,
      notes, incidents, medications, goals_progress
    ];
    
    const result = await db.run(query, params);
    res.json({ id: result.lastID, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 4: Frontend Configuration

Update your frontend to use the new API:

```javascript
// src/config.js
const config = {
  isBackend: process.env.REACT_APP_BACKEND === 'true',
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
};

export default config;
```

### Step 5: Data Migration

#### Export Current Data
```javascript
// In browser console or create a migration page
import { exportLocalStorageData, downloadDataAsJSON } from './src/utils/migration';

const data = exportLocalStorageData();
downloadDataAsJSON(data, 'backup-data.json');
```

#### Import to Database
Use the generated JSON file to populate your database, or use the SQL import scripts.

## Customizing Questionnaire Metrics

### Adding New Metrics

1. **Update Database Schema**
```sql
ALTER TABLE daily_reports ADD COLUMN new_metric_score INTEGER CHECK (new_metric_score >= 1 AND new_metric_score <= 10);
```

2. **Update Data Service Configuration**
```javascript
// src/services/dataService.js
export const QUESTIONNAIRE_METRICS = {
  // ... existing metrics
  newMetric: {
    key: 'newMetric',
    label: 'New Metric',
    description: 'Description of the new metric',
    type: 'scale',
    min: 1,
    max: 10,
    required: true
  }
};
```

3. **Update Backend API**
Add the new field to your INSERT and SELECT queries.

4. **Update Analytics**
The analytics system will automatically pick up new metrics from the data service configuration.

### Modifying Existing Metrics

1. **Update the metric definition** in `QUESTIONNAIRE_METRICS`
2. **Update database schema** if needed (e.g., changing scale from 1-10 to 1-5)
3. **Update backend validation** to match new constraints
4. **Test the changes** in development before deploying

## Testing Database Integration

### 1. Development Testing
```bash
# Start backend server
cd backend
npm start

# Start frontend
cd ..
npm start

# Test API endpoints
curl http://localhost:3001/api/reports
```

### 2. Data Validation
```javascript
// Test data service
import { dataService } from './src/services/dataService';

// Test saving a report
const testReport = {
  clientId: 1,
  date: '2024-01-15',
  questionnaire: {
    mood: 8,
    behavior: 7,
    // ... other metrics
  }
};

const result = await dataService.saveReport(testReport);
console.log('Save result:', result);
```

### 3. Analytics Testing
1. Create several test reports
2. Check that analytics charts update correctly
3. Verify trend calculations work
4. Test export functionality

## Production Deployment

### 1. Environment Variables
```bash
# Production .env
DATABASE_URL=postgresql://user:password@prod-db:5432/plumingeagle
REACT_APP_BACKEND=true
REACT_APP_API_URL=https://your-api-domain.com/api
JWT_SECRET=your-production-secret-key
```

### 2. Database Security
- Use connection pooling
- Implement proper authentication
- Set up SSL/TLS for database connections
- Regular backups

### 3. Performance Optimization
- Add database indexes
- Implement caching for analytics
- Use pagination for large datasets
- Optimize queries

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend allows frontend domain
   - Check API URL configuration

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database server is running
   - Verify credentials

3. **Data Migration Issues**
   - Validate data structure before import
   - Check for duplicate IDs
   - Verify foreign key constraints

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check data service status
console.log('Data service backend mode:', dataService.isBackend);
```

## Support

For issues or questions:
1. Check the console for error messages
2. Verify environment configuration
3. Test API endpoints directly
4. Check database connectivity
5. Review the migration logs

The system is designed to be flexible and handle the transition from localStorage to database seamlessly. The data service layer abstracts the storage mechanism, making it easy to switch between development and production environments.
