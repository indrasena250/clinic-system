import { exec } from "child_process";
import nodemailer from "nodemailer";
import fs from "fs";

app.get("/backup", (req, res) => {
  const date = new Date().toISOString().split("T")[0];
  const file = `backup-${date}.sql`;

  const dump = `mysqldump -h ${process.env.MYSQLHOST} -u ${process.env.MYSQLUSER} -p${process.env.MYSQLPASSWORD} ${process.env.MYSQLDATABASE} > ${file}`;

  exec(dump, async (err) => {
    if (err) return res.status(500).send("Dump failed");

    // Mail setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send mail
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Daily DB Backup",
      text: "Attached is your database backup",
      attachments: [
        {
          filename: file,
          path: file,
        },
      ],
    });

    fs.unlinkSync(file);

    res.send("Backup sent to email");
  });
});