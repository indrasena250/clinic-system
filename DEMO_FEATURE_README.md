# Clinic Management System - Demo Feature

## Overview
The Clinic Management System now includes a comprehensive demo feature that allows users to try the full application without registration.

## Demo Features

### 🚀 Live Demo Access
- Click "Try Live Demo" on the homepage
- Instant access to the dashboard without login
- Full admin privileges for exploration

### ⏰ Time-Limited Sessions
- 8-hour demo period
- Real-time countdown display
- Automatic session expiration

### 🗑️ Automatic Data Cleanup
- All demo-created data is tracked
- Data automatically deleted when demo expires
- No leftover data in production system

### 👥 Isolated Sessions
- Each demo user gets unique session
- Data completely isolated between users
- No interference between concurrent demos

### 📊 Demo Status Tracking
- Visual indicator showing demo mode
- Time remaining display
- Clear expiration warnings

## Technical Implementation

### Backend Components
- `demo_sessions` table: Tracks demo sessions
- `demo_data_tracking` table: Tracks created data
- Demo controller with session management
- Automatic cleanup mechanisms

### Frontend Components
- DemoStatus component: Shows demo status
- Modified Home page: Demo access button
- Auth context integration

### Security Features
- Session-based authentication
- IP address tracking
- Data isolation by session ID
- Automatic cleanup on expiration

## Database Schema

```sql
-- Demo sessions table
CREATE TABLE demo_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    data_deleted BOOLEAN DEFAULT FALSE
);

-- Demo data tracking
CREATE TABLE demo_data_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `POST /api/demo/create` - Create new demo session
- `GET /api/demo/info` - Get demo session info

## Usage Instructions

1. Visit the homepage
2. Click "Try Live Demo"
3. Explore all features for 8 hours
4. Data automatically cleans up after expiration

## Maintenance

Run the cleanup script periodically:
```bash
node scripts/cleanupDemos.js
```

This ensures expired demo sessions and their data are properly cleaned up.