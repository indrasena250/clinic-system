// ===============================
// GLOBAL ERROR HANDLERS (TOP)
// ===============================
process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED REJECTION:", err);
});

console.log("✅ Starting server...");

// ===============================
// LOAD ENV
// ===============================
require("dotenv").config();
console.log("✅ Env loaded");

// ===============================
// IMPORTS
// ===============================
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

// ===============================
// INIT APP
// ===============================
const app = express();
app.set("trust proxy", 1);
console.log("✅ App initialized");

// ===============================
// REQUEST LOGGER (TOP)
// ===============================
app.use((req, res, next) => {
  console.log("🌐", req.method, req.url);
  next();
});

// ===============================
// SECURITY
// ===============================
app.use(helmet());

// ===============================
// CORS
// ===============================
const allowedOrigins = [
  "http://localhost:5173",
  "https://clinic-system-tau.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

console.log("✅ CORS configured");

// ===============================
// BODY PARSER
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// STATIC FILES
// ===============================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===============================
// RATE LIMIT
// ===============================
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

console.log("✅ Middleware ready");

// ===============================
// HEALTH CHECK (VERY IMPORTANT)
// ===============================
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.send("Clinic Management System Running...");
});

// ===============================
// ROUTES (NO TRY-CATCH)
// ===============================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/finance", require("./routes/financeRoutes"));
app.use("/api/counter", require("./routes/counterRoutes"));
app.use("/api/settle", require("./routes/settlementRoutes"));
app.use("/api/clinics", require("./routes/clinicRoutes"));

console.log("✅ Routes loaded");

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
// ERROR HANDLER (CUSTOM)
// ===============================
const { errorHandler } = require("./middleware/errorMiddleware");
app.use(errorHandler);

// ===============================
// FALLBACK ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error("🔥 EXPRESS ERROR:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});