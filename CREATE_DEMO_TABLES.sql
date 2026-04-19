-- Create demo_sessions table to track demo users
CREATE TABLE IF NOT EXISTS demo_sessions (
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

-- Create demo_data_tracking table to track what data was created during demo
CREATE TABLE IF NOT EXISTS demo_data_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES demo_sessions(session_id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX idx_demo_sessions_session_id ON demo_sessions(session_id);
CREATE INDEX idx_demo_sessions_expires_at ON demo_sessions(expires_at);
CREATE INDEX idx_demo_data_tracking_session_id ON demo_data_tracking(session_id);