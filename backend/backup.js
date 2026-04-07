const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const mysql = require("mysql2/promise");
const cloudinary = require("cloudinary").v2;

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ✅ Delete old backups (keep only latest 7)
const deleteExtraBackups = async (keep = 7) => {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "raw",
      prefix: "clinic-backup-",
      max_results: 100,
    });

    const sorted = result.resources.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const toDelete = sorted.slice(keep);

    for (let file of toDelete) {
      await cloudinary.uploader.destroy(file.public_id, {
        resource_type: "raw",
      });
      console.log("Deleted old backup:", file.public_id);
    }

    console.log(`Kept latest ${keep} backups`);

  } catch (err) {
    console.error("Cleanup error:", err.message);
  }
};

const runBackup = async (req, res) => {
  try {
    // ✅ Secure key check
    const reqKey = decodeURIComponent(req.query.key || "").trim();
    const envKey = (process.env.BACKUP_SECRET || "").trim();

    if (reqKey !== envKey) {
      return res.status(403).send("Unauthorized");
    }

    console.log("Backup started");

    // ✅ DB connection
    const connection = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT,
      ssl: { rejectUnauthorized: false }
    });

    const date = new Date().toISOString().split("T")[0];
    let sqlDump = "";

    // ✅ Get all tables
    const [tables] = await connection.query("SHOW TABLES");

    for (let tableObj of tables) {
      const tableName = Object.values(tableObj)[0];

      // Table structure
      const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
      sqlDump += createTable[0]["Create Table"] + ";\n\n";

      // Table data
      const [rows] = await connection.query(`SELECT * FROM ${tableName}`);

      for (let row of rows) {
        const values = Object.values(row)
          .map(val => mysql.escape(val))
          .join(",");

        sqlDump += `INSERT INTO ${tableName} VALUES (${values});\n`;
      }

      sqlDump += "\n\n";
    }

    console.log("SQL dump created");

    await connection.end();

    // ✅ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:text/plain;base64,${Buffer.from(sqlDump).toString("base64")}`,
      {
        resource_type: "raw",
        public_id: `clinic-backup-${date}`,
      }
    );

    console.log("Backup uploaded:", result.secure_url);

    // ✅ Delete old backups (keep 7)
    await deleteExtraBackups(7);

    // ✅ Response
    res.send({
      message: "Backup successful",
      url: result.secure_url,
    });

  } catch (error) {
    console.error("BACKUP ERROR:", error);
    res.status(500).send("Backup failed");
  }
};

module.exports = { runBackup };