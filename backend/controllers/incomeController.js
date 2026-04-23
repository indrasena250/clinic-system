const db = require("../config/db");
const { trackDemoData } = require("./demoController");
const demoTrackingService = require("../services/demoTrackingService");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

exports.addIncome = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const { income_date, income_type, description, amount } = req.body;
    
    // Use IST timezone for created_at to match settlement timestamps
    const istNow = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const [result] = await db.query(
      `INSERT INTO extra_income (clinic_id, income_date, income_type, description, amount, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [clinicId, income_date, income_type, description, amount, istNow]
    );

    // Track demo data if this is a demo user
    if (req.user && req.user.is_demo) {
      trackDemoData("extra_income", result.insertId, req.user.session_id);
      
      // Also track activity for comprehensive demo tracking
      if (req.user.session_id) {
        demoTrackingService.trackExtraIncome(
          req.user.session_id,
          null,
          'created',
          {
            income_date: income_date,
            income_type: income_type,
            description: description,
            amount: amount
          },
          result.insertId
        );
      }
    }

    res.json({
      message: "Income added successfully",
      id: result.insertId
    });

  } catch (error) {

    console.error("Add Income Error:", error);

    res.status(500).json({
      message: "Error adding income"
    });
  }
};

exports.getIncome = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      `SELECT id, DATE_FORMAT(income_date,'%Y-%m-%d') AS income_date, income_type, description, amount
       FROM extra_income WHERE clinic_id = ? ORDER BY income_date DESC`,
      [clinicId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const id = req.params.id;
    const [r] = await db.query("DELETE FROM extra_income WHERE id = ? AND clinic_id = ?", [id, clinicId]);
    if (r.affectedRows === 0) return res.status(404).json({ message: "Income not found" });
    
    // Track demo activity if demo user
    if (req.user?.is_demo && req.user?.session_id) {
      demoTrackingService.trackExtraIncome(
        req.user.session_id,
        null,
        'deleted',
        { income_id: id },
        id
      );
    }
    
    res.json({ message: "Income deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const id = req.params.id;
    const { income_date, income_type, description, amount } = req.body;

    const [r] = await db.query(
      `UPDATE extra_income SET income_date = ?, income_type = ?, description = ?, amount = ? 
       WHERE id = ? AND clinic_id = ?`,
      [income_date, income_type, description, amount, id, clinicId]
    );

    if (r.affectedRows === 0) return res.status(404).json({ message: "Income not found" });
    
    // Track demo activity if demo user
    if (req.user?.is_demo && req.user?.session_id) {
      demoTrackingService.trackExtraIncome(
        req.user.session_id,
        null,
        'updated',
        {
          income_date: income_date,
          income_type: income_type,
          description: description,
          amount: amount
        },
        id
      );
    }
    
    res.json({ message: "Income updated successfully" });
  } catch (error) {
    console.error("Update Income Error:", error);
    res.status(500).json({ message: "Error updating income" });
  }
};

exports.getIncomeByType = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      `SELECT SUM(CASE WHEN income_type='CT' THEN amount ELSE 0 END) AS ct_income,
              SUM(CASE WHEN income_type='USG' THEN amount ELSE 0 END) AS usg_income,
              SUM(CASE WHEN income_type='Other' THEN amount ELSE 0 END) AS other_income,
              SUM(amount) AS total_extra_income
       FROM extra_income WHERE clinic_id = ?`,
      [clinicId]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTodayIncome = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
    
    const [rows] = await db.query(
      `SELECT IFNULL(SUM(amount),0) AS total FROM extra_income WHERE clinic_id = ? AND DATE(COALESCE(created_at, income_date)) = ?`,
      [clinicId, today]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTodayIncomeSummary = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
    
    const [rows] = await db.query(
      `SELECT IFNULL(SUM(CASE WHEN income_type='CT' THEN amount ELSE 0 END), 0) AS ct_income,
              IFNULL(SUM(CASE WHEN income_type='USG' THEN amount ELSE 0 END), 0) AS usg_income,              IFNULL(SUM(CASE WHEN income_type='XRAY' THEN amount ELSE 0 END), 0) AS xray_income,              IFNULL(SUM(CASE WHEN income_type='Other' THEN amount ELSE 0 END), 0) AS other_income,
              IFNULL(SUM(amount), 0) AS total_income
       FROM extra_income WHERE clinic_id = ? AND DATE(COALESCE(created_at, income_date)) = ?`,
      [clinicId]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getIncomeTotal = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      `SELECT IFNULL(SUM(amount),0) AS totalIncome FROM extra_income WHERE clinic_id = ?`,
      [clinicId]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};