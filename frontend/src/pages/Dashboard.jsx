import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Typography, Alert, Box, Stack, Button, useTheme, useMediaQuery, Card, CardContent, LinearProgress } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import RefreshIcon from "@mui/icons-material/Refresh";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

import { fetchTodaySummary } from "../api/dashboardApi";
import API from "../api/axios";
import Loader from "../components/loaders/Loader";
import KpiCard from "../components/common/KpiCard";
import SettleButton from "../components/SettleButton";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {

  const { user, login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const silentRefreshRef = useRef(false);
  

  
  // List of KPI fields that indicate actual changes
  const kpiFields = [
    'todayUltrasoundIncome', 'todayCTIncome', 'todayOtherIncome', 'todayExpense', 'todayNet',
    'currentMonthUltrasound', 'currentMonthCT', 'currentMonthOther', 'currentMonthExpense', 'currentMonthNet',
    'lastMonthUltrasound', 'lastMonthCT', 'lastMonthOther', 'lastMonthExpense', 'lastMonthNet',
    'totalUltrasound', 'totalCT', 'overallNet', 'totalCounter', 'referralBalance'
  ];
  
  // Helper to check if important KPI values have changed
  const hasKpiChanged = (oldSummary, newSummary) => {
    if (!oldSummary || !newSummary) return true;
    
    for (let field of kpiFields) {
      if (Math.abs((oldSummary[field] || 0) - (newSummary[field] || 0)) > 0.01) {
        return true;
      }
    }
    return false;
  };
  
  const loadDashboard = async (silentRefresh = false) => {
    silentRefreshRef.current = silentRefresh;
    
    try {
      const summaryRes = await fetchTodaySummary();
      
      // Only update state if KPI values actually changed
      setSummary(prevSummary => {
        if (!silentRefresh || hasKpiChanged(prevSummary, summaryRes)) {
          return summaryRes;
        }
        return prevSummary;
      });
      
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      if (!silentRefresh) {
        setLoading(false);
      }
      silentRefreshRef.current = false;
    }
  };
  
  useEffect(() => {
    loadDashboard();

    const timer = setInterval(() => {
      loadDashboard();
    }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleSettlementComplete = async () => {
    await loadDashboard(true);
  };

  const handleRefresh = () => {
    setLoading(true);
    loadDashboard();
  };

  if (loading) return <Loader />;
  if (error) return <Alert severity="error">{error}</Alert>;

  /* ---------------- NUMBER FORMAT ---------------- */

  const format = (num) =>
    Number(num).toLocaleString("en-IN", { minimumFractionDigits: 2 });


  return (
    <Box>


<Grid
  container
  alignItems="center"
  spacing={2}
  sx={{
    mb: 3,
    px: 2.5,
    py: 2,
    gap: isMobile ? 1 : 10,
    borderRadius: "20px",
    backdropFilter: "blur(14px)",
    background: "rgba(255,255,255,0.65)",
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
    },
  }}
>
  {/* LEFT */}
  <Grid item xs={12} md={4}>
    <Box>
      <Typography
        sx={{
          fontSize: isMobile ? "1.5rem" : "1.9rem",
          fontWeight: 700,
          letterSpacing: "-0.5px",
          color: "#1a1a1a",
        }}
      >
        Dashboard Overview
      </Typography>

      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#4caf50",
            boxShadow: "0 0 8px #4caf50",
          }}
        />
        <Typography
          sx={{
            fontSize: isMobile ? 12 : 13,
            color: "text.secondary",
          }}
        >
          Live · Auto-refresh every minute
        </Typography>
      </Box>
    </Box>
  </Grid>

  {/* CENTER (CLINIC BADGE) */}
  <Grid item xs={12} md={4} textAlign="center">
    {user?.clinic_id && (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          px: 1,
          py: 1.2,
          borderRadius: "999px",
          background:
            "linear-gradient(135deg, rgba(58, 6, 180, 0.9), rgba(68, 0, 177, 0.99))",
          color: "#fff",
          fontWeight: 700,
          fontSize: isMobile ? "clamp(0.75rem, 2.4vw, 1rem)" : "clamp(1rem, 0.2vw, 1rem)",
          letterSpacing: "0.3px",
          boxShadow: "0 6px 20px rgba(25,118,210,0.35)",
          transition: "all 0.25s ease",
          maxWidth: isMobile ? "100%" : "320px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          justifyContent: "center",
          "&:hover": {
            transform: "translateY(-2px) scale(1.02)",
          },
        }}
      >
        <LocalHospitalIcon sx={{ fontSize: 20, flexShrink: 0 }} />

        <Box
          component="span"
          sx={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.clinic_name || 'Clinic'}
        </Box>
      </Box>
    )}
  </Grid>

  {/* RIGHT (ACTIONS) */}
  <Grid
    item
    xs={12}
    md={4}
    sx={{
      display: "flex",
      justifyContent: { xs: "center", md: "flex-end" },
      alignItems: "center",
      gap: isMobile ? 0.5 : 1.5,
    }}
  >
    {/* REFRESH BUTTON */}
    <Button
      startIcon={<RefreshIcon />}
      onClick={handleRefresh}
      sx={{
        borderRadius: "999px",
        px: 2,
        py: 1,
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.9rem",
        color: "#fff",
        background: "rgb(25, 118, 210)",
        border: "1px solid rgba(25,118,210,0.2)",
        backdropFilter: "blur(6px)",
        transition: "all 0.25s ease",
        "&:hover": {
          background: "rgba(25,118,210,0.15)",
          transform: "translateY(-2px)",
        },
      }}
    >
      Refresh
    </Button>

    {/* SETTLE BUTTON WRAPPER */}
    <Box
      sx={{
        borderRadius: "999px",
        overflow: "hidden",
        transition: "all 0.25s ease",
        "&:hover": {
          transform: "translateY(-2px)",
        },
      }}
    >
      <SettleButton onSettlementComplete={handleSettlementComplete} />
    </Box>
  </Grid>
</Grid>
  
      <Grid container spacing={1} mt={3} alignItems="stretch">

        {/* ==================== SECTION 1: TODAY'S PERFORMANCE ==================== */}
        <Grid item xs={12} md={6}>
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "linear-gradient(135deg, #002fff 0%, #3a2ea8 100%)",
            borderRadius: 3,
            p: 1.5,
            color: "white",
            boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)"
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <AssessmentIcon /> TODAY'S PERFORMANCE
            </Typography>
            <Grid container spacing={1} alignItems="stretch">
              <Grid item xs={12} sm={6} md={6} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.14)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="subtitle2" sx={{ opacity: 2 }}>Ultrasound Income</Typography>
                  <Typography variant="h4" sx={{ fontSize: '1.9rem',fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.todayUltrasoundIncome || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={6} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.14)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="subtitle2" sx={{ opacity: 3 }}>CT Income</Typography>
                  <Typography variant="h4" sx={{ fontSize: '1.9rem',fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.todayCTIncome || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={6} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.14)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="subtitle2" sx={{ opacity: 2 }}>Expenses</Typography>
                  <Typography variant="h4" sx={{ fontSize: '1.9rem',fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.todayExpense || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={6} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.24)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.28)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="subtitle2" sx={{ opacity: 2 }}>Net Collection</Typography>
                  <Typography variant="h4" sx={{ fontSize: '1.9rem',fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.todayNet || 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* ==================== SECTION 2: MONTH COMPARISON ==================== */}
        <Grid item xs={12} md={6}>
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "linear-gradient(135deg, #4d2b85 0%, #6e31ac 100%)",
            borderRadius: 3,
            p: 1.5,
            color: "white",
            boxShadow: "0 8px 32px rgba(51, 77, 255, 0.18)"
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUpIcon sx={{ color: "#fff" }} /> MONTHLY COMPARISON
            </Typography>

            <Grid container spacing={1} alignItems="stretch">
              <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.14)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="caption" sx={{ opacity: 2 }}>Last Month Income</Typography>
                  <Typography variant="h4" sx={{ fontSize: '1.7rem',fontWeight: "bold", mt: 1 }}>
                    ₹{format((summary?.lastMonthUltrasound || 0) + (summary?.lastMonthCT || 0) + (summary?.lastMonthOther || 0))}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 2, mt: 1 }}>
                    {dayjs().subtract(1, 'month').format("MMMM")} total income
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.14)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="caption" sx={{ opacity: 2 }}>This Month Income</Typography>
                  <Typography variant="h4" sx={{ fontSize: '1.7rem',fontWeight: "bold", mt: 1 }}>
                    ₹{format((summary?.currentMonthUltrasound || 0) + (summary?.currentMonthCT || 0) + (summary?.currentMonthOther || 0))}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 1, mt: 1 }}>
                    {dayjs().format("MMMM")} total income
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={12} md={4} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.14)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="caption" sx={{ opacity: 2 }}>This Month Net</Typography>
                  <Typography variant="h4" sx={{ fontSize: '1.7rem',fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.currentMonthNet || 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 2, mt: 1 }}>
                     Without expenses {dayjs().format("MMMM")}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* ==================== SECTION 3: OVERALL STATISTICS ==================== */}
        <Grid item xs={12} md={6} mt ={3}>
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "linear-gradient(135deg, #c50274 0%, #1500ce 100%)",
            borderRadius: 3,
            p: 1.5,
            color: "white",
            boxShadow: "0 8px 32px rgba(245, 87, 108, 0.18)"
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <AssessmentIcon sx={{ color: "#fff" }} /> OVERALL STATISTICS
            </Typography>

            <Grid container spacing={1} alignItems="stretch">
              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.14)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="caption" sx={{ opacity: 2 }}>Total Ultrasound Income</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.totalUltrasound || 0)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.14)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="caption" sx={{ opacity: 2 }}>Total CT Income</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.totalCT || 0)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.14)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="caption" sx={{ opacity: 2 }}>Overall Net Collection</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.overallNet || 0)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "rgba(255,255,255,0.14)",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.18)",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: ""
                }}>
                  <Typography variant="caption" sx={{ opacity: 2 }}>Referral Balance (Pending)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.referralBalance || 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* ==================== SECTION 4: INSIGHTS ==================== */}
        <Grid item xs={12} md={6} mt ={3}>
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "linear-gradient(135deg, #1f8a11 0%, #00c93c 100%)",
            borderRadius: 3,
            p: 1.5
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#ffffff" }}>
              📊 FINANCIAL INSIGHTS
            </Typography>

            <Grid container spacing={1} alignItems="stretch">
              {/* Month over Month Growth */}
              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "white",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid #dfe6e9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "",
                  height: "100%"
                }}>
                  <Typography variant="subtitle2" sx={{ color: "#000000", mb: 1 }}>
                    MoM Growth
                  </Typography>
                  {(() => {
                    const current = (summary?.currentMonthUltrasound || 0) + (summary?.currentMonthCT || 0) + (summary?.currentMonthOther || 0);
                    const last = (summary?.lastMonthUltrasound || 0) + (summary?.lastMonthCT || 0) + (summary?.lastMonthOther || 0);
                    const growth = last > 0 ? ((current - last) / last * 100) : 0;
                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: growth >= 0 ? "#27ae60" : "#e74c3c" }}>
                          {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                        </Typography>
                        {growth >= 0 ? (
                          <TrendingUpIcon sx={{ color: "#27ae60" }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: "#e74c3c" }} />
                        )}
                      </Box>
                    );
                  })()}
                </Box>
              </Grid>

              {/* Daily Average */}
              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "white",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid #dfe6e9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "",
                  height: "100%"
                }}>
                  <Typography variant="subtitle2" sx={{ color: "#000000", mb: 1 }}>
                    Daily Average
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "#0984e3" }}>
                    ₹{format((summary?.currentMonthNet || 0) / dayjs().date())}
                  </Typography>
                </Box>
              </Grid>

              {/* Expense Ratio */}
              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "white",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid #dfe6e9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "",
                  height: "100%"
                }}>
                  <Typography variant="subtitle2" sx={{ color: "#000000", mb: 1 }}>
                    Expense Ratio
                  </Typography>
                  {(() => {
                    const income = (summary?.currentMonthUltrasound || 0) + (summary?.currentMonthCT || 0) + (summary?.currentMonthOther || 0);
                    const expense = summary?.currentMonthExpense || 0;
                    const ratio = income > 0 ? (expense / income * 100) : 0;
                    return (
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: ratio > 30 ? "#e74c3c" : "#27ae60" }}>
                        {ratio.toFixed(1)}%
                      </Typography>
                    );
                  })()}
                </Box>
              </Grid>

              {/* Total Counter Available */}
              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "linear-gradient(135deg, #5900ce 0%, #0f00e6 100%)",
                  p: 1,
                  borderRadius: 2,
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "",
                  height: "100%"
                }}>
                  <Typography variant="subtitle2" sx={{ opacity: 2, mb: 1 }}>
                    Counter Available
                  </Typography>
                  <Typography variant="h5" sx={{ fontSize: '1.9rem',fontWeight: "bold" }}>
                    ₹{format(summary?.totalCounter || 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

      </Grid>

    </Box>
  );

};

export default Dashboard;