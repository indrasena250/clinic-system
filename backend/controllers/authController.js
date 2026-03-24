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