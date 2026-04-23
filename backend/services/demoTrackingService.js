const db = require("../config/db");

/**
 * Comprehensive demo tracking service
 * Uses the existing demo_data_tracking table for all tracking
 */

const ACTIVITY_TYPES = {
    // Data operations
    DATA_CREATED: 'DATA_CREATED',
    DATA_UPDATED: 'DATA_UPDATED',
    DATA_DELETED: 'DATA_DELETED',
    
    // Document operations
    PDF_DOWNLOADED: 'PDF_DOWNLOADED',
    REPORT_VIEWED: 'REPORT_VIEWED',
    REPORT_GENERATED: 'REPORT_GENERATED',
    
    // Financial operations
    SETTLEMENT_CREATED: 'SETTLEMENT_CREATED',
    SETTLEMENT_UPDATED: 'SETTLEMENT_UPDATED',
    SETTLEMENT_DELETED: 'SETTLEMENT_DELETED',
    SETTLEMENT_FINALIZED: 'SETTLEMENT_FINALIZED',
    
    DAILY_EXPENSE_CREATED: 'DAILY_EXPENSE_CREATED',
    DAILY_EXPENSE_UPDATED: 'DAILY_EXPENSE_UPDATED',
    DAILY_EXPENSE_DELETED: 'DAILY_EXPENSE_DELETED',
    
    EXTRA_INCOME_CREATED: 'EXTRA_INCOME_CREATED',
    EXTRA_INCOME_UPDATED: 'EXTRA_INCOME_UPDATED',
    EXTRA_INCOME_DELETED: 'EXTRA_INCOME_DELETED',
    
    // Scan operations
    SCAN_CREATED: 'SCAN_CREATED',
    SCAN_UPDATED: 'SCAN_UPDATED',
    SCAN_DELETED: 'SCAN_DELETED',
    
    // Patient operations
    PATIENT_CREATED: 'PATIENT_CREATED',
    PATIENT_UPDATED: 'PATIENT_UPDATED',
    PATIENT_DELETED: 'PATIENT_DELETED',
    
    // Referral operations
    REFERRAL_CREATED: 'REFERRAL_CREATED',
    REFERRAL_UPDATED: 'REFERRAL_UPDATED',
    REFERRAL_DELETED: 'REFERRAL_DELETED',
    
    // Session operations
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    SESSION_EXTENDED: 'SESSION_EXTENDED'
};

/**
 * Track a demo user activity using demo_data_tracking table
 * @param {string} sessionId - Demo session ID
 * @param {string} email - User email
 * @param {string} activityType - Type of activity (use ACTIVITY_TYPES)
 * @param {object} details - Additional details about the activity
 * @param {number} recordId - ID of affected record (optional)
 * @param {string} tableName - Name of affected table (optional)
 */
async function trackActivity(sessionId, email, activityType, details = {}, recordId = null, tableName = null) {
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

        // Prepare details as JSON string
        const detailsJson = JSON.stringify(details);

        // Insert into demo_data_tracking with activity metadata
        // Including notes (details) and activity_type columns
        await db.query(
            `INSERT INTO demo_data_tracking (session_id, table_name, record_id, email, notes, activity_type, created_at)
             VALUES (?, ?, ?, ?, ?, ?, CONVERT_TZ(NOW(), '+00:00', '+05:30'))`,
            [sessionId, tableName || 'general', recordId, emailToTrack, detailsJson, activityType]
        );
    } catch (error) {
        console.error('Error tracking demo activity:', error);
        // Silently fail - don't interrupt user operations
    }
}

/**
 * Track PDF download
 */
async function trackPdfDownload(sessionId, email, pdfName, recordId, recordType) {
    return trackActivity(sessionId, email, ACTIVITY_TYPES.PDF_DOWNLOADED, {
        pdf_name: pdfName,
        record_type: recordType,
        timestamp: new Date().toISOString()
    }, recordId, 'PDF_DOWNLOAD');
}

/**
 * Track settlement action
 */
