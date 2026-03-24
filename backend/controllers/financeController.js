const db = require("../config/db");

exports.addExpense = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const { expense_date, description, amount } = req.body;

    const [result] = await db.query(
      "INSERT INTO expenses (clinic_id, expense_date, description, amount, created_at) VALUES (?, ?, ?, ?, NOW())",
      [clinicId, expense_date, description, amount]
    );

    res.json({
      message: "Expense added",
      id: result.insertId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getExpenses = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      `SELECT id, expense_date, description, amount FROM expenses WHERE clinic_id = ? ORDER BY expense_date DESC`,
      [clinicId]
    );
    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.deleteExpense = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const id = req.params.id;
    const [r] = await db.query("DELETE FROM expenses WHERE id = ? AND clinic_id = ?", [id, clinicId]);
    if (r.affectedRows === 0) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const id = req.params.id;
    const { expense_date, description, amount } = req.body;

    const [r] = await db.query(
      "UPDATE expenses SET expense_date = ?, description = ?, amount = ? WHERE id = ? AND clinic_id = ?",
      [expense_date, description, amount, id, clinicId]
    );
    if (r.affectedRows === 0) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTodayExpenses = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      `SELECT IFNULL(SUM(amount),0) AS total FROM expenses WHERE clinic_id = ? AND DATE(expense_date) = CURDATE()`,
      [clinicId]
    );
    res.json(rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};

exports.getTotalExpenses = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      `SELECT IFNULL(SUM(amount),0) AS totalExpenses FROM expenses WHERE clinic_id = ?`,
      [clinicId]
    );
    res.json(rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};