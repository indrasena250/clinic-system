const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const mysql = require("mysql2/promise");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const runBackup = async (req, res) => {
  try {
    // ✅ Secure key check
    const reqKey = decodeURIComponent(req.query.key || "").trim();
    const envKey = (process.env.BACKUP_KEY || "").trim();

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

    // ✅ Get tables
    const [tables] = await connection.query("SHOW TABLES");

    for (let tableObj of tables) {
      const tableName = Object.values(tableObj)[0];

      // Structure
      const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
      sqlDump += createTable[0]["Create Table"] + ";\n\n";

      // Data
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

    // ✅ Return link
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