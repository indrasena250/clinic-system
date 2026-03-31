const { exec } = require("child_process");
const nodemailer = require("nodemailer");
const fs = require("fs");

const runBackup = (req, res) => {
  const date = new Date().toISOString().split("T")[0];
  const file = `backup-${date}.sql`;

  const dump = `mysqldump -h ${process.env.MYSQLHOST} -u ${process.env.MYSQLUSER} -p${process.env.MYSQLPASSWORD} ${process.env.MYSQLDATABASE} > ${file}`;

  exec(dump, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Dump failed");
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `DB Backup - ${date}`,
        text: "Your database backup is attached.",
        attachments: [
          {
            filename: file,
            path: file,
          },
        ],
      });

      fs.unlinkSync(file);

      res.send("Backup sent successfully");
    } catch (error) {
      console.error(error);
      res.status(500).send("Email failed");
    }
  });
};

module.exports = { runBackup };