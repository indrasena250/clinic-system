const db = require("../config/db");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const formatIstDateTime = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? dayjs(value) : dayjs(String(value));
  return parsed.isValid() ? parsed.tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm:ssZ") : null;
};

// Demo duration in hours
const DEMO_DURATION_HOURS = 8; // 8 hours as a middle ground between 5-10

// Generate a unique session ID
const generateSessionId = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Create a demo session (supports both authenticated users and guest demo)
exports.createDemoSession = async (req, res) => {
    try {
        let email;

        // If user is authenticated, use their email
        if (req.user) {
            email = req.user.email || req.user.username;
        } else {
            // For guest demo, email is required in request body
            email = req.body.email;
            if (!email) {
                return res.status(400).json({
                    message: 'Email is required for demo access'
                });
            }
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        // Check for existing active demo session for this user
        const [existingSessions] = await db.query(
            `SELECT * FROM demo_sessions WHERE email = ? AND is_active = TRUE AND expires_at > NOW()`,
            [email]
        );

        if (existingSessions.length > 0) {
            const session = existingSessions[0];

            // Get clinic info
            const [clinicRows] = await db.query('SELECT * FROM clinics WHERE id = ?', [session.clinic_id]);
            
            if (!clinicRows || clinicRows.length === 0) {
                return res.status(500).json({
                    message: 'Demo clinic not found'
                });
            }

            const clinic = clinicRows[0];

            const demoUser = {
                id: `demo_${session.session_id}`,
                full_name: 'Demo User',
                username: 'demo_user',
                role: 'admin',
                clinic_id: session.clinic_id,
                clinic_name: clinic.name,
                is_demo: true,
                session_id: session.session_id
            };

            const token = generateToken(demoUser);

            return res.json({
                token,
                user: demoUser,
                expires_at: session.expires_at,
                message: `Continuing your demo session. Time remaining: ${Math.floor((new Date(session.expires_at) - new Date()) / (1000 * 60 * 60))} hours.`
            });
        }

        // Check if user has an EXPIRED demo session
        const [expiredSessions] = await db.query(
            `SELECT * FROM demo_sessions WHERE email = ? AND is_active = TRUE AND expires_at < NOW()`,
            [email]
        );

        if (expiredSessions.length > 0) {
            return res.status(403).json({
                message: 'Your free limit is over. Kindly contact admin for registration.',
                expired: true,
                demo_expired: true
            });
        }

        // Generate session ID
        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + DEMO_DURATION_HOURS * 60 * 60 * 1000);

        const connection = await db.getConnection();
        // Ensure timezone is set to IST before any queries
        await db.ensureTimezone(connection);
        await connection.beginTransaction();

        try {
            // Insert demo session with both created_at and expires_at explicitly converted to IST
            await connection.query(
                `INSERT INTO demo_sessions (session_id, email, ip_address, user_agent, created_at, expires_at)
                 VALUES (?, ?, ?, ?, CONVERT_TZ(NOW(), '+00:00', '+05:30'), CONVERT_TZ(DATE_ADD(NOW(), INTERVAL ? HOUR), '+00:00', '+05:30'))`,
                [sessionId, email, ipAddress, userAgent, DEMO_DURATION_HOURS]
            );

            // Create a demo clinic for this session
            // Extract email name (before @) for clinic name
            const emailName = email.split('@')[0];
            const demoClinicName = emailName;
            const [clinicResult] = await connection.query(
                `INSERT INTO clinics (name, address, phone, created_at)
                 VALUES (?, ?, ?, CONVERT_TZ(NOW(), '+00:00', '+05:30'))`,
                [demoClinicName, 'Demo Address', 'Demo Phone']
            );
            const demoClinicId = clinicResult.insertId;

            // Update demo session with clinic_id
            await connection.query(
                `UPDATE demo_sessions SET clinic_id = ? WHERE session_id = ?`,
                [demoClinicId, sessionId]
            );

            // Track the demo clinic creation
            await connection.query(
                `INSERT INTO demo_data_tracking (session_id, table_name, record_id, email, created_at)
                 VALUES (?, ?, ?, ?, CONVERT_TZ(NOW(), '+00:00', '+05:30'))`,
                [sessionId, 'clinics', demoClinicId, email]
            );

            await connection.commit();

            // Get the actual stored timestamps from database
            const [sessionRows] = await connection.query(
                'SELECT expires_at FROM demo_sessions WHERE session_id = ?',
                [sessionId]
            );
            const storedExpiresAt = sessionRows[0].expires_at;

            // Create a demo user object
            const demoUser = {
                id: `demo_${sessionId}`,
                full_name: 'Demo User',
                username: 'demo_user',
                role: 'admin', // Give full access for demo
                clinic_id: demoClinicId,
                clinic_name: demoClinicName,
                is_demo: true,
                session_id: sessionId
            };

            // Generate token for demo user
            const token = generateToken(demoUser);

            res.json({
                token,
                user: demoUser,
                expires_at: storedExpiresAt,
                message: `Demo session created. You have ${DEMO_DURATION_HOURS} hours to explore.`
            });
        } catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }

        return;

    } catch (error) {
        res.status(500).json({
            message: 'Failed to create demo session'
        });
    }
};

