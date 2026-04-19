const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      username: user.username,
      email: user.email || null,
      clinic_id: user.clinic_id ?? 1,
      is_demo: user.is_demo || false,
      session_id: user.session_id || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

module.exports = generateToken;