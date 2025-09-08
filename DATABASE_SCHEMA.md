# Database Schema Documentation

## Overview
This document outlines the database schema for the Healthcare Management System. The schema is designed to be flexible and easily extensible for future requirements.

## Tables

### 1. clients
Stores client/patient information.

```sql
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    secondary_emergency_contact_name VARCHAR(100),
    secondary_emergency_contact_phone VARCHAR(20),
    secondary_emergency_contact_relationship VARCHAR(50),
    dietary_restrictions TEXT,
    activity_preferences TEXT,
    other_preferences TEXT,
    medical_notes TEXT,
    profile_photo_url VARCHAR(255),
    facility_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(id)
);
```

### 2. facilities
Stores facility information.

```sql
CREATE TABLE facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. users
Stores staff/user information.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
    phone VARCHAR(20),
    profile_photo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. daily_reports
Stores daily reports with questionnaire data.

```sql
CREATE TABLE daily_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    staff_member_id INTEGER NOT NULL,
    facility_id INTEGER NOT NULL,
    date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL,
    status ENUM('incomplete', 'complete', 'submitted') DEFAULT 'incomplete',
    
    -- Questionnaire scores (1-10 scale)
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    behavior_score INTEGER CHECK (behavior_score >= 1 AND behavior_score <= 10),
    sleep_quality_score INTEGER CHECK (sleep_quality_score >= 1 AND sleep_quality_score <= 10),
    appetite_score INTEGER CHECK (appetite_score >= 1 AND appetite_score <= 10),
    social_interaction_score INTEGER CHECK (social_interaction_score >= 1 AND social_interaction_score <= 10),
    physical_activity_score INTEGER CHECK (physical_activity_score >= 1 AND physical_activity_score <= 10),
    medication_compliance_score INTEGER CHECK (medication_compliance_score >= 1 AND medication_compliance_score <= 10),
    therapy_engagement_score INTEGER CHECK (therapy_engagement_score >= 1 AND therapy_engagement_score <= 10),
    
    -- Additional fields
    notes TEXT,
    incidents TEXT,
    medications TEXT,
    goals_progress TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_saved DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (staff_member_id) REFERENCES users(id),
    FOREIGN KEY (facility_id) REFERENCES facilities(id)
);
```

### 5. announcements
Stores admin announcements.

```sql
CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('general', 'urgent', 'info') DEFAULT 'general',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    author_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    
    FOREIGN KEY (author_id) REFERENCES users(id)
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_daily_reports_client_date ON daily_reports(client_id, date);
CREATE INDEX idx_daily_reports_staff_date ON daily_reports(staff_member_id, date);
CREATE INDEX idx_daily_reports_status ON daily_reports(status);
CREATE INDEX idx_clients_facility ON clients(facility_id);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_users_email ON users(email);
```

## Views

### 1. client_analytics_view
Aggregated view for client analytics.

```sql
CREATE VIEW client_analytics_view AS
SELECT 
    c.id as client_id,
    c.first_name,
    c.last_name,
    dr.date,
    AVG(dr.mood_score) as avg_mood,
    AVG(dr.behavior_score) as avg_behavior,
    AVG(dr.sleep_quality_score) as avg_sleep_quality,
    AVG(dr.appetite_score) as avg_appetite,
    AVG(dr.social_interaction_score) as avg_social_interaction,
    AVG(dr.physical_activity_score) as avg_physical_activity,
    AVG(dr.medication_compliance_score) as avg_medication_compliance,
    AVG(dr.therapy_engagement_score) as avg_therapy_engagement,
    COUNT(*) as report_count
FROM clients c
LEFT JOIN daily_reports dr ON c.id = dr.client_id
WHERE dr.status = 'submitted'
GROUP BY c.id, dr.date;
```

## API Endpoints

### Reports
- `GET /api/reports` - Get all reports with optional filters
- `GET /api/reports/client/:clientId` - Get reports for specific client
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update existing report
- `DELETE /api/reports/:id` - Delete report

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get specific client
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Analytics
- `GET /api/analytics/client/:clientId` - Get analytics data for client
- `GET /api/analytics/client/:clientId/metrics` - Get specific metrics
- `GET /api/analytics/client/:clientId/trends` - Get trend analysis

## Migration Notes

### From localStorage to Database
1. Export existing localStorage data
2. Run migration scripts to import data
3. Update frontend to use new API endpoints
4. Test data integrity

### Adding New Metrics
1. Add new columns to `daily_reports` table
2. Update `QUESTIONNAIRE_METRICS` in `dataService.js`
3. Update frontend forms
4. Update analytics views

## Environment Variables

```env
# Database
DATABASE_URL=sqlite:./plumingeagle.db
# or for PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/plumingeagle

# API
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_BACKEND=true

# Security
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=12
```

## Future Considerations

1. **Audit Trail**: Add audit tables for tracking changes
2. **File Storage**: Consider cloud storage for profile photos
3. **Backup Strategy**: Implement automated backups
4. **Performance**: Add caching layer for analytics
5. **Security**: Implement row-level security for multi-tenant support