// Check if demo session is valid
exports.validateDemoSession = async (req, res, next) => {
    try {
        const sessionId = req.user.session_id;

        if (!sessionId || !req.user.is_demo) {
            return next(); // Not a demo user, continue with normal flow
        }

        const [rows] = await db.query(
            `SELECT * FROM demo_sessions WHERE session_id = ? AND is_active = TRUE`,
            [sessionId]
        );

        if (rows.length === 0) {
            return res.status(403).json({
                message: 'Demo session not found or expired'
            });
        }

        const session = rows[0];

        if (new Date(session.expires_at) < new Date()) {
            // Mark session as inactive
            await db.query(
                `UPDATE demo_sessions SET is_active = FALSE WHERE session_id = ?`,
                [sessionId]
            );

            // Trigger data cleanup
            await cleanupDemoData(sessionId);

            return res.status(403).json({
                message: 'Your demo session has expired. Contact admin for full access.',
                expired: true
            });
        }

        req.demo_session = session;
        next();

    } catch (error) {
        res.status(500).json({
            message: 'Demo validation failed'
        });
    }
};

// Track data created during demo
exports.trackDemoData = async (tableName, recordId, sessionId, email) => {
    try {
        // Get email from session if not provided
        let emailToTrack = email;
        if (!emailToTrack) {
            const [sessionRows] = await db.query(
                `SELECT email FROM demo_sessions WHERE session_id = ?`,
                [sessionId]
            );
            if (sessionRows.length > 0) {
                emailToTrack = sessionRows[0].email;
            }
        }

        // Try to get the created_at time from the actual record
        let createdAt = null;
        try {
            const [rows] = await db.query(
                `SELECT created_at FROM ?? WHERE id = ? LIMIT 1`,
                [tableName, recordId]
            );
            if (rows.length > 0 && rows[0].created_at) {
                createdAt = rows[0].created_at;
            }
        } catch (err) {
            // Fallback if table doesn't have created_at
        }

        // Insert tracking record with email and actual creation time
        if (createdAt) {
            await db.query(
                `INSERT INTO demo_data_tracking (session_id, table_name, record_id, email, created_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [sessionId, tableName, recordId, emailToTrack, createdAt]
            );
        } else {
            await db.query(
                `INSERT INTO demo_data_tracking (session_id, table_name, record_id, email, created_at)
                 VALUES (?, ?, ?, ?, CONVERT_TZ(NOW(), '+00:00', '+05:30'))`,
                [sessionId, tableName, recordId, emailToTrack]
            );
        }
    } catch (error) {
        console.error('Error tracking demo data:', error);
    }
};

// Track demo user activity (for downloads, settlements, etc.)
// Uses the same demo_data_tracking table for unified tracking
exports.trackDemoActivity = async (sessionId, email, activity_type, activity_details, recordId = null, tableName = null) => {
    try {
        // Get email from session if not provided
        let emailToTrack = email;
        if (!emailToTrack) {
            const [sessionRows] = await db.query(
                `SELECT email FROM demo_sessions WHERE session_id = ?`,
                [sessionId]
            );
            if (sessionRows.length > 0) {
                emailToTrack = sessionRows[0].email;
            }
        }

        // Use demo_data_tracking table to store activity details
        // Store activity_type as table_name, activity_details as a note
        const detailsJson = JSON.stringify(activity_details);
        
        await db.query(
            `INSERT INTO demo_data_tracking (session_id, table_name, record_id, email, created_at, notes, activity_type)
             VALUES (?, ?, ?, ?, CONVERT_TZ(NOW(), '+00:00', '+05:30'), ?, ?)`,
            [sessionId, tableName || activity_type, recordId, emailToTrack, detailsJson, activity_type]
        );
    } catch (error) {
        console.error('Error tracking demo activity:', error);
    }
};

// Clean up demo data when session expires
// NOTE: Demo tracking data is kept permanently to track who used the demo
const cleanupDemoData = async (sessionId) => {
    try {
        // Get all tracked data for this session
        const [trackingRows] = await db.query(
            `SELECT table_name, record_id FROM demo_data_tracking WHERE session_id = ?`,
            [sessionId]
        );

        // Delete data from each table
        for (const row of trackingRows) {
            try {
                // Use dynamic table name - be careful with SQL injection
                const allowedTables = [
                    'patients', 'ct_scans', 'ultrasound_scans',
                    'doctor_referrals', 'settlements', 'daily_expenses',
                    'extra_income', 'users', 'clinics' // Include clinics for demo cleanup
                ];

                if (allowedTables.includes(row.table_name)) {
                    await db.query(
                        `DELETE FROM ?? WHERE id = ?`,
                        [row.table_name, row.record_id]
                    );
                }
            } catch (deleteError) {
                // Silent error handling
            }
        }

        // Mark data as deleted
        await db.query(
            `UPDATE demo_sessions SET data_deleted = TRUE WHERE session_id = ?`,
            [sessionId]
        );

        // IMPORTANT: DO NOT DELETE demo_data_tracking records
        // Keep them permanently to track who used the demo system
        // This allows admin to see all demo trial users even after expiration

    } catch (error) {
        // Silent error handling
    }
};

// Get demo session info
exports.getDemoInfo = async (req, res) => {
    try {
        const sessionId = req.user.session_id;

        if (!sessionId || !req.user.is_demo) {
            return res.status(400).json({
                message: 'Not a demo session'
            });
        }

        const [rows] = await db.query(
            `SELECT session_id, created_at, expires_at, is_active
             FROM demo_sessions WHERE session_id = ?`,
            [sessionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Demo session not found'
            });
        }

        const session = rows[0];
        const now = dayjs().tz("Asia/Kolkata");
        const expiresAt = formatIstDateTime(session.expires_at)
          ? dayjs.tz(String(session.expires_at), "Asia/Kolkata")
          : null;
        const timeLeft = expiresAt ? Math.max(0, expiresAt.valueOf() - now.valueOf()) : 0;

        const responseData = {
            session_id: session.session_id,
            created_at: formatIstDateTime(session.created_at),
            expires_at: formatIstDateTime(session.expires_at),
            time_left_hours: Math.floor(timeLeft / (1000 * 60 * 60)),
            time_left_minutes: Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
            is_active: session.is_active
        };

        res.json(responseData);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to get demo info'
        });
    }
};

// Periodic cleanup job (can be called by a cron job)
exports.cleanupExpiredDemos = async () => {
    try {
        const [expiredSessions] = await db.query(
            `SELECT session_id FROM demo_sessions
             WHERE expires_at < NOW() AND is_active = TRUE AND data_deleted = FALSE`
        );

        for (const session of expiredSessions) {
            await cleanupDemoData(session.session_id);
            await db.query(
                `UPDATE demo_sessions SET is_active = FALSE WHERE session_id = ?`,
                [session.session_id]
            );
        }

    } catch (error) {
        // Silent error handling
    }
};

// Get list of emails from demo users
exports.getDemoEmails = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT DISTINCT email FROM demo_sessions WHERE email IS NOT NULL ORDER BY created_at DESC`
        );

        res.json({
            emails: rows.map(row => row.email),
            count: rows.length
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to get demo emails'
        });
    }
};