const { authorize } = require("../middleware/roleMiddleware");
const { protect } = require("../middleware/authMiddleware");
const { validateDemoSession, trackDemoData } = require("../controllers/demoController");
const { trackDemoDataMiddleware } = require("../middleware/demoMiddleware");
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const pool = require("../config/db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const signatureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "clinic-signatures",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const uploadSignature = multer({
  storage: signatureStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

async function getSettlementWindow() {
  // Use a fixed daily window 4:30 PM -> 4:30 PM for the current time.
  const now = dayjs();
  return getWindowForDate(now.format("YYYY-MM-DD"));
}

function getWindowForDate(date) {
  const day = dayjs(date, "YYYY-MM-DD");
  // For the selected date, window is: previous day 4:30 PM -> selected day 4:30 PM
  const to = day.hour(16).minute(30).second(0).millisecond(0);
  const from = to.subtract(1, "day");

  return {
    from: from.format("YYYY-MM-DD HH:mm:ss"),
    to: to.format("YYYY-MM-DD HH:mm:ss")
  };
}

async function drawSignature(doc, pageWidth, margin, clinicId) {
  try {
    const [sigResult] = await db.query(
      "SELECT file_path FROM clinic_signature WHERE clinic_id = ? ORDER BY id DESC LIMIT 1",
      [clinicId]
    );
    if (!sigResult?.length || !sigResult[0].file_path) return;

    const signatureUrl = sigResult[0].file_path;
    const https = require('https');
    const signatureBuffer = await new Promise((resolve, reject) => {
      https.get(signatureUrl, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', (err) => reject(err));
      });
    });

    // Fit any signature into a smaller bounding box while preserving aspect ratio.
    const maxSigWidth = Math.min(150, pageWidth - margin - 20);
    const maxSigHeight = 70;

    const img = doc.openImage(signatureBuffer);
    const naturalW = img.width || maxSigWidth;
    const naturalH = img.height || maxSigHeight;
    if (!naturalW || !naturalH) return;

    const scale = Math.min(maxSigWidth / naturalW, maxSigHeight / naturalH) * 0.9;
    const drawW = Math.max(1, Math.round(naturalW * scale));
    const drawH = Math.max(1, Math.round(naturalH * scale));

    const neededHeight = drawH + 30;
    if (doc.y + neededHeight > doc.page.height - margin) {
      doc.addPage();
    }

    const sigX = pageWidth - maxSigWidth - 10;
    const sigY = doc.y;

    doc.image(img, sigX + Math.round((maxSigWidth - drawW) / 2), sigY, {
      width: drawW,
      height: drawH,
    });

    doc.font("Helvetica-Bold")
      .fontSize(10)
      .text(
        "Authorized Signature",
        sigX,
        sigY + drawH + 8,
        {
          width: maxSigWidth,
          align: "center"
        }
      );

    doc.y = sigY + drawH + 24;
  } catch (error) {
    console.error("Error drawing signature:", error);
  }
}

