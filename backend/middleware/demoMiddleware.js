const { trackDemoData } = require("../controllers/demoController");

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
                        trackDemoData(tableName, recordId, req.user.session_id, req.user.email || null);
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