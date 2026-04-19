const bcrypt = require("bcrypt");
const db = require("../config/db");
const generateToken = require("../utils/generateToken");

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const [rows] = await db.query(
            `SELECT u.*, c.name AS clinic_name 
             FROM users u 
             LEFT JOIN clinics c ON u.clinic_id = c.id 
             WHERE u.username = ? AND u.is_active = TRUE`,
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const user = rows[0];

        /* =========================
           CHECK ACCOUNT LOCK
        ========================== */
        if (user.lock_until && new Date(user.lock_until) > new Date()) {
            return res.status(403).json({
                message: "Account locked. Try again later."
            });
        }

        // Try bcrypt comparison first (for hashed passwords)
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password);
        } catch (e) {
            isMatch = false;
        }

        // Fallback: if bcrypt compare failed but the stored password is plain text,
        // allow direct string comparison (useful in development if users were seeded without hashing).
        if (!isMatch && user.password === password) {
            isMatch = true;
        }

        /* =========================
           IF PASSWORD WRONG
        ========================== */
        if (!isMatch) {
            let failedAttempts = user.failed_attempts + 1;
            let lockUntil = null;

            if (failedAttempts >= 5) {
                lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                failedAttempts = 0; // reset counter after locking
            }

            await db.query(
                "UPDATE users SET failed_attempts = ?, lock_until = ? WHERE id = ?",
                [failedAttempts, lockUntil, user.id]
            );

            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        /* =========================
           SUCCESS LOGIN
        ========================== */

        await db.query(
            `UPDATE users 
             SET failed_attempts = 0, 
                 lock_until = NULL,
                 last_login = NOW()
             WHERE id = ?`,
            [user.id]
        );

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                username: user.username,
                role: user.role,
                clinic_id: user.clinic_id ?? 1,
                clinic_name: user.clinic_name ?? "Clinic 1",
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

// Email-based demo login (no password required)
exports.demoEmailLogin = async (req, res) => {
    try {
        const { email } = req.body;

        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({
                message: "Valid email address is required"
            });
        }

        // Call the demo controller to create/continue demo session
        const crypto = require("crypto");
        const generateToken = require("../utils/generateToken");
        const db = require("../config/db");

        const DEMO_DURATION_HOURS = 8;

        const generateSessionId = () => {
            return crypto.randomBytes(32).toString('hex');
        };

        // Check for existing active demo session for this email
        const [existingSessions] = await db.query(
            `SELECT * FROM demo_sessions WHERE email = ? AND is_active = TRUE AND expires_at > NOW()`,
            [email]
        );

        if (existingSessions.length > 0) {
            const session = existingSessions[0];

            // Get clinic info
            const [clinicRows] = await db.query('SELECT * FROM clinics WHERE id = ?', [session.clinic_id]);
            
            // If clinic doesn't exist, create a new one and update the session
            let clinic;
            if (!clinicRows || clinicRows.length === 0) {
                // Create a new demo clinic for this existing session
                const demoClinicName = `Demo - ${session.session_id.substring(0, 8)}`;
                const [clinicResult] = await db.query(
                    `INSERT INTO clinics (name, address, phone, created_at) VALUES (?, ?, ?, NOW())`,
                    [demoClinicName, 'Demo Address', 'Demo Phone']
                );
                const newClinicId = clinicResult.insertId;

                // Update the session with the new clinic_id
                await db.query(
                    `UPDATE demo_sessions SET clinic_id = ? WHERE session_id = ?`,
                    [newClinicId, session.session_id]
                );

                // Track the clinic creation
                await db.query(
                    `INSERT INTO demo_data_tracking (session_id, table_name, record_id) VALUES (?, ?, ?)`,
                    [session.session_id, 'clinics', newClinicId]
                );

                clinic = { id: newClinicId, name: demoClinicName };
            } else {
                clinic = clinicRows[0];
            }

            const demoUser = {
                id: `demo_${session.session_id}`,
                full_name: 'Demo User',
                username: 'demo_user',
                role: 'admin',
                clinic_id: clinic.id,
                clinic_name: clinic.name,
                is_demo: true,
                session_id: session.session_id
            };

            const token = generateToken(demoUser);

            return res.json({
                token,
                user: demoUser,
                expires_at: session.expires_at,
                message: `Welcome back! Continuing your demo session.`
            });
        }

        // Create new demo session
        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + DEMO_DURATION_HOURS * 60 * 60 * 1000);

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Insert demo session
            await connection.query(
                `INSERT INTO demo_sessions (session_id, email, ip_address, user_agent, expires_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [sessionId, email, ipAddress, userAgent, expiresAt]
            );

            // Create a demo clinic for this session
            const demoClinicName = `Demo - ${sessionId.substring(0, 8)}`;
            const [clinicResult] = await connection.query(
                `INSERT INTO clinics (name, address, phone, created_at)
                 VALUES (?, ?, ?, NOW())`,
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
                `INSERT INTO demo_data_tracking (session_id, table_name, record_id)
                 VALUES (?, ?, ?)`,
                [sessionId, 'clinics', demoClinicId]
            );

            await connection.commit();

            // Create a demo user object
            const demoUser = {
                id: `demo_${sessionId}`,
                full_name: 'Demo User',
                username: 'demo_user',
                role: 'admin',
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
                expires_at: expiresAt,
                message: `Welcome! You have ${DEMO_DURATION_HOURS} hours of free access to explore the system.`
            });
        } catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("=== DEMO EMAIL LOGIN ERROR ===");
        console.error("Error Type:", error.constructor.name);
        console.error("Error Message:", error.message);
        console.error("Error Code:", error.code);
        console.error("Full Error:", JSON.stringify(error, null, 2));
        console.error("=============================");
        res.status(500).json({
            message: "Failed to create demo session",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};