/* =========================================
   ADD NEW PATIENT WITH MULTIPLE SCANS
========================================= */
router.post("/add", protect, authorize("admin", "staff"), validateDemoSession, trackDemoDataMiddleware("patients"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const {
      upload_date,
      patient_name,
      age,
      age_unit,
      gender,
      mobile,
      address,
      scans // Array of scan objects: [{scan_category, scan_name, referred_doctor, amount, referral_amount}, ...]
    } = req.body;

    // Validate required fields
    if (!patient_name || !mobile || !scans || !Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({
        message: "Patient name, mobile, and at least one scan are required"
      });
    }

    // Use IST timezone for created_at
    const istNow = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert each scan as a separate patient record
 const invoiceId = Date.now(); // one invoice for all scans

const patientIds = [];

for (const scan of scans) {

  let finalDate = upload_date || dayjs().format("YYYY-MM-DD HH:mm:ss");

  if (finalDate && finalDate.length === 10) {
    finalDate =
      dayjs(finalDate).format("YYYY-MM-DD") +
      " " +
      dayjs().format("HH:mm:ss");
  }

  // Get next clinic-specific ID (all scans)
  const [maxClinicIdResult] = await connection.query(
    `SELECT COALESCE(MAX(clinic_patient_id), 0) AS max_id FROM patients WHERE clinic_id = ?`,
    [clinicId]
  );
  const nextClinicId = (maxClinicIdResult[0]?.max_id || 0) + 1;

  // Get next scan-type specific ID (CT or Ultrasound)
  const [maxScanTypeIdResult] = await connection.query(
    `SELECT COALESCE(MAX(clinic_scan_patient_id), 0) AS max_id FROM patients WHERE clinic_id = ? AND scan_category = ?`,
    [clinicId, scan.scan_category]
  );
  const nextScanTypeId = (maxScanTypeIdResult[0]?.max_id || 0) + 1;

  const [result] = await connection.query(
    `INSERT INTO patients
    (clinic_id, clinic_patient_id, clinic_scan_patient_id, patient_name, age, age_unit, gender, mobile, address,
     scan_category, scan_name, referred_doctor, amount,
     upload_date, created_at, invoice_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clinicId,
      nextClinicId,
      nextScanTypeId,
      patient_name,
      age,
      age_unit || "years",
      gender,
      mobile,
      address || null,
      scan.scan_category,
      scan.scan_name,
      scan.referred_doctor,
      scan.amount,
      finalDate,
      istNow,
      invoiceId
    ]
  );

  patientIds.push(result.insertId);

  // Track demo data if this is a demo user
  if (req.user && req.user.is_demo) {
    trackDemoData("patients", result.insertId, req.user.session_id, req.user.email || null);
  }
}
      await connection.commit();

      res.status(201).json({
        message: `Patient added successfully with ${scans.length} scan(s)`,
        patientIds
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error adding patient:', error);
    res.status(500).json({
      message: "Error adding patient",
      error: error.message
    });
  }
});
/* =========================================
   GET ALL PATIENTS (Latest First)
========================================= */
router.get("/all", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await pool.query(
      `SELECT id, patient_name, scan_name, upload_date, referred_doctor, amount, referral_amount, referral_status,invoice_id 
       FROM patients WHERE clinic_id = ? ORDER BY upload_date DESC`,
      [clinicId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch patients" });
  }
});

/* =========================================
   GET NEXT PATIENT ID FOR CLINIC
========================================= */
router.get("/next-id", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      `SELECT COUNT(*) AS patient_count FROM patients WHERE clinic_id = ?`,
      [clinicId]
    );
    const nextId = (rows[0]?.patient_count || 0) + 1;
    res.json({ nextId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get next ID" });
  }
});

/* =========================================
   GET NEXT CT PATIENT ID FOR CLINIC
========================================= */
router.get("/next-id/ct", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      `SELECT COALESCE(MAX(clinic_scan_patient_id), 0) AS max_id FROM patients WHERE clinic_id = ? AND scan_category = 'CT'`,
      [clinicId]
    );
    const nextId = (rows[0]?.max_id || 0) + 1;
    res.json({ nextId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get next CT ID" });
  }
});

/* =========================================
   GET NEXT ULTRASOUND PATIENT ID FOR CLINIC
========================================= */
router.get("/next-id/ultrasound", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      `SELECT COALESCE(MAX(clinic_scan_patient_id), 0) AS max_id FROM patients WHERE clinic_id = ? AND scan_category = 'Ultrasound'`,
      [clinicId]
    );
    const nextId = (rows[0]?.max_id || 0) + 1;
    res.json({ nextId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get next Ultrasound ID" });
  }
});

/* =========================================
   GET CT PATIENTS ONLY
========================================= */
router.get("/ct", protect, authorize("admin", "staff"), async (req, res) => {
    try {
        const clinicId = req.user?.clinic_id ?? 1;
        const [rows] = await db.query(
            `SELECT *,
             ROW_NUMBER() OVER (PARTITION BY clinic_id ORDER BY upload_date DESC, id DESC) AS clinic_wise_id
             FROM patients WHERE clinic_id = ? AND scan_category = 'CT' 
             ORDER BY ISNULL(upload_date) ASC, id DESC`,
            [clinicId]
        );
        res.json(rows);

    } catch (error) {
        res.status(500).json({ message: "Error fetching CT records" });
    }
});

/* =========================================
   GET ULTRASOUND PATIENTS ONLY
========================================= */
router.get("/ultrasound", protect, authorize("admin", "staff"), async (req, res) => {
    try {
        const clinicId = req.user?.clinic_id ?? 1;
        const [rows] = await db.query(
            `SELECT *,
             ROW_NUMBER() OVER (PARTITION BY clinic_id ORDER BY upload_date DESC, id DESC) AS clinic_wise_id
             FROM patients WHERE clinic_id = ? AND scan_category = 'Ultrasound' 
             ORDER BY ISNULL(upload_date) ASC, id DESC`,
            [clinicId]
        );
        res.json(rows);

    } catch (error) {
        res.status(500).json({ message: "Error fetching Ultrasound records" });
    }
});

/* =========================================
   COMPLETE DAILY FINANCIAL REPORT
========================================= */
router.get(
  "/daily-report/:date",
  protect,
  authorize("admin", "staff"),
  async (req, res) => {

    try {
      const clinicId = req.user?.clinic_id ?? 1;
      const { date } = req.params;

      const [todayIncome] = await db.query(
        `SELECT SUM(amount) AS totalIncome,
                SUM(CASE WHEN scan_category='Ultrasound' THEN amount ELSE 0 END) AS ultrasoundIncome,
                SUM(CASE WHEN scan_category='CT' THEN amount ELSE 0 END) AS ctIncome
         FROM patients WHERE clinic_id = ? AND upload_date = ?`,
        [clinicId, date]
      );

      const todayTotalIncome = todayIncome[0]?.totalIncome || 0;
      const todayUltrasound = todayIncome[0]?.ultrasoundIncome || 0;
      const todayCT = todayIncome[0]?.ctIncome || 0;

      const [expenseResult] = await db.query(
        `SELECT IFNULL(SUM(amount),0) AS totalExpense FROM expenses WHERE clinic_id = ? AND expense_date = ?`,
        [clinicId, date]
      );

      const totalExpense = expenseResult[0]?.totalExpense || 0;

      const [referralResult] = await db.query(
        `SELECT IFNULL(SUM(d.referral_amount),0) AS totalReferral
         FROM doctor_referrals d
         JOIN patients p ON d.patient_id = p.id
         WHERE p.clinic_id = ? AND p.upload_date = ?`,
        [clinicId, date]
      );

      const totalReferral = referralResult[0]?.totalReferral || 0;
      const netIncome = todayTotalIncome - totalReferral - totalExpense;

      const [overallIncome] = await db.query(
        `SELECT SUM(amount) AS overallIncome,
                SUM(CASE WHEN scan_category='Ultrasound' THEN amount ELSE 0 END) AS totalUltrasound,
                SUM(CASE WHEN scan_category='CT' THEN amount ELSE 0 END) AS totalCT
         FROM patients WHERE clinic_id = ?`,
        [clinicId]
      );

      const overallTotalIncome = overallIncome[0]?.overallIncome || 0;
      const totalUltrasound = overallIncome[0]?.totalUltrasound || 0;
      const totalCT = overallIncome[0]?.totalCT || 0;

      const [overallExpense] = await db.query(
        `SELECT IFNULL(SUM(amount),0) AS overallExpense FROM expenses WHERE clinic_id = ?`,
        [clinicId]
      );

      const overallExpenseTotal = overallExpense[0]?.overallExpense || 0;

      const overallNet = overallTotalIncome - overallExpenseTotal;

      /* ================= RESPONSE ================= */

      res.json({

        todayUltrasound,
        todayCT,
        todayIncome: todayTotalIncome,
        todayExpense: totalExpense,
        todayNet: netIncome,

        totalUltrasound,
        totalCT,
        overallIncome: overallTotalIncome,
        overallExpense: overallExpenseTotal,
        overallNet,

        referralBalance: totalReferral

      });

    } catch (error) {

      console.error("Dashboard error:", error);

      res.status(500).json({
        message: "Dashboard summary error"
      });

    }

  }
);
/* =========================================
   GET DOCTOR REFERRAL REPORT (By Doctor)
========================================= */
router.get("/doctor-report/:doctor", protect, authorize("admin"), async (req, res) => {
    try {
        const clinicId = req.user?.clinic_id ?? 1;
        const { doctor } = req.params;

        const [results] = await db.query(
            `SELECT p.upload_date, p.patient_name, p.scan_category, p.scan_name, d.referral_amount, d.payment_status
             FROM doctor_referrals d
             JOIN patients p ON d.patient_id = p.id
             WHERE d.clinic_id = ? AND d.doctor_name = ?
             ORDER BY p.scan_category DESC, p.upload_date DESC`,
            [clinicId, doctor]
        );

        let totalReferral = 0;
        let paidTotal = 0;
        let balanceTotal = 0;

        results.forEach(record => {
            const amount = Number(record.referral_amount) || 0;
            totalReferral += amount;

            if (record.payment_status === "Paid") {
                paidTotal += amount;
            } else {
                balanceTotal += amount;
            }
        });

        res.json({
            doctor,
            totalReferral,
            paidTotal,
            balanceTotal,
            records: results
        });

    } catch (error) {
        res.status(500).json({ message: "Error fetching doctor report" });
    }
});
/* =========================================
   EDIT PATIENT DETAILS
========================================= */

router.put("/:id", protect, authorize("admin"), async (req, res) => {
  const { id } = req.params;
  const clinicId = req.user?.clinic_id ?? 1;

  const {
    patient_name,
    age,
    gender,
    mobile,
    address,
    scan_category,
    scan_name,
    referred_doctor,
    amount,
    upload_date,
  } = req.body;

  // Only update upload_date if explicitly provided (otherwise keep original).
  // If a date-only value is provided (YYYY-MM-DD), append current time.
  let finalDate = null;
  if (upload_date !== undefined && upload_date !== null && upload_date !== "") {
    finalDate = upload_date;
    if (typeof upload_date === "string" && upload_date.length === 10) {
      finalDate = dayjs(upload_date).format("YYYY-MM-DD") + " " + dayjs().format("HH:mm:ss");
    }
  }

  try {
    const fields = [
      "patient_name=?",
      "age=?",
      "gender=?",
      "mobile=?",
      "address=?",
      "scan_category=?",
      "scan_name=?",
      "referred_doctor=?",
      "amount=?",
    ];

    const values = [
      patient_name,
      age,
      gender,
      mobile,
      address ?? null,
      scan_category,
      scan_name,
      referred_doctor,
      amount,
    ];

    if (finalDate !== null) {
      fields.push("upload_date=?");
      values.push(finalDate);
    }

    values.push(id, clinicId);

    const [r] = await pool.query(
      `UPDATE patients SET ${fields.join(", ")} WHERE id=? AND clinic_id=?`,
      values
    );
    if (r.affectedRows === 0) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================================
   REFERRAL UPDATE (Amount & Status)
========================================= */
router.put("/referral/:id", protect, authorize("admin", "staff"), async (req, res) => {
  const { id } = req.params;
  const clinicId = req.user?.clinic_id ?? 1;
  let { referral_amount, referral_status } = req.body;

  try {
    referral_amount = Number(referral_amount) || 0;
    if (referral_amount === null || referral_amount === undefined) {
      const [currentRow] = await pool.query(
        `SELECT referral_amount FROM patients WHERE id = ? AND clinic_id = ?`,
        [id, clinicId]
      );

      if (currentRow.length > 0 && currentRow[0].referral_amount) {
        referral_amount = currentRow[0].referral_amount;
      }
    }

    const [r] = await pool.query(
      `UPDATE patients SET referral_amount = ?, referral_status = ? WHERE id = ? AND clinic_id = ?`,
      [referral_amount, referral_status, id, clinicId]
    );
    if (r.affectedRows === 0) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Referral updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update referral" });
  }

});
/* =========================================
   MARK REFERRAL AS PAID
========================================= */
router.put("/mark-paid/:id", protect, authorize("admin"), (req, res) => {
    const clinicId = req.user?.clinic_id ?? 1;
    const { id } = req.params;

    const sql = `UPDATE doctor_referrals SET payment_status = 'Paid', payment_date = CURDATE() WHERE id = ? AND clinic_id = ?`;

    db.query(sql, [id, clinicId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error updating payment status" });
        }

        res.json({ message: "Referral marked as Paid" });
    });
});
router.post("/add-referral", protect, authorize("admin"), (req, res) => {
    const clinicId = req.user?.clinic_id ?? 1;
    const { patient_id, doctor_name, referral_amount } = req.body;

    const sql = `INSERT INTO doctor_referrals (clinic_id, patient_id, doctor_name, referral_amount) VALUES (?, ?, ?, ?)`;
    db.query(sql, [clinicId, patient_id, doctor_name, referral_amount], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error adding referral" });
        }

        res.json({ message: "Referral amount added successfully" });
    });
});
/* =========================================
   Doctor SETTLEMENT REPORT
========================================= */
router.get(
  "/doctors",
  protect,  
  authorize("admin", "staff"),
  async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id ?? 1;
      const [rows] = await pool.query(
        `SELECT DISTINCT referred_doctor FROM patients WHERE clinic_id = ? AND referred_doctor IS NOT NULL ORDER BY referred_doctor`,
        [clinicId]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  }
);
router.get(
  "/doctor-settlement/:doctor",
  protect,
  authorize("admin", "staff"),
  async (req, res) => {
    const clinicId = req.user?.clinic_id ?? 1;
    const { doctor } = req.params;
    const { from, to } = req.query;

    try {
      let query = `SELECT upload_date, patient_name, scan_name, referral_amount
                   FROM patients WHERE clinic_id = ? AND referred_doctor = ?`;
      let params = [clinicId, doctor];

      if (from && to) {
        query += ` AND DATE(upload_date) BETWEEN ? AND ?`;
        params.push(from, to);
      }

      query += ` ORDER BY upload_date ASC`;

      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Settlement fetch failed" });
    }
  }
);
/* =========================================
   Doctor Referral PDF REPORT
========================================= */
const PDFDocument = require("pdfkit");
router.get(
"/doctor-settlement-pdf/:doctor/:from/:to",
protect,
authorize("admin"),
async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id ?? 1;
      const { doctor, from, to } = req.params;

      const [rows] = await db.query(
        `SELECT upload_date, patient_name, scan_name, referral_amount, scan_category
         FROM patients
         WHERE clinic_id = ? AND referred_doctor = ? AND DATE(upload_date) BETWEEN ? AND ?
         ORDER BY FIELD(scan_category, 'Ultrasound', 'CT'), upload_date ASC`,
        [clinicId, doctor, from, to]
      );

      const [clinicRows] = await db.query(
        "SELECT name FROM clinics WHERE id = ?",
        [clinicId]
      );
      const clinicName = clinicRows[0]?.name || "SRIDEVI CT SCAN & DIAGNOSTIC CENTER";

      const doc = new PDFDocument({ margin: 50, size: "A4" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${doctor}-settlement.pdf`
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;

      /* ================= HEADER ================= */

      doc.fontSize(20)
        .font("Helvetica-Bold")
        .text(clinicName, { align: "center" });

      doc.fontSize(13)
        .font("Helvetica")
        .text("Doctor Settlement Report", { align: "center" });

      doc.moveDown(0.5);

            doc.moveDown(0.5);

            doc.font("Helvetica-Bold")
            .fontSize(14)
            .text(`Doctor: ${doctor}`, margin, doc.y);
        doc.font("Helvetica")
        .fontSize(10)
        .text(`From: ${from}   To: ${to}`);
      doc.text(
        `Generated On: ${dayjs().format("DD-MM-YYYY")}`,
        { align: "right" }
      );

      doc.moveDown(2);

      /* ================= TABLE ================= */

      const startX = margin;
      const rowHeight = 25;

      const colWidths = [50, 80, 80, 130, 100, 85];

      const headers = [
        "SL NO",
        "Date",
        "Day",
        "Patient",
        "Scan",
        "Referral"
      ];

      let y = doc.y;

      const drawHeader = () => {
        let x = startX;

        doc.font("Helvetica-Bold").fontSize(10);

        headers.forEach((header, i) => {
          doc.rect(x, y, colWidths[i], rowHeight).stroke();

          doc.text(header, x + 5, y + 8, {
            width: colWidths[i] - 10,
            lineBreak: false
          });

          x += colWidths[i];
        });

        y += rowHeight;
      };

      drawHeader();

      /* ================= ROWS ================= */

      let totalReferral = 0;
      let slNo = 1;

      rows.forEach((row) => {

        const referral = Number(row.referral_amount) || 0;

        // Skip rows with zero referral
        if (referral === 0) return;

        if (y + rowHeight > pageHeight - 150) {
          doc.addPage();
          y = margin;
          drawHeader();
        }

        const date = dayjs(row.upload_date).format("DD-MM-YYYY");
        const day = dayjs(row.upload_date).format("dddd");

        totalReferral += referral;

        const rowData = [
          slNo.toString(),
          date,
          day,
          row.patient_name,
          row.scan_name,
          referral.toFixed(2)
        ];

        slNo++;

        // Determine dynamic row height based on wrapped text
        let rowHeightActual = rowHeight;
        const textOptions = { lineBreak: true, ellipsis: true, width: 0 };

        rowData.forEach((cell, i) => {
          const availableWidth = colWidths[i] - 10;
          textOptions.width = availableWidth;
          const lineHeight = doc.heightOfString(String(cell), textOptions);
          rowHeightActual = Math.max(rowHeightActual, lineHeight + 12);
        });

        if (y + rowHeightActual > pageHeight - 150) {
          doc.addPage();
          y = margin;
          drawHeader();
        }

        let x = startX;

        doc.font("Helvetica").fontSize(10);

        rowData.forEach((cell, i) => {

          doc.rect(x, y, colWidths[i], rowHeightActual).stroke();

          // Align amount right only, keep scan column left
          const alignRight = i === 5 ? "right" : "left";

          doc.text(String(cell), x + 5, y + 8, {
            width: colWidths[i] - 10,
            align: alignRight,
            lineBreak: true,
            ellipsis: true,
          });

          x += colWidths[i];
        });

        y += rowHeightActual;
      });

      /* ================= TOTAL ================= */

      if (y + 120 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.moveDown(2);

      const labelX = margin;
      const valueX = pageWidth - margin - 120;

      doc.font("Helvetica-Bold")
        .fontSize(13)
        .text("Total Referral Amount", labelX, doc.y, {
          lineBreak: false
        });

      doc.font("Helvetica-Bold")
        .fontSize(13)
        .text(
          `Rs. ${totalReferral.toFixed(2)}`,
          valueX,
          doc.y,
          {
            align: "right",
            lineBreak: false
          }
        );

      doc.moveDown(2);

      await drawSignature(doc, pageWidth, margin, clinicId);
      doc.end();

    } catch (error) {
      console.error(error);
      res.status(500).send("Error generating PDF");
    }
  }
);
/* =========================================
   ADD DAILY EXPENSE
========================================= */
router.post("/add-expense", protect, authorize("admin"), (req, res) => {
    const clinicId = req.user?.clinic_id ?? 1;
    const { expense_date, description, amount } = req.body;
    
    // Use IST timezone for created_at to match settlement timestamps
    const istNow = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const sql = `INSERT INTO expenses (clinic_id, expense_date, description, amount, created_at) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [clinicId, expense_date, description, amount, istNow], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error adding expense" });
        }

        res.json({ message: "Expense added successfully" });
    });
});
/* =========================================
   DAILY REPORT SUMMARY (uses settlement window, not just a date)
========================================= */
router.get(
  "/daily-report-summary/:date",
  protect,
  authorize("admin", "staff"),
  async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id ?? 1;
      const { date } = req.params;
      
      // Get last settlement times
      const [settlementRows] = await db.query(
        `SELECT from_time, to_time, created_at
         FROM settlements
         WHERE clinic_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT 1`,
        [clinicId]
      );
      
      let from, to;
      
      if (settlementRows[0]) {
        // From last settlement to_time to current IST moment
        const st = settlementRows[0];
        const toTimeRaw = st.to_time;
        const createdAtRaw = st.created_at;

        let settlementTo = toTimeRaw instanceof Date
          ? dayjs(toTimeRaw).tz("Asia/Kolkata")
          : dayjs(String(toTimeRaw)).tz("Asia/Kolkata");

        // If to_time is missing a real time (e.g. date-only or 00:00:00), fall back to created_at
        const rawStr = typeof toTimeRaw === "string" ? toTimeRaw : "";
        const toLooksDateOnly = rawStr && rawStr.length === 10;
        const toIsMidnight = settlementTo.isValid() && settlementTo.format("HH:mm:ss") === "00:00:00";
        if (!settlementTo.isValid() || toLooksDateOnly || toIsMidnight) {
          const fallback = createdAtRaw instanceof Date
            ? dayjs(createdAtRaw).tz("Asia/Kolkata")
            : dayjs(String(createdAtRaw)).tz("Asia/Kolkata");
          if (fallback.isValid()) settlementTo = fallback;
        }

        from = settlementTo;
        to = dayjs().tz("Asia/Kolkata");
      } else {
        // If no settlement exists yet (ex: 1st settlement not completed),
        // start the daily report from the very first scan onward.
        const now = dayjs().tz("Asia/Kolkata");
        const [firstPatientRows] = await db.query(
          `SELECT MIN(COALESCE(created_at, upload_date)) AS first_time
           FROM patients
           WHERE clinic_id = ?`,
          [clinicId]
        );
        const firstTimeRaw = firstPatientRows?.[0]?.first_time;
        const firstTime = firstTimeRaw
          ? (firstTimeRaw instanceof Date
              ? dayjs(firstTimeRaw).tz("Asia/Kolkata")
              : dayjs(String(firstTimeRaw)).tz("Asia/Kolkata"))
          : null;

        from = firstTime && firstTime.isValid() ? firstTime : now.startOf("day");
        to = now;
      }
      
      const fromStr = from.format("YYYY-MM-DD HH:mm:ss");
      const toStr = to.format("YYYY-MM-DD HH:mm:ss");

      let patientIncome;
      try {
        [patientIncome] = await db.query(
          `SELECT IFNULL(SUM(CASE WHEN p.scan_category = 'CT' THEN p.amount - IFNULL(p.referral_amount, 0) ELSE 0 END), 0) AS ct_income,
                  IFNULL(SUM(CASE WHEN p.scan_category = 'Ultrasound' THEN p.amount - IFNULL(p.referral_amount, 0) ELSE 0 END), 0) AS usg_income
           FROM patients p
           WHERE p.clinic_id = ?
             AND COALESCE(p.created_at, p.upload_date) >= ?
             AND COALESCE(p.created_at, p.upload_date) < ?`,
          [clinicId, fromStr, toStr]
        );
      } catch (e) {
        [patientIncome] = await db.query(
          `SELECT IFNULL(SUM(CASE WHEN p.scan_category = 'CT' THEN p.amount - IFNULL(p.referral_amount, 0) ELSE 0 END), 0) AS ct_income,
                  IFNULL(SUM(CASE WHEN p.scan_category = 'Ultrasound' THEN p.amount - IFNULL(p.referral_amount, 0) ELSE 0 END), 0) AS usg_income
           FROM patients p
           WHERE p.clinic_id = ?
             AND COALESCE(p.created_at, p.upload_date) >= ?
             AND COALESCE(p.created_at, p.upload_date) < ?`,
          [clinicId, fromStr, toStr]
        );
      }

      let extraIncome;
      try {
        [extraIncome] = await db.query(
          `SELECT IFNULL(SUM(CASE WHEN income_type = 'CT' THEN amount ELSE 0 END), 0) AS extra_ct,
                  IFNULL(SUM(CASE WHEN income_type = 'USG' THEN amount ELSE 0 END), 0) AS extra_usg,
                  IFNULL(SUM(CASE WHEN income_type = 'XRAY' THEN amount ELSE 0 END), 0) AS extra_xray,
                  IFNULL(SUM(CASE WHEN income_type = 'Other' THEN amount ELSE 0 END), 0) AS other_income,
                  IFNULL(SUM(amount), 0) AS total_extra
           FROM extra_income WHERE clinic_id = ? AND COALESCE(created_at, income_date) >= ? AND COALESCE(created_at, income_date) < ?`,
          [clinicId, fromStr, toStr]
        );
      } catch (e) {
        [extraIncome] = await db.query(
          `SELECT IFNULL(SUM(CASE WHEN income_type = 'CT' THEN amount ELSE 0 END), 0) AS extra_ct,
                  IFNULL(SUM(CASE WHEN income_type = 'USG' THEN amount ELSE 0 END), 0) AS extra_usg,
                  IFNULL(SUM(CASE WHEN income_type = 'XRAY' THEN amount ELSE 0 END), 0) AS extra_xray,
                  IFNULL(SUM(CASE WHEN income_type = 'Other' THEN amount ELSE 0 END), 0) AS other_income,
                  IFNULL(SUM(amount), 0) AS total_extra
           FROM extra_income WHERE clinic_id = ? AND DATE(income_date) = ?`,
          [clinicId, date]
        );
      }

      let expenseRows;
      try {
        [expenseRows] = await db.query(
          `SELECT IFNULL(SUM(amount), 0) AS total FROM expenses WHERE clinic_id = ? AND COALESCE(created_at, expense_date) >= ? AND COALESCE(created_at, expense_date) < ?`,
          [clinicId, fromStr, toStr]
        );
      } catch (e) {
        [expenseRows] = await db.query(
          `SELECT IFNULL(SUM(amount), 0) AS total FROM expenses WHERE clinic_id = ? AND expense_date = ?`,
          [clinicId, date]
        );
      }

      const ct = Number(patientIncome[0]?.ct_income || 0) + Number(extraIncome[0]?.extra_ct || 0);
      const usg = Number(patientIncome[0]?.usg_income || 0) + Number(extraIncome[0]?.extra_usg || 0);
      const other = Number(extraIncome[0]?.extra_xray || 0) + Number(extraIncome[0]?.other_income || 0);
      const income = ct + usg + other;
      const expenses = Number(expenseRows[0]?.total || 0);
      const net = income - expenses;

      res.json({
        window: { from: fromStr, to: toStr },
        ct,
        usg,
        other,
        income,
        expenses,
        net
      });
    } catch (error) {
      console.error("Daily report summary error:", error);
      res.status(500).json({ message: "Error fetching daily report summary" });
    }
  }
);

/* =========================================
   DAILY REPORT PDF (uses settlement window)
========================================= */
router.get("/daily-report-pdf/:date",protect, authorize("admin"), async (req, res) => {
    try {
        const clinicId = req.user?.clinic_id ?? 1;
        const { date } = req.params;

        const [clinicRows] = await db.query(
          "SELECT name FROM clinics WHERE id = ?",
          [clinicId]
        );
        const clinicName = clinicRows[0]?.name || "SRIDEVI CT SCAN & DIAGNOSTIC CENTER";
        
        // Get last settlement window
        const [settlementRows] = await db.query(
          `SELECT from_time, to_time, created_at
           FROM settlements
           WHERE clinic_id = ?
           ORDER BY created_at DESC, id DESC
           LIMIT 1`,
          [clinicId]
        );
        
        let from, to;
        
        if (settlementRows[0]) {
          // From last settlement to_time to current IST time
          const st = settlementRows[0];
          const toTimeRaw = st.to_time;
          const createdAtRaw = st.created_at;

          let settlementTo = toTimeRaw instanceof Date
            ? dayjs(toTimeRaw).tz("Asia/Kolkata")
            : dayjs(String(toTimeRaw)).tz("Asia/Kolkata");

          const rawStr = typeof toTimeRaw === "string" ? toTimeRaw : "";
          const toLooksDateOnly = rawStr && rawStr.length === 10;
          const toIsMidnight = settlementTo.isValid() && settlementTo.format("HH:mm:ss") === "00:00:00";
          if (!settlementTo.isValid() || toLooksDateOnly || toIsMidnight) {
            const fallback = createdAtRaw instanceof Date
              ? dayjs(createdAtRaw).tz("Asia/Kolkata")
              : dayjs(String(createdAtRaw)).tz("Asia/Kolkata");
            if (fallback.isValid()) settlementTo = fallback;
          }

          from = settlementTo;
          to = dayjs().tz("Asia/Kolkata");
        } else {
          // If no settlement exists yet (ex: 1st settlement not completed),
          // start the daily report from the very first scan onward.
          const now = dayjs().tz("Asia/Kolkata");
          const [firstPatientRows] = await db.query(
            `SELECT MIN(COALESCE(created_at, upload_date)) AS first_time
             FROM patients
             WHERE clinic_id = ?`,
            [clinicId]
          );
          const firstTimeRaw = firstPatientRows?.[0]?.first_time;
          const firstTime = firstTimeRaw
            ? (firstTimeRaw instanceof Date
                ? dayjs(firstTimeRaw).tz("Asia/Kolkata")
                : dayjs(String(firstTimeRaw)).tz("Asia/Kolkata"))
            : null;

          from = firstTime && firstTime.isValid() ? firstTime : now.startOf("day");
          to = now;
        }
        
        const fromStr = from.format("YYYY-MM-DD HH:mm:ss");
        const toStr = to.format("YYYY-MM-DD HH:mm:ss");

        let results;
        try {
          const [rows] = await db.query(
            `SELECT p.id, p.patient_name, p.scan_name, p.referred_doctor, p.amount, IFNULL(p.referral_amount, 0) AS referral_amount
             FROM patients p
             WHERE p.clinic_id = ?
               AND COALESCE(p.created_at, p.upload_date) >= ?
               AND COALESCE(p.created_at, p.upload_date) < ?
             ORDER BY FIELD(p.scan_category, 'Ultrasound', 'CT'), p.id ASC`,
            [clinicId, fromStr, toStr]
          );
          results = rows;
        } catch (e) {
          const [rows] = await db.query(
            `SELECT p.id, p.patient_name, p.scan_name, p.referred_doctor, p.amount, IFNULL(p.referral_amount, 0) AS referral_amount
             FROM patients p WHERE p.clinic_id = ?
               AND COALESCE(p.created_at, p.upload_date) >= ?
               AND COALESCE(p.created_at, p.upload_date) < ?
             ORDER BY FIELD(p.scan_category, 'Ultrasound', 'CT'), p.id ASC`,
            [clinicId, fromStr, toStr]
          );
          results = rows;
        }

        const PDFDocument = require("pdfkit");
        const doc = new PDFDocument({ margin: 50, size: "A4" });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader("Content-Type", "application/pdf");
            const reportDate = dayjs(date, "YYYY-MM-DD", true).isValid()
              ? dayjs(date, "YYYY-MM-DD").format("DD-MM-YYYY")
              : dayjs(date).isValid()
                ? dayjs(date).format("DD-MM-YYYY")
                : String(date);
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${reportDate} REPORT.pdf`
            );
            res.setHeader("Content-Length", pdfData.length);
            res.send(pdfData);
        });

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 50;

        /* HEADER */
        doc.fontSize(20).font("Helvetica-Bold")
            .text(clinicName, { align: "center" });

        doc.fontSize(13).font("Helvetica")
            .text("Daily Financial Report", { align: "center" });

        doc.moveDown(0.5);
        const dispFrom = dayjs(fromStr).tz("Asia/Kolkata").format("DD/MM/YYYY hh:mm A");
        const dispTo = dayjs(toStr).tz("Asia/Kolkata").format("DD/MM/YYYY hh:mm A");
        doc.fontSize(10).text(`Report Range: ${dispFrom} to ${dispTo}`, { align: "center" });
        doc.moveDown(2);

        /* TABLE */
        const startX = margin;
        const rowHeight = 25;
        const colWidths = [35, 105, 85, 105, 60, 50, 55];
        const headers = ["S.No", "Patient", "Scan", "Doctor", "Total", "Ref", "Remain"];

        let y = doc.y;

        const drawHeader = () => {
            let x = startX;
            doc.font("Helvetica-Bold").fontSize(9);

            headers.forEach((header, i) => {
                doc.rect(x, y, colWidths[i], rowHeight).stroke();
                doc.text(header, x + 5, y + 8, {
                    width: colWidths[i] - 10,
                    lineBreak: false
                });
                x += colWidths[i];
            });

            y += rowHeight;
        };

        drawHeader();

        let totalRemaining = 0;
        let serialNumber = 1;

        results.forEach(row => {

            if (y + rowHeight > pageHeight - 150) {
                doc.addPage();
                y = margin;
                drawHeader();
            }

            const amount = Number(row.amount) || 0;
            const referral = Number(row.referral_amount) || 0;
            const remaining = amount - referral;

            totalRemaining += remaining;

            const rowData = [
                serialNumber++,
                row.patient_name,
                row.scan_name,
                row.referred_doctor || "-",
                amount.toFixed(2),
                referral.toFixed(2),
                remaining.toFixed(2)
            ];

            let xPos = startX;
            doc.font("Helvetica").fontSize(9);

            rowData.forEach((cell, i) => {
                doc.rect(xPos, y, colWidths[i], rowHeight).stroke();
                const alignRight = i >= 5 ? "right" : "left";

                doc.text(String(cell), xPos + 5, y + 8, {
                    width: colWidths[i] - 10,
                    align: alignRight,
                    lineBreak: false
                });

                xPos += colWidths[i];
            });

            y += rowHeight;
        });

        /* EXPENSES */
        let expenseRows;
        try {
          const [rows] = await db.query(
              `SELECT expense_date, description, amount FROM expenses WHERE clinic_id = ? AND COALESCE(created_at, expense_date) >= ? AND COALESCE(created_at, expense_date) < ? ORDER BY expense_date ASC`,
              [clinicId, fromStr, toStr]
          );
          expenseRows = rows;
        } catch (e) {
          const [rows] = await db.query(
              `SELECT expense_date, description, amount FROM expenses WHERE clinic_id = ? AND expense_date = ? ORDER BY expense_date ASC`,
              [clinicId, date]
          );
          expenseRows = rows;
        }

        const totalExpense = expenseRows.reduce(
            (sum, e) => sum + (Number(e.amount) || 0),
            0
        );

        // Removed expenses table drawing

        let extraRows;
        try {
          const [rows] = await db.query(
              `SELECT income_date, income_type, description, amount FROM extra_income WHERE clinic_id = ? AND COALESCE(created_at, income_date) >= ? AND COALESCE(created_at, income_date) < ? ORDER BY income_date ASC`,
              [clinicId, fromStr, toStr]
          );
          extraRows = rows;
        } catch (e) {
          const [rows] = await db.query(
              `SELECT income_date, income_type, description, amount FROM extra_income WHERE clinic_id = ? AND income_date = ? ORDER BY income_date ASC`,
              [clinicId, date]
          );
          extraRows = rows;
        }

        const totalExtra = extraRows.reduce(
            (sum, e) => sum + (Number(e.amount) || 0),
            0
        );

        const totalAmount = totalRemaining;
        const finalNet = totalAmount - totalExpense + totalExtra;

        if (y + 220 > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        /* FINANCIAL SUMMARY */

doc.moveDown(2);

doc.font("Helvetica-Bold")
   .fontSize(14)
   .text("Financial Summary", margin, doc.y);

doc.moveDown(0.5);

const labelX = margin;
const valueX = pageWidth - margin - 120;

const printRow = (label, value, bold = false) => {

    doc.font(bold ? "Helvetica-Bold" : "Helvetica")
       .fontSize(10);

    doc.text(label, labelX, doc.y, { lineBreak: false });

    doc.text(
        `Rs. ${value.toFixed(2)}`,
        valueX,
        doc.y,
        { align: "right", lineBreak: false }
    );

    doc.moveDown();
};

/* TOTAL AMOUNT */
printRow("Total Amount", totalAmount);

/* TOTAL EXPENSES */
if (totalExpense > 0) {

    printRow("Total Expenses", totalExpense, true);

    expenseRows.forEach((ex) => {

        const desc = ex.description || "-";
        const amt = Number(ex.amount) || 0;

        doc.font("Helvetica").fontSize(10);

        doc.text(
            `   - ${desc}`,
            labelX,
            doc.y,
            { lineBreak: false }
        );

        doc.text(
            `Rs. ${amt.toFixed(2)}`,
            valueX,
            doc.y,
            { align: "right", lineBreak: false }
        );

        doc.moveDown();
    });
}

/* EXTRA INCOME */
if (totalExtra > 0) {

    printRow("Extra Income", totalExtra, true);

    extraRows.forEach((ex) => {

        const desc = `${ex.income_type}: ${ex.description || "-"}`;
        const amt = Number(ex.amount) || 0;

        doc.font("Helvetica").fontSize(10);

        doc.text(
            `   - ${desc}`,
            labelX,
            doc.y,
            { lineBreak: false }
        );

        doc.text(
            `Rs. ${amt.toFixed(2)}`,
            valueX,
            doc.y,
            { align: "right", lineBreak: false }
        );

        doc.moveDown();
    });
}

doc.moveDown(0.5);
// ===== TOP LINE =====
const lineY1 = doc.y;

doc.moveTo(labelX, lineY1)
   .lineTo(pageWidth - margin, lineY1)
   .stroke();

// ===== TEXT =====
doc.moveDown(0.7);

const textY = doc.y;

doc.font("Helvetica-Bold")
   .fontSize(15)
   .text("FINAL NET COLLECTION", labelX, textY, {
     lineBreak: false
   });

doc.font("Helvetica-Bold")
   .fontSize(18)
   .text(
     `Rs. ${finalNet.toFixed(2)}`,
     valueX,
     textY,
     {
       width: 120,
       align: "right",
       lineBreak: false
     }
   );

// ===== BOTTOM LINE =====
const lineY2 = doc.y;

doc.moveTo(labelX, lineY2)
   .lineTo(pageWidth - margin, lineY2)
   .stroke();
            doc.moveDown(0.5);
            await drawSignature(doc, pageWidth, margin, clinicId);
            doc.end();

        } catch (error) {
                    console.error(error);
                    res.status(500).send("Error generating PDF");
                }
            });

