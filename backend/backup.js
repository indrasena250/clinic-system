const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // ✅ Fix IPv6 issue

const mysql = require("mysql2/promise");
const nodemailer = require("nodemailer");

const runBackup = async (req, res) => {
  try {
    // ✅ Safe key validation (handles spaces, encoding issues)
    const reqKey = decodeURIComponent(req.query.key || "").trim();
    const envKey = (process.env.BACKUP_SECRET || "").trim();

    if (reqKey !== envKey) {
      console.log("Unauthorized access:", { reqKey, envKey });
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
          .map(val => mysql.escape(val)) // ✅ safe handling
          .join(",");

        sqlDump += `INSERT INTO ${tableName} VALUES (${values});\n`;
      }

      sqlDump += "\n\n";
    }

    console.log("SQL dump created");

    // ✅ Email config (fixed)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // must be Gmail App Password
      },
    });

    // ✅ Send email without saving file
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `DB Backup - ${date}`,
      text: "Database backup attached",
      attachments: [
        {
          filename: `backup-${date}.sql`,
          content: Buffer.from(sqlDump),
        },
      ],
    });

    console.log("Email sent successfully");

    await connection.end();

    res.send("Backup sent successfully");

  } catch (error) {
    console.error("BACKUP ERROR:", error);
    res.status(500).send("Backup failed");
  }
};

module.exports = { runBackup };