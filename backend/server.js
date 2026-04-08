// Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
app.set("trust proxy", 1);

// ===============================
// MIDDLEWARE
// ===============================
app.use(helmet());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://clinic-system-tau.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// ===============================
// HEALTH CHECK
// ===============================
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.send("Clinic Management System Running...");
});

// ===============================
// ROUTES
// ===============================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/finance", require("./routes/financeRoutes"));
app.use("/api/counter", require("./routes/counterRoutes"));
app.use("/api/settle", require("./routes/settlementRoutes"));
app.use("/api/clinics", require("./routes/clinicRoutes"));

// ===============================
// BACKUP ROUTE
// ===============================
const { runBackup } = require("./backup");

app.get("/backup", (req, res, next) => {
  if (req.query.key !== process.env.BACKUP_SECRET) {
    return res.status(403).send("Unauthorized");
  }
  runBackup(req, res, next);
});

// ===============================
// ERROR HANDLER
// ===============================
const { errorHandler } = require("./middleware/errorMiddleware");
app.use(errorHandler);

app.use((err, req, res, next) => {
  res.status(500).json({ message: "Internal Server Error" });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});