/* =========================================
   SETTLEMENT PDF REPORT (By Settlement ID)
========================================= */
router.get("/settlement-pdf/:settlementId", protect, authorize("admin"), async (req, res) => {
    try {
        const clinicId = req.user?.clinic_id ?? 1;
        const { settlementId } = req.params;

        const [clinicRows] = await db.query(
          "SELECT name FROM clinics WHERE id = ?",
          [clinicId]
        );
        const clinicName = clinicRows[0]?.name || "SRIDEVI CT SCAN & DIAGNOSTIC CENTER";

        // Get the specific settlement details
        const [settlementRows] = await db.query(
            `SELECT from_time, to_time, amount FROM settlements WHERE clinic_id = ? AND id = ?`,
            [clinicId, settlementId]
        );

        if (!settlementRows[0]) {
            return res.status(404).json({ message: "Settlement not found" });
        }

        const settlement = settlementRows[0];
        const from = settlement.from_time instanceof Date ? dayjs(settlement.from_time).tz("Asia/Kolkata") : dayjs(String(settlement.from_time)).tz("Asia/Kolkata");
        const to = settlement.to_time instanceof Date ? dayjs(settlement.to_time).tz("Asia/Kolkata") : dayjs(String(settlement.to_time)).tz("Asia/Kolkata");

        const fromStr = from.format("YYYY-MM-DD HH:mm:ss");
        const toStr = to.format("YYYY-MM-DD HH:mm:ss");

        let results;
        try {
            const [rows] = await db.query(
                `SELECT p.id, p.patient_name, p.scan_name, p.referred_doctor, p.amount, IFNULL(p.referral_amount, 0) AS referral_amount
                 FROM patients p
                 WHERE p.clinic_id = ? AND COALESCE(p.created_at, p.upload_date) >= ? AND COALESCE(p.created_at, p.upload_date) < ?
                 ORDER BY FIELD(p.scan_category, 'Ultrasound', 'CT'), p.id ASC`,
                [clinicId, fromStr, toStr]
            );
            results = rows;
        } catch (e) {
            // Fallback query if created_at doesn't exist
            const [rows] = await db.query(
                `SELECT p.id, p.patient_name, p.scan_name, p.referred_doctor, p.amount, IFNULL(p.referral_amount, 0) AS referral_amount
                 FROM patients p WHERE p.clinic_id = ? AND DATE(COALESCE(p.created_at, p.upload_date)) BETWEEN ? AND ?
                 ORDER BY FIELD(p.scan_category, 'Ultrasound', 'CT'), p.id ASC`,
                [clinicId, from.format("YYYY-MM-DD"), to.format("YYYY-MM-DD")]
            );
            results = rows;
        }

        const PDFDocument = require("pdfkit");
        const doc = new PDFDocument({ margin: 50, size: "A4" });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=settlement-report-${settlementId}-${from.format("YYYY-MM-DD")}.pdf`
            );
            res.setHeader("Content-Length", pdfData.length);
            res.send(pdfData);
        });

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 50;

        /* ================= HEADER ================= */

        doc.fontSize(20)
            .font("Helvetica-Bold")
            .text(clinicName, { align: "center" });

        doc.fontSize(13)
            .font("Helvetica")
            .text("Settlement Report", { align: "center" });

        doc.moveDown(0.5);

        doc.font("Helvetica-Bold")
            .fontSize(12)
            .text(`Settlement Period: ${from.format("DD/MM/YYYY hh:mm A")} - ${to.format("DD/MM/YYYY hh:mm A")}`, margin);

        doc.font("Helvetica")
            .fontSize(10)
            .text(`Settlement Amount: Rs. ${Number(settlement.amount).toFixed(2)}`);

        doc.text(
            `Generated On: ${dayjs().tz("Asia/Kolkata").format("DD/MM/YYYY hh:mm A")}`,
            { align: "right" }
        );

        doc.moveDown(2);

        /* ================= PATIENT TABLE ================= */

        const startX = margin;
        const rowHeight = 25;
        const colWidths = [35, 105, 85, 105, 60, 50, 55];
        const headers = ["S.No", "Patient", "Scan", "Doctor", "Total", "Ref", "Remain"];

        let y = doc.y;

        const drawHeader = () => {
            let x = startX;
            doc.font("Helvetica-Bold").fontSize(9);

            headers.forEach((header, i) => {
                doc.rect(x, y, colWidths[i], rowHeight).stroke();
                doc.text(header, x + 5, y + 8, {
                    width: colWidths[i] - 10,
                    lineBreak: false
                });
                x += colWidths[i];
            });

            y += rowHeight;
        };

        drawHeader();

        let totalRemaining = 0;
        let serialNumber = 1;

        results.forEach(row => {

            if (y + rowHeight > pageHeight - 150) {
                doc.addPage();
                y = margin;
                drawHeader();
            }

            const remaining = Number(row.amount) - Number(row.referral_amount);

            const rowData = [
                serialNumber++,
                row.patient_name,
                row.scan_name,
                row.referred_doctor || "",
                Number(row.amount).toFixed(2),
                Number(row.referral_amount).toFixed(2),
                remaining.toFixed(2)
            ];

            let x = startX;

            doc.font("Helvetica").fontSize(9);

            rowData.forEach((cell, i) => {

                doc.rect(x, y, colWidths[i], rowHeight).stroke();

                const alignRight = i >= 4 ? "right" : "left";

                doc.text(String(cell), x + 5, y + 8, {
                    width: colWidths[i] - 10,
                    align: alignRight,
                    lineBreak: false
                });

                x += colWidths[i];
            });

            y += rowHeight;
            totalRemaining += remaining;
        });

        /* ================= EXPENSES ================= */

        let expenseRows;
        try {
            const [rows] = await db.query(
                `SELECT expense_date, description, amount FROM expenses WHERE clinic_id = ? AND COALESCE(created_at, expense_date) >= ? AND COALESCE(created_at, expense_date) < ? ORDER BY expense_date ASC`,
                [clinicId, fromStr, toStr]
            );
            expenseRows = rows;
        } catch (e) {
            const [rows] = await db.query(
                `SELECT expense_date, description, amount FROM expenses WHERE clinic_id = ? AND expense_date BETWEEN ? AND ? ORDER BY expense_date ASC`,
                [clinicId, from.format("YYYY-MM-DD"), to.format("YYYY-MM-DD")]
            );
            expenseRows = rows;
        }

        const totalExpense = expenseRows.reduce(
            (sum, e) => sum + (Number(e.amount) || 0),
            0
        );

        /* ================= EXTRA INCOME ================= */

        let extraRows;
        try {
            const [rows] = await db.query(
                `SELECT income_date, income_type, description, amount FROM extra_income WHERE clinic_id = ? AND COALESCE(created_at, income_date) >= ? AND COALESCE(created_at, income_date) < ? ORDER BY income_date ASC`,
                [clinicId, fromStr, toStr]
            );
            extraRows = rows;
        } catch (e) {
            const [rows] = await db.query(
                `SELECT income_date, income_type, description, amount FROM extra_income WHERE clinic_id = ? AND income_date BETWEEN ? AND ? ORDER BY income_date ASC`,
                [clinicId, from.format("YYYY-MM-DD"), to.format("YYYY-MM-DD")]
            );
            extraRows = rows;
        }

        const totalExtra = extraRows.reduce(
            (sum, e) => sum + (Number(e.amount) || 0),
            0
        );

        const totalAmount = totalRemaining;
        const finalNet = totalAmount - totalExpense + totalExtra;

        if (y + 220 > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

/* ================= CLEAN EXPANDED SUMMARY ================= */

doc.moveDown(2);

const leftX = margin;
const rightX = pageWidth - margin - 120;
let yPos = doc.y;

// Title
doc.font("Helvetica-Bold")
   .fontSize(14)
   .text("Financial Summary", leftX, yPos);

yPos += 25;

// ===== Total Patient Income =====
doc.font("Helvetica")
   .fontSize(11)
   .text("Total Patient Income", leftX, yPos);

doc.font("Helvetica-Bold")
   .text(`Rs. ${totalAmount.toFixed(2)}`, rightX, yPos, {
     width: 120,
     align: "right"
   });

yPos += 20;

// ===== Total Expenses =====
doc.font("Helvetica-Bold")
   .text("Total Expenses", leftX, yPos);

doc.text(`Rs. ${totalExpense.toFixed(2)}`, rightX, yPos, {
  width: 120,
  align: "right"
});

yPos += 18;

// 👉 Expense Breakdown
doc.font("Helvetica").fontSize(10);

expenseRows.forEach(e => {
  doc.text(`- ${e.description || "Expense"}`, leftX + 15, yPos);

  doc.text(`Rs. ${Number(e.amount).toFixed(2)}`, rightX, yPos, {
    width: 120,
    align: "right"
  });

  yPos += 5;
});

yPos += 10;

// ===== Extra Income =====
doc.font("Helvetica-Bold")
   .fontSize(11)
   .text("Extra Income", leftX, yPos);

doc.text(`Rs. ${totalExtra.toFixed(2)}`, rightX, yPos, {
  width: 120,
  align: "right"
});

yPos += 18;

// 👉 Extra Income Breakdown
doc.font("Helvetica").fontSize(10);

extraRows.forEach(e => {
  doc.text(`- ${e.description || e.income_type || "Income"}`, leftX + 15, yPos);

  doc.text(`Rs. ${Number(e.amount).toFixed(2)}`, rightX, yPos, {
    width: 120,
    align: "right"
  });

  yPos += 10;
});

yPos += 10;

// ===== FINAL NET SECTION =====

// Divider line
doc.moveTo(leftX, yPos).lineTo(pageWidth - margin, yPos).stroke();

yPos += 10;

doc.font("Helvetica-Bold")
   .fontSize(14)
   .text("FINAL NET COLLECTION", leftX, yPos);

doc.font("Helvetica-Bold")
   .fontSize(18)
   .text(`Rs. ${finalNet.toFixed(2)}`, rightX - 20, yPos, {
     width: 140,
     align: "right"
   });

yPos += 25;

// Bottom divider
doc.moveTo(leftX, yPos).lineTo(pageWidth - margin, yPos).stroke();
        doc.moveDown(1);
        await drawSignature(doc, pageWidth, margin, clinicId);
        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating settlement PDF");
    }
});

/* =========================================
   GET SETTLEMENT HISTORY
========================================= */
router.get("/settlement-history", protect, authorize("admin", "staff"), async (req, res) => {
    try {
        const clinicId = req.user?.clinic_id ?? 1;

        const [rows] = await db.query(
            `SELECT id, from_time, to_time, amount, created_at
             FROM settlements
             WHERE clinic_id = ?
             ORDER BY created_at DESC`,
            [clinicId]
        );

        // Format the datetime fields for frontend
        const formattedRows = rows.map(row => ({
            id: row.id,
            from_time: row.from_time instanceof Date ? dayjs(row.from_time).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss") : dayjs(String(row.from_time)).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
            to_time: row.to_time instanceof Date ? dayjs(row.to_time).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss") : dayjs(String(row.to_time)).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
            amount: Number(row.amount),
            created_at: row.created_at instanceof Date ? dayjs(row.created_at).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss") : dayjs(String(row.created_at)).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")
        }));

        res.json(formattedRows);

    } catch (error) {
        console.error("Settlement history error:", error);
        res.status(500).json({ message: "Error fetching settlement history" });
    }
});

/* =========================================
   DASHBOARD SUMMARY
   (for dashboard cards - filters by last settlement time)
========================================= */
router.get("/dashboard-summary", protect, authorize("admin"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    
    // Get today's data in IST
    const today = dayjs().tz("Asia/Kolkata");
    const todayStr = today.format("YYYY-MM-DD");
    const todayStart = today.format("YYYY-MM-DD 00:00:00");
    const todayEnd = today.add(1, 'day').format("YYYY-MM-DD 00:00:00");
    
    // Get current month data
    const currentMonthStart = today.startOf('month').format("YYYY-MM-DD 00:00:00");
    const currentMonthEnd = today.endOf('month').add(1, 'day').format("YYYY-MM-DD 00:00:00");
    
    // Get last month data
    const lastMonth = today.subtract(1, 'month');
    const lastMonthStart = lastMonth.startOf('month').format("YYYY-MM-DD 00:00:00");
    const lastMonthEnd = lastMonth.endOf('month').add(1, 'day').format("YYYY-MM-DD 00:00:00");
    
    const [todayPatients] = await db.query(
      `SELECT
        IFNULL(SUM(CASE WHEN scan_category = 'Ultrasound' THEN amount - IFNULL(referral_amount, 0) END), 0) AS ultrasound_income,
        IFNULL(SUM(CASE WHEN scan_category = 'CT' THEN amount - IFNULL(referral_amount, 0) END), 0) AS ct_income
      FROM patients 
      WHERE clinic_id = ? AND COALESCE(created_at, upload_date) >= ? AND COALESCE(created_at, upload_date) < ?`,
      [clinicId, todayStart, todayEnd]
    );

    const [todayExtra] = await db.query(
      `SELECT IFNULL(SUM(CASE WHEN income_type = 'USG' THEN amount ELSE 0 END), 0) AS extra_usg,
              IFNULL(SUM(CASE WHEN income_type = 'CT' THEN amount ELSE 0 END), 0) AS extra_ct,
              IFNULL(SUM(CASE WHEN income_type = 'XRAY' THEN amount ELSE 0 END), 0) AS extra_xray,
              IFNULL(SUM(CASE WHEN income_type = 'Other' THEN amount ELSE 0 END), 0) AS extra_other
       FROM extra_income 
       WHERE clinic_id = ? AND COALESCE(created_at, income_date) >= ? AND COALESCE(created_at, income_date) < ?`,
      [clinicId, todayStart, todayEnd]
    );

    const [todayExpenses] = await db.query(
      `SELECT IFNULL(SUM(amount), 0) AS total_expense 
       FROM expenses 
       WHERE clinic_id = ? AND COALESCE(created_at, expense_date) >= ? AND COALESCE(created_at, expense_date) < ?`,
      [clinicId, todayStart, todayEnd]
    );

    // Get current month totals
    const [currentMonthPatients] = await db.query(
      `SELECT
        IFNULL(SUM(CASE WHEN scan_category = 'Ultrasound' THEN amount - IFNULL(referral_amount, 0) END), 0) AS ultrasound_income,
        IFNULL(SUM(CASE WHEN scan_category = 'CT' THEN amount - IFNULL(referral_amount, 0) END), 0) AS ct_income
      FROM patients 
      WHERE clinic_id = ? AND COALESCE(created_at, upload_date) >= ? AND COALESCE(created_at, upload_date) < ?`,
      [clinicId, currentMonthStart, currentMonthEnd]
    );

    const [currentMonthExtra] = await db.query(
      `SELECT IFNULL(SUM(CASE WHEN income_type = 'USG' THEN amount ELSE 0 END), 0) AS extra_usg,
              IFNULL(SUM(CASE WHEN income_type = 'CT' THEN amount ELSE 0 END), 0) AS extra_ct,
              IFNULL(SUM(CASE WHEN income_type = 'XRAY' THEN amount ELSE 0 END), 0) AS extra_xray,
              IFNULL(SUM(CASE WHEN income_type = 'Other' THEN amount ELSE 0 END), 0) AS extra_other
       FROM extra_income 
       WHERE clinic_id = ? AND COALESCE(created_at, income_date) >= ? AND COALESCE(created_at, income_date) < ?`,
      [clinicId, currentMonthStart, currentMonthEnd]
    );

    const [currentMonthExpenses] = await db.query(
      `SELECT IFNULL(SUM(amount), 0) AS total_expense 
       FROM expenses 
       WHERE clinic_id = ? AND COALESCE(created_at, expense_date) >= ? AND COALESCE(created_at, expense_date) < ?`,
      [clinicId, currentMonthStart, currentMonthEnd]
    );

    // Get last month totals
    const [lastMonthPatients] = await db.query(
      `SELECT
        IFNULL(SUM(CASE WHEN scan_category = 'Ultrasound' THEN amount - IFNULL(referral_amount, 0) END), 0) AS ultrasound_income,
        IFNULL(SUM(CASE WHEN scan_category = 'CT' THEN amount - IFNULL(referral_amount, 0) END), 0) AS ct_income
      FROM patients 
      WHERE clinic_id = ? AND COALESCE(created_at, upload_date) >= ? AND COALESCE(created_at, upload_date) < ?`,
      [clinicId, lastMonthStart, lastMonthEnd]
    );

    const [lastMonthExtra] = await db.query(
      `SELECT IFNULL(SUM(CASE WHEN income_type = 'USG' THEN amount ELSE 0 END), 0) AS extra_usg,
              IFNULL(SUM(CASE WHEN income_type = 'CT' THEN amount ELSE 0 END), 0) AS extra_ct,
              IFNULL(SUM(CASE WHEN income_type = 'XRAY' THEN amount ELSE 0 END), 0) AS extra_xray,
              IFNULL(SUM(CASE WHEN income_type = 'Other' THEN amount ELSE 0 END), 0) AS extra_other
       FROM extra_income 
       WHERE clinic_id = ? AND COALESCE(created_at, income_date) >= ? AND COALESCE(created_at, income_date) < ?`,
      [clinicId, lastMonthStart, lastMonthEnd]
    );

    const [lastMonthExpenses] = await db.query(
      `SELECT IFNULL(SUM(amount), 0) AS total_expense 
       FROM expenses 
       WHERE clinic_id = ? AND COALESCE(created_at, expense_date) >= ? AND COALESCE(created_at, expense_date) < ?`,
      [clinicId, lastMonthStart, lastMonthEnd]
    );

    // Get all-time totals for income and expenses
    const [allTimePatients] = await db.query(
      `SELECT
        IFNULL(SUM(CASE WHEN scan_category = 'Ultrasound' THEN amount - IFNULL(referral_amount, 0) END), 0) AS ultrasound_income,
        IFNULL(SUM(CASE WHEN scan_category = 'CT' THEN amount - IFNULL(referral_amount, 0) END), 0) AS ct_income
      FROM patients WHERE clinic_id = ?`,
      [clinicId]
    );

    const [allTimeExtra] = await db.query(
      `SELECT IFNULL(SUM(CASE WHEN income_type = 'USG' THEN amount ELSE 0 END), 0) AS extra_usg,
              IFNULL(SUM(CASE WHEN income_type = 'CT' THEN amount ELSE 0 END), 0) AS extra_ct,
              IFNULL(SUM(CASE WHEN income_type = 'XRAY' THEN amount ELSE 0 END), 0) AS extra_xray,
              IFNULL(SUM(CASE WHEN income_type = 'Other' THEN amount ELSE 0 END), 0) AS extra_other
       FROM extra_income WHERE clinic_id = ?`,
      [clinicId]
    );

    const [allTimeExpenses] = await db.query(
      `SELECT IFNULL(SUM(amount), 0) AS total_expense FROM expenses WHERE clinic_id = ?`,
      [clinicId]
    );

    // Get total settled amount - ONLY FOR TOTAL COUNTER CALCULATION
    const [settlementTotal] = await db.query(
      `SELECT IFNULL(SUM(amount), 0) AS total_settled FROM settlements WHERE clinic_id = ?`,
      [clinicId]
    );

    // Today's calculations
    const todayUltrasoundIncome = Number(todayPatients[0].ultrasound_income || 0) + Number(todayExtra[0].extra_usg || 0);
    const todayCTIncome = Number(todayPatients[0].ct_income || 0) + Number(todayExtra[0].extra_ct || 0);
    const todayOtherIncome = Number(todayExtra[0].extra_xray || 0) + Number(todayExtra[0].extra_other || 0);
    const todayExpense = Number(todayExpenses[0].total_expense || 0);
    const todayNet = todayUltrasoundIncome + todayCTIncome + todayOtherIncome - todayExpense;

    // Current month calculations
    const currentMonthUltrasound = Number(currentMonthPatients[0].ultrasound_income || 0) + Number(currentMonthExtra[0].extra_usg || 0);
    const currentMonthCT = Number(currentMonthPatients[0].ct_income || 0) + Number(currentMonthExtra[0].extra_ct || 0);
    const currentMonthOther = Number(currentMonthExtra[0].extra_xray || 0) + Number(currentMonthExtra[0].extra_other || 0);
    const currentMonthExpense = Number(currentMonthExpenses[0].total_expense || 0);
    const currentMonthNet = currentMonthUltrasound + currentMonthCT + currentMonthOther - currentMonthExpense;

    // Last month calculations
    const lastMonthUltrasound = Number(lastMonthPatients[0].ultrasound_income || 0) + Number(lastMonthExtra[0].extra_usg || 0);
    const lastMonthCT = Number(lastMonthPatients[0].ct_income || 0) + Number(lastMonthExtra[0].extra_ct || 0);
    const lastMonthOther = Number(lastMonthExtra[0].extra_xray || 0) + Number(lastMonthExtra[0].extra_other || 0);
    const lastMonthExpense = Number(lastMonthExpenses[0].total_expense || 0);
    const lastMonthNet = lastMonthUltrasound + lastMonthCT + lastMonthOther - lastMonthExpense;

    // All-time calculations
    const totalUltrasound = Number(allTimePatients[0].ultrasound_income || 0) + Number(allTimeExtra[0].extra_usg || 0);
    const totalCT = Number(allTimePatients[0].ct_income || 0) + Number(allTimeExtra[0].extra_ct || 0);
    const totalExpense = Number(allTimeExpenses[0].total_expense || 0);
    const totalOther = Number(allTimeExtra[0].extra_xray || 0) + Number(allTimeExtra[0].extra_other || 0);
    const totalSettled = Number(settlementTotal[0].total_settled || 0);

    const overallIncome = totalUltrasound + totalCT + totalOther;
    const overallNet = overallIncome - totalExpense;
    
    // Get referral balance
    const [referralBalanceRows] = await db.query(
      `SELECT IFNULL(SUM(referral_amount), 0) AS referral_balance FROM patients 
       WHERE clinic_id = ? AND (referral_status <> 'Paid' OR referral_status IS NULL)`,
      [clinicId]
    );
    const referralBalance = Number(referralBalanceRows[0].referral_balance || 0);
    
    // Total Counter = (All-time Income - All-time Expenses) - Total Settled + Referral Balance
    const totalCounter = overallNet - totalSettled + referralBalance;

    res.json({
      /* Today's data */
      todayUltrasoundIncome,
      todayCTIncome,
      todayOtherIncome,
      todayExpense,
      todayNet,
      
      /* Current month data */
      currentMonthUltrasound,
      currentMonthCT,
      currentMonthOther,
      currentMonthExpense,
      currentMonthNet,
      
      /* Last month data */
      lastMonthUltrasound,
      lastMonthCT,
      lastMonthOther,
      lastMonthExpense,
      lastMonthNet,
      
      /* All-time totals */
      totalUltrasound,
      totalCT,
      overallNet,
      
      /* Total Counter (Updated: all-time income/expenses - settled) */
      totalCounter,
      
      /* Balance */
      referralBalance
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      message: "Dashboard summary error",
      error: error.message
    });
  }
});
/* =========================================
   UPLOAD SIGNATURE
========================================= */
router.post("/upload-signature", protect, authorize("admin"), uploadSignature.single("signature"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const clinicId = req.user?.clinic_id ?? 1;
    const filePath = req.file.path;

    await db.query(
      "INSERT INTO clinic_signature (clinic_id, file_path) VALUES (?, ?)",
      [clinicId, filePath]
    );

    res.json({
      message: "Signature uploaded successfully",
      filePath
    });
  } catch (error) {
    console.error("Upload signature error:", error);
    res.status(500).json({ message: "Failed to upload signature" });
  }
});

/* =========================================
   GET CURRENT SIGNATURE
========================================= */
router.get("/current-signature", protect, authorize("admin"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      "SELECT file_path FROM clinic_signature WHERE clinic_id = ? ORDER BY id DESC LIMIT 1",
      [clinicId]
    );

    if (rows.length > 0) {
      // Normalize path separators for web URLs
      const normalizedPath = rows[0].file_path.replace(/\\/g, '/');
      res.json({ filePath: normalizedPath });
    } else {
      res.json({ filePath: null });
    }
  } catch (error) {
    console.error("Get current signature error:", error);
    res.status(500).json({ message: "Failed to get current signature" });
  }
});

/* =========================================
   GET SIGNATURE IMAGE
========================================= */
router.get("/signature-image", protect, authorize("admin"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;

    const [rows] = await db.query(
      "SELECT file_path FROM clinic_signature WHERE clinic_id = ? ORDER BY id DESC LIMIT 1",
      [clinicId]
    );

    if (rows.length > 0) {
      return res.json({ filePath: rows[0].file_path });
    }

    res.status(404).json({ message: "No signature found" });

  } catch (error) {
    console.error("Get signature image error:", error);
    res.status(500).json({ message: "Failed to get signature image" });
  }
});

/* =========================================
   GET ALL SIGNATURES
========================================= */
router.get("/signatures", protect, authorize("admin"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      "SELECT id, file_path FROM clinic_signature WHERE clinic_id = ? ORDER BY id DESC",
      [clinicId]
    );
    res.json({ signatures: rows });
  } catch (error) {
    console.error("Get signatures error:", error);
    res.status(500).json({ message: "Failed to get signatures" });
  }
});

/* =========================================
   GET SIGNATURE BY ID
========================================= */
router.get("/signature/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;

    const [rows] = await db.query(
      "SELECT file_path FROM clinic_signature WHERE id = ? AND clinic_id = ?",
      [req.params.id, clinicId]
    );

    if (rows.length > 0) {
      return res.json({ filePath: rows[0].file_path });
    }

    res.status(404).json({ message: "Signature not found" });

  } catch (error) {
    console.error("Get signature by id error:", error);
    res.status(500).json({ message: "Failed to get signature" });
  }
});

/* =========================================
   SET CURRENT SIGNATURE
========================================= */
router.post("/signature/:id/set-current", protect, authorize("admin"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const [rows] = await db.query(
      "SELECT file_path FROM clinic_signature WHERE id = ? AND clinic_id = ?",
      [req.params.id, clinicId]
    );

    if (rows.length > 0) {
      res.json({ message: "Signature selected", filePath: rows[0].file_path });
    } else {
      res.status(404).json({ message: "Signature not found" });
    }
  } catch (error) {
    console.error("Set current signature error:", error);
    res.status(500).json({ message: "Failed to set signature" });
  }
});

/* =========================================
   DELETE SIGNATURE
========================================= */
router.delete("/signature/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;

    const [rows] = await db.query(
      "SELECT file_path FROM clinic_signature WHERE id = ? AND clinic_id = ?",
      [req.params.id, clinicId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Signature not found" });
    }

    const cloudinary = require("../config/cloudinary");

    const url = rows[0].file_path;

    // extract public_id
    const parts = url.split("/");
    const fileName = parts[parts.length - 1];
    const publicId = `clinic-signatures/${fileName.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);

    await db.query("DELETE FROM clinic_signature WHERE id = ?", [req.params.id]);

    res.json({ message: "Signature deleted successfully" });

  } catch (error) {
    console.error("Delete signature error:", error);
    res.status(500).json({ message: "Failed to delete signature" });
  }
});

