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
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Dashboard Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? 12 : 14 }}>
              Auto-refresh every minute. Pull-to-refresh button available.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm="auto">
          <Button variant="contained" size={isMobile ? "small" : "medium"} onClick={handleRefresh}>
            Refresh
          </Button>
        </Grid>
        {user?.clinic_name && (
          <Grid item xs={12} sm="auto">
            <Typography variant="body2" color="text.secondary">
              {user.clinic_name}
            </Typography>
          </Grid>
        )}
        <Grid item xs={12} sm="auto">
          <SettleButton onSettlementComplete={handleSettlementComplete} />
        </Grid>
      </Grid>
  
      <Grid container spacing={3} mt={1} alignItems="stretch">

        {/* ==================== SECTION 1: TODAY'S PERFORMANCE ==================== */}
        <Grid item xs={12}>
          <Box sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 3,
            p: 3,
            color: "white",
            boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)"
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <AssessmentIcon /> TODAY'S PERFORMANCE
            </Typography>
            <Grid container spacing={2} alignItems="stretch">
              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{ background: "rgba(255,255,255,0.1)", p: 2, borderRadius: 2, backdropFilter: "blur(10px)", width: "100%", height: "100%" }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Ultrasound Income</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.todayUltrasoundIncome || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{ background: "rgba(255,255,255,0.1)", p: 2, borderRadius: 2, backdropFilter: "blur(10px)", width: "100%", height: "100%" }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>CT Income</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.todayCTIncome || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{ background: "rgba(255,255,255,0.1)", p: 2, borderRadius: 2, backdropFilter: "blur(10px)", width: "100%", height: "100%" }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Expenses</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.todayExpense || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{ background: "rgba(255,255,255,0.2)", p: 2, borderRadius: 2, backdropFilter: "blur(10px)", border: "2px solid rgba(255,255,255,0.4)", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>Net Collection</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                    ₹{format(summary?.todayNet || 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* ==================== SECTION 2: MONTH COMPARISON ==================== */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUpIcon sx={{ color: "#667eea" }} /> MONTHLY COMPARISON
          </Typography>
        </Grid>

        {/* CURRENT MONTH TOTAL */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-8px)",
              boxShadow: "0 12px 40px rgba(102, 126, 234, 0.4)"
            }
          }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: 0.9 }}>
                  {dayjs().format("MMMM")} Income
                </Typography>
                <Box sx={{
                  background: "rgba(255,255,255,0.2)",
                  p: 1,
                  borderRadius: 2,
                  backdropFilter: "blur(10px)"
                }}>
                  <AttachMoneyIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                  ₹{format((summary?.currentMonthUltrasound || 0) + (summary?.currentMonthCT || 0) + (summary?.currentMonthOther || 0))}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, ((summary?.currentMonthUltrasound || 0) + (summary?.currentMonthCT || 0) + (summary?.currentMonthOther || 0)) / 1000)}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "rgba(255,255,255,0.8)"
                    },
                    borderRadius: 2,
                    height: 6
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ mt: 1, opacity: 0.8 }}>
                Current Month Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* LAST MONTH TOTAL */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(245, 87, 108, 0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-8px)",
              boxShadow: "0 12px 40px rgba(245, 87, 108, 0.4)"
            }
          }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: 0.9 }}>
                  {dayjs().subtract(1, 'month').format("MMMM")} Income
                </Typography>
                <Box sx={{
                  background: "rgba(255,255,255,0.2)",
                  p: 1,
                  borderRadius: 2,
                  backdropFilter: "blur(10px)"
                }}>
                  <TrendingDownIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                  ₹{format((summary?.lastMonthUltrasound || 0) + (summary?.lastMonthCT || 0) + (summary?.lastMonthOther || 0))}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, ((summary?.lastMonthUltrasound || 0) + (summary?.lastMonthCT || 0) + (summary?.lastMonthOther || 0)) / 1000)}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "rgba(255,255,255,0.8)"
                    },
                    borderRadius: 2,
                    height: 6
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ mt: 1, opacity: 0.8 }}>
                Previous Month Reference
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* MONTH NET (Income - Expenses) */}
        <Grid item xs={12} sm={12} md={4}>
          <Card sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(79, 172, 254, 0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-8px)",
              boxShadow: "0 12px 40px rgba(79, 172, 254, 0.4)"
            }
          }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: 0.9 }}>
                  {dayjs().format("MMMM")} Net Income
                </Typography>
                <Box sx={{
                  background: "rgba(255,255,255,0.2)",
                  p: 1,
                  borderRadius: 2,
                  backdropFilter: "blur(10px)"
                }}>
                  <LocalHospitalIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                  ₹{format(summary?.currentMonthNet || 0)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (summary?.currentMonthNet || 0) / 1000)}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "rgba(255,255,255,0.8)"
                    },
                    borderRadius: 2,
                    height: 6
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2, fontSize: "0.85rem", opacity: 0.9 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Income</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{format((summary?.currentMonthUltrasound || 0) + (summary?.currentMonthCT || 0) + (summary?.currentMonthOther || 0))}
                  </Typography>
                </Box>
                <Box sx={{ borderLeft: "1px solid rgba(255,255,255,0.3)", pl: 2 }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Expenses</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{format(summary?.currentMonthExpense || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ==================== SECTION 3: OVERALL STATISTICS ==================== */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <AssessmentIcon sx={{ color: "#f5576c" }} /> OVERALL STATISTICS
          </Typography>
        </Grid>

        {/* TOTAL ULTRASOUND */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
            <CardContent sx={{
              background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
              color: "#333",
              flex: 1
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#666" }}>
                Total Ultrasound Income
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1, color: "#2d3436" }}>
                ₹{format(summary?.totalUltrasound || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* TOTAL CT */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
            <CardContent sx={{
              background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
              color: "#333",
              flex: 1
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#666" }}>
                Total CT Income
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1, color: "#2d3436" }}>
                ₹{format(summary?.totalCT || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* OVERALL NET */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
            <CardContent sx={{
              background: "linear-gradient(135deg, #c084fc 0%, #8b5cf6 100%)",
              color: "white",
              flex: 1
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.9 }}>
                Overall Net Collection
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                ₹{format(summary?.overallNet || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* REFERRAL BALANCE */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
            <CardContent sx={{
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              color: "#333",
              flex: 1
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#666" }}>
                Referral Balance (Pending)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1, color: "#2d3436" }}>
                ₹{format(summary?.referralBalance || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ==================== SECTION 4: INSIGHTS ==================== */}
        <Grid item xs={12}>
          <Box sx={{
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            borderRadius: 3,
            p: 3
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: "#2d3436" }}>
              📊 FINANCIAL INSIGHTS
            </Typography>
            
            <Grid container spacing={2} alignItems="stretch">
              {/* Month over Month Growth */}
              <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <Box sx={{
                  background: "white",
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid #dfe6e9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%"
                }}>
                  <Typography variant="subtitle2" sx={{ color: "#636e72", mb: 1 }}>
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
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid #dfe6e9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%"
                }}>
                  <Typography variant="subtitle2" sx={{ color: "#636e72", mb: 1 }}>
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
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid #dfe6e9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%"
                }}>
                  <Typography variant="subtitle2" sx={{ color: "#636e72", mb: 1 }}>
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
                  p: 2.5,
                  borderRadius: 2,
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%"
                }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1 }}>
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