async function trackSettlement(sessionId, email, action, settlementData, settlementId) {
    const activityType = action === 'created' ? ACTIVITY_TYPES.SETTLEMENT_CREATED :
                        action === 'updated' ? ACTIVITY_TYPES.SETTLEMENT_UPDATED :
                        action === 'deleted' ? ACTIVITY_TYPES.SETTLEMENT_DELETED :
                        action === 'finalized' ? ACTIVITY_TYPES.SETTLEMENT_FINALIZED : null;
    
    if (activityType) {
        return trackActivity(sessionId, email, activityType, settlementData, settlementId, 'settlements');
    }
}

/**
 * Track daily expense action
 */
async function trackDailyExpense(sessionId, email, action, expenseData, expenseId) {
    const activityType = action === 'created' ? ACTIVITY_TYPES.DAILY_EXPENSE_CREATED :
                        action === 'updated' ? ACTIVITY_TYPES.DAILY_EXPENSE_UPDATED :
                        action === 'deleted' ? ACTIVITY_TYPES.DAILY_EXPENSE_DELETED : null;
    
    if (activityType) {
        return trackActivity(sessionId, email, activityType, expenseData, expenseId, 'daily_expenses');
    }
}

/**
 * Track extra income action
 */
async function trackExtraIncome(sessionId, email, action, incomeData, incomeId) {
    const activityType = action === 'created' ? ACTIVITY_TYPES.EXTRA_INCOME_CREATED :
                        action === 'updated' ? ACTIVITY_TYPES.EXTRA_INCOME_UPDATED :
                        action === 'deleted' ? ACTIVITY_TYPES.EXTRA_INCOME_DELETED : null;
    
    if (activityType) {
        return trackActivity(sessionId, email, activityType, incomeData, incomeId, 'extra_income');
    }
}

/**
 * Track scan action
 */
async function trackScan(sessionId, email, action, scanData, scanId) {
    const activityType = action === 'created' ? ACTIVITY_TYPES.SCAN_CREATED :
                        action === 'updated' ? ACTIVITY_TYPES.SCAN_UPDATED :
                        action === 'deleted' ? ACTIVITY_TYPES.SCAN_DELETED : null;
    
    if (activityType) {
        return trackActivity(sessionId, email, activityType, scanData, scanId, 'scans');
    }
}

/**
 * Track patient action
 */
async function trackPatient(sessionId, email, action, patientData, patientId) {
    const activityType = action === 'created' ? ACTIVITY_TYPES.PATIENT_CREATED :
                        action === 'updated' ? ACTIVITY_TYPES.PATIENT_UPDATED :
                        action === 'deleted' ? ACTIVITY_TYPES.PATIENT_DELETED : null;
    
    if (activityType) {
        return trackActivity(sessionId, email, activityType, patientData, patientId, 'patients');
    }
}

/**
 * Track referral action
 */
async function trackReferral(sessionId, email, action, referralData, referralId) {
    const activityType = action === 'created' ? ACTIVITY_TYPES.REFERRAL_CREATED :
                        action === 'updated' ? ACTIVITY_TYPES.REFERRAL_UPDATED :
                        action === 'deleted' ? ACTIVITY_TYPES.REFERRAL_DELETED : null;
    
    if (activityType) {
        return trackActivity(sessionId, email, activityType, referralData, referralId, 'doctor_referrals');
    }
}

/**
 * Track login
 */
async function trackLogin(sessionId, email) {
    return trackActivity(sessionId, email, ACTIVITY_TYPES.LOGIN, {
        login_timestamp: new Date().toISOString()
    }, null, 'LOGIN');
}

/**
 * Track logout
 */
async function trackLogout(sessionId, email) {
    return trackActivity(sessionId, email, ACTIVITY_TYPES.LOGOUT, {
        logout_timestamp: new Date().toISOString()
    }, null, 'LOGOUT');
}

module.exports = {
    ACTIVITY_TYPES,
    trackActivity,
    trackPdfDownload,
    trackSettlement,
    trackDailyExpense,
    trackExtraIncome,
    trackScan,
    trackPatient,
    trackReferral,
    trackLogin,
    trackLogout
};
