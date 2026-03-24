import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Container,
} from "@mui/material";

import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

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

    try {
      const res = await API.post("/auth/login", form);
      login(res.data);
      navigate("/");
    } catch (err) {
      console.log("Login error:", err.response?.data);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px",
      }}
    >
      {/* Medical Scan Images Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          mb: 4,
          mt: 2,
          flexWrap: "wrap",
        }}
      >
        {[
          { bg: "#2a3a4a", label: "CT Scan" },
          { bg: "#3a3a3a", label: "X-Ray" },
          { bg: "#2a4a5a", label: "MRI" },
          { bg: "#3a4a4a", label: "Ultrasound" },
          { bg: "#2a3a5a", label: "PET Scan" },
          { bg: "#3a3a4a", label: "3D Imaging" },
        ].map((scan, idx) => (
          <Box
            key={idx}
            sx={{
              width: { xs: 60, sm: 80, md: 100 },
              height: { xs: 60, sm: 80, md: 100 },
              backgroundColor: scan.bg,
              border: "1px solid #555",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              color: "#999",
            }}
          >
            {scan.label}
          </Box>
        ))}
      </Box>

      {/* Login Container */}
      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          {/* Logo/Title */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                backgroundColor: "#FFD700",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              ⊕
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                color: "#fff",
                letterSpacing: 2,
              }}
            >
              Clinic
              <span style={{ color: "#FFD700" }}>System</span>
            </Typography>
          </Box>

          {/* Login Box */}
          <Paper
            sx={{
              p: 4,
              width: "100%",
              maxWidth: 400,
              backgroundColor: "#2a2a2a",
              border: "2px solid #555",
              borderRadius: 1,
              boxShadow: "0 0 20px rgba(0,0,0,0.8)",
            }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    color: "#aaa",
                    fontSize: "14px",
                    mb: 1,
                    fontWeight: 500,
                  }}
                >
                  Username :
                </Typography>
                <TextField
                  fullWidth
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#fff",
                      backgroundColor: "#080101",
                      "& fieldset": {
                        borderColor: "#555",
                      },
                      "&:hover fieldset": {
                        borderColor: "#777",
                      },
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    color: "#aaa",
                    fontSize: "14px",
                    mb: 1,
                    fontWeight: 500,
                  }}
                >
                  Password :
                </Typography>
                <TextField
                  fullWidth
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "rgb(255, 255, 255)",
                      backgroundColor: "#070606",
                      "& fieldset": {
                        borderColor: "#555",
                      },
                      "&:hover fieldset": {
                        borderColor: "#777",
                      },
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Button
                  variant="contained"
                  type="submit"
                  sx={{
                    backgroundColor: "#666",
                    color: "#fff",
                    px: 4,
                    py: 1,
                    fontSize: "14px",
                    fontWeight: "bold",
                    border: "1px solid #888",
                    "&:hover": {
                      backgroundColor: "#777",
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    color: "#aaa",
                    borderColor: "#666",
                    px: 4,
                    py: 1,
                    fontSize: "14px",
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.05)",
                    },
                  }}
                  onClick={() =>
                    setForm({ username: "", password: "" })
                  }
                >
                  Reset
                </Button>
              </Box>
            </form>
          </Paper>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          textAlign: "center",
          mt: 4,
          pb: 2,
        }}
      >
        <Typography
          sx={{
            color: "#666",
            fontSize: "12px",
            letterSpacing: 0.5,
          }}
        >
          Copyright © 2026{" "}
          <span style={{ color: "#FFD700" }}>Clinic System</span>. All
          Rights Reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;