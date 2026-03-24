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

module.exports = router;
