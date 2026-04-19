import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Container,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      console.log("Login error:", err.response?.data);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 25%, #1e40af 50%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        padding: "20px",
        "&::before": {
          content: '""',
          position: "absolute",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          top: "-100px",
          left: "-100px",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(29,78,216,0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          bottom: "-50px",
          right: "-50px",
        },
      }}
    >
      {/* Floating Medical Icons Background */}
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {[...Array(6)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              fontSize: "60px",
              opacity: 0.03,
              animation: `float ${5 + i}s ease-in-out infinite`,
              "@keyframes float": {
                "0%, 100%": { transform: "translateY(0px)" },
                "50%": { transform: "translateY(20px)" },
              },
            }}
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + i * 10}%`,
            }}
          >
            ⊕
          </Box>
        ))}
      </Box>

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 10 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          {/* Premium Header Section */}
          <Box
            sx={{
              mb: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              animation: "slideDown 0.8s ease-out",
              "@keyframes slideDown": {
                from: {
                  opacity: 0,
                  transform: "translateY(-30px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Box
              sx={{
                width: 65,
                height: 65,
                background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "bold",
                boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <LocalHospitalIcon sx={{ color: "#fff", fontSize: 32 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #fff 0%, #93c5fd 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: 1,
                  mb: 0.5,
                }}
              >
                Clinic System
              </Typography>
              <Typography
                sx={{
                  color: "#93c5fd",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Diagnostic Platform
              </Typography>
            </Box>
          </Box>

          {/* Premium Login Card */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              width: "100%",
              maxWidth: 450,
              background: "rgba(15, 23, 42, 0.25)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(93, 156, 236, 0.2)",
              borderRadius: 3,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
              animation: "slideUp 0.8s ease-out 0.1s both",
              "@keyframes slideUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(30px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            {/* Welcome Text */}
            <Box sx={{ mb: 3, textAlign: "center" }}>
              <Typography
                sx={{
                  color: "#e0e7ff",
                  fontSize: "16px",
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 400,
                }}
              >
                Enter your credentials to access the diagnostic platform
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Username Field */}
              <Box sx={{ mb: 2.5 }}>
                <Typography
                  sx={{
                    color: "#cbd5e1",
                    fontSize: "13px",
                    mb: 1,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Username
                </Typography>
                <TextField
                  fullWidth
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  size="medium"
                  placeholder="Enter your username"
                  autoComplete="username"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon
                          sx={{
                            color: "#64748b",
                            fontSize: "20px",
                            mr: 1,
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#ffffff",
                      backgroundColor: "rgba(232, 239, 252, 0.99)",
                      borderRadius: 2,
                      border: "1px solid rgba(93, 156, 236, 0.2)",
                      transition: "all 0.3s ease",
                      "& fieldset": {
                        borderColor: "transparent",
                      },
                      "&:hover": {
                        backgroundColor: "rgba(232, 239, 252, 0.99)",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                      },
                      "&:focus-within": {
                        borderColor: "rgba(59, 130, 246, 0.5)",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: "#000000",
                    },
                    "& .MuiOutlinedInput-input::placeholder": {
                      color: "#00000093",
                      opacity: 1,
                    },
                  }}
                />
              </Box>

              {/* Password Field */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    color: "#cbd5e1",
                    fontSize: "13px",
                    mb: 1,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Password
                </Typography>
                <TextField
                  fullWidth
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  size="medium"
                  placeholder="Enter your password"
                  autoComplete="password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon
                          sx={{
                            color: "#64748b",
                            fontSize: "20px",
                            mr: 1,
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#ffffff",
                      backgroundColor: "rgba(232, 239, 252, 0.99)",
                      borderRadius: 2,
                      border: "1px solid rgba(93, 156, 236, 0.2)",
                      transition: "all 0.3s ease",
                      "& fieldset": {
                        borderColor: "transparent",
                      },
                      "&:hover": {
                        backgroundColor: "rgba(232, 239, 252, 0.99)",
                        borderColor: "rgba(0, 0, 0, 0.3)",
                      },
                      "&:focus-within": {
                        borderColor: "rgba(59, 130, 246, 0.5)",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: "#000000",
                    },
                    "& .MuiOutlinedInput-input::placeholder": {
                      color: "#05080c98",
                      opacity: 1,
                    },
                  }}
                />
              </Box>

              {/* Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  fullWidth
                  sx={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                    color: "#fff",
                    py: 1.3,
                    fontSize: "15px",
                    fontWeight: 700,
                    border: "1px solid rgba(59, 130, 246, 0.5)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 32px rgba(59, 130, 246, 0.4)",
                    },
                    "&:active": {
                      transform: "translateY(0px)",
                    },
                    "&:disabled": {
                      opacity: 0.7,
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} sx={{ color: "inherit" }} />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </Box>

              {/* Reset Button */}
              <Button
                fullWidth
                onClick={() => setForm({ username: "", password: "" })}
                sx={{
                  color: "#93c5fd",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                  py: 1.2,
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: 2,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderColor: "rgba(59, 130, 246, 0.5)",
                  },
                }}
              >
                Clear
              </Button>
            </form>
          </Paper>

          {/* Footer Info */}
          <Box
            sx={{
              mt: 4,
              textAlign: "center",
              animation: "fadeIn 1s ease-out 0.4s both",
              "@keyframes fadeIn": {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <Typography
              sx={{
                color: "#64748b",
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: 0.5,
                mb: 1,
              }}
            >
              HIPAA Compliant Diagnostic System
            </Typography>
            <Typography
              sx={{
                color: "#475569",
                fontSize: "11px",
                letterSpacing: 0.5,
              }}
            >
              Copyright © 2026{" "}
              <span style={{ color: "#3b82f6" }}>Clinic System</span>. All
              Rights Reserved.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;