/**
 * Settlement Controller
 * Handles POST /api/settle - Manual Settlement
 */

const settlementService = require("../services/settlementService");

/**
 * POST /api/settle
 * Execute a manual settlement for the period since last settlement (or from earliest data)
 * RESTRICTION: Only one settlement per day per clinic
 */
async function settle(req, res) {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    console.log("Settlement request for clinic_id:", clinicId, "user:", req.user);
    
    // Check if already settled today
    const alreadySettled = await settlementService.hasSettlementToday(clinicId);
    if (alreadySettled) {
      return res.status(400).json({
        success: false,
        message: "Settlement already completed for today. Only one settlement per day is allowed.",
      });
    }
    
    const result = await settlementService.executeSettlement(clinicId);

    res.status(201).json({
      success: true,
      from_time: result.from_time,
      to_time: result.to_time,
      income: result.income,
      extraIncome: result.extraIncome,
      expenses: result.expenses,
      settlementAmount: result.settlementAmount,
    });
  } catch (error) {
    console.error("Settlement error:", error.message);
    console.error("Error details:", {
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    });
    
    res.status(500).json({
      success: false,
      message: error.sqlMessage || error.message || "Failed to process settlement",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

module.exports = {
  settle,
};
