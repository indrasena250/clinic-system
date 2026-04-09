import { useEffect, useState } from "react";
import { Grid, Typography, Alert, Box, Stack, Button, useTheme, useMediaQuery, Card, CardContent, LinearProgress } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

import { fetchTodaySummary } from "../api/dashboardApi";
import Loader from "../components/loaders/Loader";
import KpiCard from "../components/common/KpiCard";
import SettleButton from "../components/SettleButton";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {

  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const loadDashboard = async (fromSettlement = false) => {
    // Always set loading state when refetching after settlement
    if (fromSettlement) {
      setLoading(true);
    }
    
    try {
      const summaryRes = await fetchTodaySummary();
      setSummary(summaryRes);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadDashboard();

    const timer = setInterval(() => {
      loadDashboard();
    }, 60000);

    if (typeof window !== "undefined") {
      window.addEventListener("settlementComplete", loadDashboard);
    }

    return () => {
      clearInterval(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("settlementComplete", loadDashboard);
      }
    };
  }, []);

  const handleSettlementComplete = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    loadDashboard(true);
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

      <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Grid item xs={12} md={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Dashboard Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? 12 : 14 }}>
              Auto-refresh every minute. Pull-to-refresh button available.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4} sx={{ textAlign: "center" }}>
          {user?.clinic_id && (
            <Typography variant="h5" fontWeight="bold" color="primary">
              {user.clinic_id === 1 ? "Test Centre" : user.clinic_id === 2 ? "SRIDEVI DIAGNOSTIC CENTER" : user.clinic_name}
            </Typography>
          )}
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button variant="contained" size={isMobile ? "small" : "medium"} onClick={handleRefresh}>
            Refresh
          </Button>
          <SettleButton onSettlementComplete={handleSettlementComplete} />
        </Grid>
      </Grid>
  
      <Grid container spacing={1} mt={3} alignItems="stretch">

        {/* ==================== SECTION 1: TODAY'S PERFORMANCE ==================== */}
        <Grid item xs={12} md={6}>
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 3,
            p: 1.5,
            color: "white",
            boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)"
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
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
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Ultrasound Income</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 2 }}>
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
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>CT Income</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 2 }}>
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
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Expenses</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 2 }}>
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
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Net Collection</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 2 }}>
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
            background: "linear-gradient(135deg, #334dff 0%, #764ba2 100%)",
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
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>This Month Income</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format((summary?.currentMonthUltrasound || 0) + (summary?.currentMonthCT || 0) + (summary?.currentMonthOther || 0))}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85, mt: 1 }}>
                    {dayjs().format("MMMM")} total income
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
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>Last Month Income</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format((summary?.lastMonthUltrasound || 0) + (summary?.lastMonthCT || 0) + (summary?.lastMonthOther || 0))}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85, mt: 1 }}>
                    {dayjs().subtract(1, 'month').format("MMMM")} total income
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
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>This Month Net</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.currentMonthNet || 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85, mt: 1 }}>
                    Income minus expenses for {dayjs().format("MMMM")}
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
            background: "linear-gradient(135deg, #f5576c 0%, #d423e7 100%)",
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
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Ultrasound Income</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mt: 2 }}>
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
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>Total CT Income</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mt: 2 }}>
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
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>Overall Net Collection</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mt: 2 }}>
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
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>Referral Balance (Pending)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mt: 2 }}>
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
            background: "linear-gradient(135deg, #1ab406 0%, #f2fd59 100%)",
            borderRadius: 3,
            p: 1.5
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: "#2d3436" }}>
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
                  <Typography variant="subtitle2" sx={{ color: "#636e72", mb: 2 }}>
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
                  <Typography variant="subtitle2" sx={{ color: "#636e72", mb: 2 }}>
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
                  <Typography variant="subtitle2" sx={{ color: "#636e72", mb: 2 }}>
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
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  p: 1,
                  borderRadius: 2,
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "",
                  height: "100%"
                }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 2 }}>
                    Counter Available
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
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