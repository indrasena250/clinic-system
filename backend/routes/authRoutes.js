const rateLimit = require("express-rate-limit");
const express = require("express");
const router = express.Router();
const { login, demoEmailLogin } = require("../controllers/authController");
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: {
        message: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const demoLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 demo attempts per hour per IP
    message: {
        message: "Too many demo requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post("/login", loginLimiter, login);
router.post("/demo-login", demoLimiter, demoEmailLogin);

module.exports = router;