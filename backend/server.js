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

console.log("✅ Modules loaded");

// ===============================
// INIT APP
// ===============================
const app = express();
app.set("trust proxy", 1);
console.log("✅ App initialized");

// ===============================
// SECURITY MIDDLEWARE
// ===============================
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "https://clinic-system-tau.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
console.log("✅ CORS configured");

// ===============================
// BODY PARSER
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log("✅ Body parser ready");

// ===============================
// STATIC FILES
// ===============================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log("✅ Static files ready");

// ===============================
// RATE LIMIT
// ===============================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
console.log("✅ Rate limiter active");

// ===============================
// ROUTES
// ===============================
console.log("🔄 Loading routes...");

try {
  const authRoutes = require("./routes/authRoutes");
  app.use("/api/auth", authRoutes);

  const patientRoutes = require("./routes/patientRoutes");
  app.use("/api/patients", patientRoutes);

  const financeRoutes = require("./routes/financeRoutes");
  app.use("/api/finance", financeRoutes);

  const counterRoutes = require("./routes/counterRoutes");
  app.use("/api/counter", counterRoutes);

  const settlementRoutes = require("./routes/settlementRoutes");
  app.use("/api/settle", settlementRoutes);

  const clinicRoutes = require("./routes/clinicRoutes");
  app.use("/api/clinics", clinicRoutes);

  console.log("✅ Routes loaded successfully");
} catch (err) {
  console.error("🔥 ROUTE LOADING ERROR:", err);
}

// ===============================
// HEALTH CHECK
// ===============================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.get("/", (req, res) => {
  res.send("Clinic Management System Running...");
});

// ===============================
// BACKUP ROUTE
// ===============================
try {
  const { runBackup } = require("./backup");

  app.get("/backup", (req, res, next) => {
    const key = req.query.key;

    if (key !== process.env.BACKUP_SECRET) {
      return res.status(403).send("Unauthorized");
    }

    runBackup(req, res, next);
  });

  console.log("✅ Backup route ready");
} catch (err) {
  console.error("🔥 BACKUP MODULE ERROR:", err);
}

// ===============================
// ERROR HANDLER
// ===============================
try {
  const { errorHandler } = require("./middleware/errorMiddleware");
  app.use(errorHandler);
  console.log("✅ Error handler loaded");
} catch (err) {
  console.error("🔥 ERROR HANDLER LOAD FAILED:", err);
}

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});