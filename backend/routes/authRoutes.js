const rateLimit = require("express-rate-limit");
const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController");
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: {
        message: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});
router.post("/login", loginLimiter, login);

module.exports = router;