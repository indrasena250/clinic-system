const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name FROM clinics ORDER BY id");
    res.json(rows);
  } catch (err) {
    console.error("Clinics fetch error:", err);
    res.status(500).json({ message: "Failed to fetch clinics" });
  }
});

router.get("/current", protect,  async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;

    // First ensure the address and phone columns exist
    try {
      await db.query(
        "ALTER TABLE clinics ADD COLUMN address VARCHAR(255) NULL"
      );
    } catch (alterErr) {
      // Column might already exist, ignore error
      if (!alterErr.message.includes('Duplicate column name')) {
        console.warn("Warning adding address column:", alterErr.message);
      }
    }

    try {
      await db.query(
        "ALTER TABLE clinics ADD COLUMN phone VARCHAR(100) NULL"
      );
    } catch (alterErr) {
      // Column might already exist, ignore error
      if (!alterErr.message.includes('Duplicate column name')) {
        console.warn("Warning adding phone column:", alterErr.message);
      }
    }

    const [rows] = await db.query(
      "SELECT id, name, address, phone FROM clinics WHERE id = ?",
      [clinicId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Clinic not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Get current clinic error:", err);
    res.status(500).json({ message: "Failed to fetch clinic details" });
  }
});

router.patch("/current", protect,  async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const { name, address, phone } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Clinic name is required" });
    }

    // Ensure the clinics table has an address column for clinic preferences.
    try {
      await db.query(
        "ALTER TABLE clinics ADD COLUMN address VARCHAR(255) NULL"
      );
    } catch (alterErr) {
      // Column might already exist, ignore error
      if (!alterErr.message.includes('Duplicate column name')) {
        console.warn("Warning adding address column:", alterErr.message);
      }
    }

    // Ensure the clinics table has a phone column
    try {
      await db.query(
        "ALTER TABLE clinics ADD COLUMN phone VARCHAR(100) NULL"
      );
    } catch (alterErr) {
      // Column might already exist, ignore error
      if (!alterErr.message.includes('Duplicate column name')) {
        console.warn("Warning adding phone column:", alterErr.message);
      }
    }

    const [result] = await db.query(
      "UPDATE clinics SET name = ?, address = ?, phone = ? WHERE id = ?",
      [name.trim(), address ? address.trim() : null, phone ? phone.trim() : null, clinicId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    res.json({ message: "Clinic settings updated successfully" });
  } catch (err) {
    console.error("Update clinic settings error:", err);
    res.status(500).json({ message: "Failed to update clinic settings" });
  }
});

module.exports = router;
