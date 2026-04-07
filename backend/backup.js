const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const mysql = require("mysql2/promise");
const fs = require("fs");
const nodemailer = require("nodemailer");

const runBackup = async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT,
      ssl: { rejectUnauthorized: false }
    });

    const date = new Date().toISOString().split("T")[0];
    const file = `backup-${date}.sql`;

    let sqlDump = "";

    // Get all tables
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
          .map(val => {
            if (val === null) return "NULL";
            return `'${val.toString().replace(/'/g, "\\'")}'`;
          })
          .join(",");

        sqlDump += `INSERT INTO ${tableName} VALUES (${values});\n`;
      }

      sqlDump += "\n\n";
    }

    fs.writeFileSync(file, sqlDump);

    // Send email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // IMPORTANT: change from 465 → 587
      secure: false, // TLS instead of SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      family: 4 // ✅ FORCE IPv4 (THIS FIXES YOUR ERROR)
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `DB Backup - ${date}`,
      text: "Database backup attached",
      attachments: [
        {
          filename: file,
          path: file,
        },
      ],
    });

    fs.unlinkSync(file);
    await connection.end();

    res.send("Backup sent successfully");
  } catch (error) {
    console.error("BACKUP ERROR:", error);
    res.status(500).send("Backup failed");
  }
};

module.exports = { runBackup };