/* =========================================
   GET ALL SCANS FOR INVOICE (for WhatsApp)
========================================= */
router.get("/invoice/scans/:invoiceId", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const invoiceId = req.params.invoiceId;
    console.log("Fetching scans for invoice:", invoiceId, "clinic:", clinicId);

    const [rows] = await db.query(
      "SELECT * FROM patients WHERE invoice_id = ? AND clinic_id = ? ORDER BY upload_date ASC, id ASC",
      [invoiceId, clinicId]
    );

    console.log("Found scans:", rows.length);
    if (!rows.length) {
      return res.status(404).json({ message: "No scans found for this invoice" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Get invoice scans error:", error);
    res.status(500).json({ message: "Failed to fetch invoice scans" });
  }
});

/* =========================================
   GENERATE INVOICE PDF
========================================= */
router.get("/invoice/pdf/:invoiceId", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;

    // First, fetch the patient to get clinic_id
    const [patientRows] = await db.query(
      "SELECT * FROM patients WHERE invoice_id = ? ORDER BY upload_date ASC, id ASC",
      [invoiceId]
    );
    if (!patientRows.length) return res.status(404).json({ message: "Patient not found" });

    const patientData = patientRows[0];
    const clinicId = patientData?.clinic_id ?? 1;
    console.log("Generating invoice PDF for:", invoiceId, "clinic:", clinicId);

    const [clinicRows] = await db.query(
      "SELECT name, address, phone FROM clinics WHERE id = ?",
      [clinicId]
    );
    const clinicName = clinicRows[0]?.name || "";
    const clinicAddress = clinicRows[0]?.address || "";
    const clinicPhone = clinicRows[0]?.phone || "";

    const rows = patientRows;

    const PDFDocument = require("pdfkit");
    const dayjs = require("dayjs");

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${patientData.invoice_id}.pdf`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const margin = 50;
    const rightX = pageWidth - margin;

    const invoiceNo = String(patientData.invoice_id).padStart(6, "0");

    // ===== CALCULATE TOTAL AMOUNT FROM ALL SCANS =====
    let totalAmount = 0;
    rows.forEach((row) => {
      const amount = Number(String(row.amount).replace(/[^\d.]/g, "")) || 0;
      totalAmount += amount;
    });
    const formattedTotal = totalAmount.toFixed(2);

    // ================= HEADER =================
    doc.font("Helvetica-Bold").fontSize(18);
    doc.text(clinicName, margin, 50);

    doc.font("Helvetica").fontSize(11);
    doc.text(clinicAddress, margin, 75);
    doc.text(`Phone: ${clinicPhone}`, margin, 90);

    // ================= INVOICE INFO =================
    doc.font("Helvetica-Bold").fontSize(13);
    doc.text("INVOICE", rightX - 100, 50, { width: 100, align: "right" });

    doc.font("Helvetica").fontSize(11);
    doc.text(`Invoice No: ${invoiceNo}`, rightX - 150, 75, { width: 150, align: "right" });
    doc.text(
      `Date: ${dayjs(patientData.upload_date).format("DD/MM/YYYY")}`,
      rightX - 150,
      90,
      { width: 150, align: "right" }
    );

    // LINE
    doc.moveTo(margin, 120).lineTo(rightX, 120).stroke();

    // ================= PATIENT DETAILS =================
    const infoY = 140;

    doc.font("Helvetica-Bold").fontSize(13);

    doc.text(`Patient Name: ${patientData.patient_name}`, margin, infoY);
    doc.text(`Age: ${patientData.age}`, margin, infoY + 25);
    doc.text(`Gender: ${patientData.gender}`, margin, infoY + 50);

    // ================= TABLE =================
    const tableTop = 240;

    const col1 = margin;
    const col2 = margin + 50;
    const col3 = 250;
    const col4 = rightX - 60;

    doc.font("Helvetica-Bold").fontSize(12);

    doc.text("SL No", col1, tableTop);
    doc.text("Date", col2, tableTop);
    doc.text("Scan", col3, tableTop);
    doc.text("Amount", col4, tableTop, { width: 60, align: "center" });

    doc.moveTo(margin, tableTop + 18).lineTo(rightX, tableTop + 18).stroke();

    // ================= TABLE ROWS (ALL SCANS) =================
    let currentY = tableTop + 30;
    doc.font("Helvetica").fontSize(12);

    const baseRowHeight = 25;

    rows.forEach((row, index) => {
      const amount = Number(String(row.amount).replace(/[^\d.]/g, "")) || 0;
      const formattedAmount = amount.toFixed(2);
      const slNo = index + 1;
      const scanText = row.scan_name || "-";

      const scanTextHeight = doc.heightOfString(scanText, {
        width: col4 - col3 - 10,
        align: "left",
        lineBreak: true,
      });

      const rowHeightActual = Math.max(baseRowHeight, scanTextHeight + 12);

      if (currentY + rowHeightActual > doc.page.height - 50) {
        doc.addPage();
        currentY = tableTop + 30;
        doc.font("Helvetica-Bold").fontSize(12);
        doc.text("SL No", col1, tableTop);
        doc.text("Date", col2, tableTop);
        doc.text("Scan", col3, tableTop);
        doc.text("Amount", col4, tableTop, { width: 60, align: "center" });
        doc.moveTo(margin, tableTop + 18).lineTo(rightX, tableTop + 18).stroke();
        doc.font("Helvetica").fontSize(12);
      }

      doc.text(String(slNo), col1, currentY);
      doc.text(dayjs(row.upload_date).format("DD-MM-YYYY"), col2, currentY);
      doc.text(scanText, col3, currentY, {
        width: col4 - col3 - 10,
        align: "left",
        lineBreak: true,
      });
      doc.text(`Rs. ${formattedAmount}`, col4, currentY, {
        width: 100,
        align: "left",
        lineBreak: false,
      });

      currentY += rowHeightActual;
    });

    doc.moveTo(margin, currentY).lineTo(rightX, currentY).stroke();

    // ================= TOTAL =================
    const totalY = currentY + 20;

    doc.font("Helvetica-Bold").fontSize(14);
    doc.text(
      `Total Amount: Rs. ${formattedTotal}`,
      col2,
      totalY,
      {
        width: rightX - col2,
        align: "right",
        lineBreak: false
      }
    );

    // ================= THANK YOU =================
    doc.font("Helvetica-Bold").fontSize(12);

    doc.text("Thank you for visiting", 0, totalY + 50, {
      align: "center"
    });

    // ================= SIGNATURE (COPIED FROM YOUR REPORT) =================
    await drawSignature(doc, pageWidth, margin, clinicId);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
});
/* =========================================
   PUBLIC INVOICE PDF (No Login)
========================================= */
router.get("/invoice/public/:invoiceId", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM patients WHERE invoice_id = ? ORDER BY upload_date ASC, id ASC",
      [req.params.invoiceId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const patientData = rows[0];
    const clinicId = patientData?.clinic_id ?? 1;

    const [clinicRows] = await db.query(
      "SELECT name, address, phone FROM clinics WHERE id = ?",
      [clinicId]
    );

    const clinicName = clinicRows[0]?.name || "";
    const clinicAddress = clinicRows[0]?.address || "";
    const clinicPhone = clinicRows[0]?.phone || "";

    const PDFDocument = require("pdfkit");
    const dayjs = require("dayjs");

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");

    // WhatsApp's in-app browser often fails to "download" forced attachments.
    // Support both modes:
    // - default: inline (opens in browser PDF viewer)
    // - ?download=1: attachment (forces download)
    const invoiceFilename = `invoice-${patientData.invoice_id}.pdf`;
    const downloadMode = String(req.query.download || "") === "1";
    res.setHeader(
      "Content-Disposition",
      `${downloadMode ? "attachment" : "inline"}; filename=${invoiceFilename}`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const margin = 50;
    const rightX = pageWidth - margin;

    const invoiceNo = String(patientData.invoice_id).padStart(6, "0");

    // ===== CALCULATE TOTAL AMOUNT FROM ALL SCANS =====
    let totalAmount = 0;
    rows.forEach((row) => {
      const amount = Number(String(row.amount).replace(/[^\d.]/g, "")) || 0;
      totalAmount += amount;
    });
    const formattedTotal = totalAmount.toFixed(2);

    doc.font("Helvetica-Bold").fontSize(18);
    doc.text(clinicName, margin, 50);

    doc.font("Helvetica").fontSize(11);
    doc.text(clinicAddress, margin, 75);
    doc.text(`Phone: ${clinicPhone}`, margin, 90);

    doc.font("Helvetica-Bold").fontSize(13);
    doc.text("INVOICE", rightX - 100, 50, { width: 100, align: "right" });

    doc.font("Helvetica").fontSize(11);
    doc.text(`Invoice No: ${invoiceNo}`, rightX - 150, 75, { width: 150, align: "right" });
    doc.text(
      `Date: ${dayjs(patientData.upload_date).format("DD/MM/YYYY")}`,
      rightX - 150,
      90,
      { width: 150, align: "right" }
    );

    doc.moveTo(margin, 120).lineTo(rightX, 120).stroke();

    const infoY = 140;
    doc.font("Helvetica-Bold").fontSize(13);
    doc.text(`Patient Name: ${patientData.patient_name}`, margin, infoY);
    doc.text(`Age: ${patientData.age}`, margin, infoY + 25);
    doc.text(`Gender: ${patientData.gender}`, margin, infoY + 50);

    const tableTop = 240;
    const col1 = margin;
    const col2 = margin + 50;
    const col3 = 250;
    const col4 = rightX - 60;

    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("SL No", col1, tableTop);
    doc.text("Date", col2, tableTop);
    doc.text("Scan", col3, tableTop);
    doc.text("Amount", col4, tableTop, { width: 60, align: "center" });

    doc.moveTo(margin, tableTop + 18).lineTo(rightX, tableTop + 18).stroke();

    // ================= TABLE ROWS (ALL SCANS) =================
    let currentY = tableTop + 30;
    doc.font("Helvetica").fontSize(12);

    rows.forEach((row, index) => {
      const amount = Number(String(row.amount).replace(/[^\d.]/g, "")) || 0;
      const formattedAmount = amount.toFixed(2);
      const slNo = index + 1;

      doc.text(String(slNo), col1, currentY);
      doc.text(dayjs(row.upload_date).format("DD-MM-YYYY"), col2, currentY);
      doc.text(row.scan_name || "-", col3, currentY);
      doc.text(`Rs. ${formattedAmount}`, col4, currentY, { 
        width: 100, 
        align: "left", 
        lineBreak: false 
      });

      currentY += 25;
    });

    doc.moveTo(margin, currentY).lineTo(rightX, currentY).stroke();

    const totalY = currentY + 20;
    doc.font("Helvetica-Bold").fontSize(14);
    doc.text(`Total Amount: Rs. ${formattedTotal}`, col2, totalY, {
      width: rightX - col2,
      align: "right",
      lineBreak: false
    });

    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Thank you for visiting", 0, totalY + 50, { align: "center" });

    // ================= SIGNATURE =================
    await drawSignature(doc, pageWidth, margin, clinicId);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
});

module.exports = router;
