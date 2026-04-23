const { trackDemoData, trackDemoActivity } = require("../controllers/demoController");
const db = require("../config/db");

// Middleware to track data created during demo sessions
exports.trackDemoDataMiddleware = (tableName) => {
    return async (req, res, next) => {
        // Store original send method
        const originalSend = res.send;

        // Override send method to track data after successful creation
        res.send = function(data) {
            // Check if this is a demo user and the request was successful
            if (req.user && req.user.is_demo && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    // Try to extract record ID from response
                    const responseData = JSON.parse(data);
                    let recordId = null;

                    // Common patterns for record IDs in responses
                    if (responseData.id) {
                        recordId = responseData.id;
                    } else if (responseData.patient && responseData.patient.id) {
                        recordId = responseData.patient.id;
                    } else if (responseData.data && responseData.data.id) {
                        recordId = responseData.data.id;
                    }

                    if (recordId) {
                        // Pass email from demo session to tracking function
                        const sessionId = req.user.session_id;
                        db.query(
                            `SELECT email FROM demo_sessions WHERE session_id = ?`,
                            [sessionId]
                        ).then(([sessionRows]) => {
                            const email = sessionRows.length > 0 ? sessionRows[0].email : null;
                            trackDemoData(tableName, recordId, sessionId, email);
                        }).catch(err => console.error('Error getting session email:', err));
                    }
                } catch (error) {
                    // Ignore parsing errors
                }
            }

            // Call original send method
            originalSend.call(this, data);
        };

        next();
    };
};

// Middleware to make tracking functions available in request object
exports.attachDemoTracking = (req, res, next) => {
    if (req.user && req.user.is_demo) {
        req.trackActivity = (activity_type, activity_details, recordId, tableName) => {
            trackDemoActivity(req.user.session_id, null, activity_type, activity_details, recordId, tableName);
        };
    }
    next();
};