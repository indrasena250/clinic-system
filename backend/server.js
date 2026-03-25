require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

/* ===============================
   SECURITY MIDDLEWARE
=============================== */

app.use(helmet());

const cors = require("cors");

const allowedOrigins = [
  "http://localhost:5173",
  "https://clinic-system-tau.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   STATIC FILES
=============================== */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===============================
   RATE LIMIT
=============================== */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

/* ===============================
   ROUTES
=============================== */

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

/* ===============================
   HEALTH CHECK
=============================== */

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.get("/", (req, res) => {
  res.send("Clinic Management System Running...");
});

/* ===============================
   ERROR HANDLER
=============================== */

const { errorHandler } = require("./middleware/errorMiddleware");
app.use(errorHandler);

/* ===============================
   START SERVER
=============================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});