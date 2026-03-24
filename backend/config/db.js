// config/db.js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10,
  queueLimit: 0
});

/* =========================================
   MULTI-CLINIC: Create clinics table & add clinic_id
========================================= */
const addClinicIdIfMissing = async (conn, table, hasFk = true) => {
  const [tbls] = await conn.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1",
    [table]
  );
  if (!tbls.length) return;
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  const names = (cols || []).map((c) => c.COLUMN_NAME);
  if (!names.includes("clinic_id")) {
    await conn.query(`ALTER TABLE ?? ADD COLUMN clinic_id INT NOT NULL DEFAULT 1`, [table]);
    if (hasFk) {
      try {
        await conn.query(
          `ALTER TABLE ?? ADD CONSTRAINT ??_clinic_fk FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT`,
          [table, table]
        );
      } catch (e) {
        if (e.code !== "ER_DUP_FOREIGN_KEY" && e.code !== "ER_FK_DUP_NAME") console.warn(`FK ${table}:`, e.message);
      }
    }
    console.log(`✓ Added clinic_id to ${table}`);
  }
};

// Alter table to ensure upload_date is DATETIME type
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.query(`ALTER TABLE patients MODIFY COLUMN upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    console.log("✓ Successfully altered upload_date column to DATETIME");
    conn.release();
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already DATETIME");
    } else {
      console.error("Error altering table:", err.message);
    }
  }
})();

// Multi-clinic: Create clinics table and add clinic_id to all tables
(async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [tables] = await conn.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'clinics' LIMIT 1"
    );
    if (!tables.length) {
      await conn.query(`
        CREATE TABLE clinics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await conn.query("INSERT INTO clinics (name) VALUES ('Clinic 1'), ('Clinic 2')");
      console.log("✓ Created clinics table with 2 default clinics");
    }
    for (const [tbl, fk] of [
      ["users", false],
      ["patients", true],
      ["expenses", true],
      ["extra_income", true],
      ["settlements", true],
      ["doctor_referrals", true],
      ["clinic_signature", false],
    ]) {
      try {
        await addClinicIdIfMissing(conn, tbl, fk);
      } catch (e) {
        console.warn(`Clinic migration for ${tbl}:`, e.message);
      }
    }
  } catch (err) {
    console.error("Error setting up multi-clinic:", err.message);
  } finally {
    if (conn) conn.release();
  }
})();

// Ensure patients.address exists (used by billing + lists)
(async () => {
  let conn;
  try {
    conn = await pool.getConnection();

    const [cols] = await conn.query(
      `
      SELECT 1 AS ok
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'patients'
        AND COLUMN_NAME = 'address'
      LIMIT 1
      `
    );

    if (!cols.length) {
      await conn.query(`ALTER TABLE patients ADD COLUMN address VARCHAR(255) NULL AFTER mobile`);
      console.log("✓ Added patients.address column");
    }
  } catch (err) {
    console.error("Error ensuring patients.address column:", err.message);
  } finally {
    if (conn) conn.release();
  }
})();

// Ensure settlements table exists with required columns (Manual Settlement System)
(async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [tables] = await conn.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'settlements' LIMIT 1"
    );
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settlements'`
    );
    const names = cols.map((c) => c.COLUMN_NAME);

    if (!tables.length) {
      await conn.query(`
        CREATE TABLE settlements (
          id INT AUTO_INCREMENT PRIMARY KEY,
          amount DECIMAL(12,2) NOT NULL DEFAULT 0,
          from_time DATETIME NOT NULL,
          to_time DATETIME NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✓ Created settlements table");
    } else {
      if (!names.includes("amount")) {
        await conn.query("ALTER TABLE settlements ADD COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0");
        console.log("✓ Added settlements.amount");
      }
      if (!names.includes("from_time")) {
        await conn.query("ALTER TABLE settlements ADD COLUMN from_time DATETIME NULL");
        console.log("✓ Added settlements.from_time");
      }
      if (!names.includes("to_time")) {
        await conn.query("ALTER TABLE settlements ADD COLUMN to_time DATETIME NULL");
        console.log("✓ Added settlements.to_time");
      }
      if (!names.includes("created_at")) {
        await conn.query("ALTER TABLE settlements ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        console.log("✓ Added settlements.created_at");
      }
    }
  } catch (err) {
    console.error("Error ensuring settlements table:", err.message);
  } finally {
    if (conn) conn.release();
  }
})();

module.exports = pool;