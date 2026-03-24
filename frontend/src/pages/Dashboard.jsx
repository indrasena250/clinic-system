import { useEffect, useState } from "react";
import { Grid, Typography, Alert, Box, Stack } from "@mui/material";

import { fetchTodaySummary } from "../api/dashboardApi";
import Loader from "../components/loaders/Loader";
import KpiCard from "../components/common/KpiCard";
import SettleButton from "../components/SettleButton";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {

  const { user } = useAuth();

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
  }, []);
  
  const handleSettlementComplete = async () => {
    // Small delay to ensure database transaction is committed
    await new Promise(resolve => setTimeout(resolve, 500));
    // Reload dashboard with fresh data
    loadDashboard(true);
  };

  if (loading) return <Loader />;
  if (error) return <Alert severity="error">{error}</Alert>;

  /* ---------------- NUMBER FORMAT ---------------- */

  const format = (num) =>
    Number(num).toLocaleString("en-IN", { minimumFractionDigits: 2 });


  return (
    <Box>

      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard Overview
          </Typography>
          {user?.clinic_name && (
            <Typography variant="body2" color="text.secondary">
              {user.clinic_name}
            </Typography>
          )}
        </Box>
        <SettleButton onSettlementComplete={handleSettlementComplete} />
      </Stack>

      <Grid container spacing={3} mt={1}>

        {/* TODAY ULTRASOUND INCOME = today ultrasound income - referral of ultrasound */}
        <Grid item xs={12} md={3}>
          <KpiCard
            title="Today Ultrasound Income"
            value={format(summary?.todayUltrasoundIncome || 0)}
          />
        </Grid>

        {/* TODAY CT INCOME = today CT income - referral of CT */}
        <Grid item xs={12} md={3}>
          <KpiCard
            title="Today CT Income"
            value={format(summary?.todayCTIncome || 0)}
          />
        </Grid>

        {/* TODAY EXPENSES */}
        <Grid item xs={12} md={3}>
          <KpiCard
            title="Today's Expenses"
            value={format(summary?.todayExpense || 0)}
          />
        </Grid>

        {/* TODAY NET COLLECTION = today ultrasound income + today CT income - today expenses */}
        <Grid item xs={12} md={3}>
          <KpiCard
            title="Today Net Collection"
            value={format(summary?.todayNet || 0)}
          />
        </Grid>

        {/* TOTAL ULTRASOUND INCOME */}
        <Grid item xs={12} md={3}>
          <KpiCard
            title="Total Ultrasound Income"
            value={format(summary?.totalUltrasound || 0)}
          />
        </Grid>

        {/* TOTAL CT INCOME */}
        <Grid item xs={12} md={3}>
          <KpiCard
            title="Total CT Income"
            value={format(summary?.totalCT || 0)}
          />
        </Grid>

        {/* OVERALL NET COLLECTION */}
        <Grid item xs={12} md={3}>
          <KpiCard
            title="Overall Net Collection"
            value={format(summary?.overallNet || 0)}
          />
        </Grid>

        {/* REFERRAL BALANCE = unpaid referral amount for doctors */}
        <Grid item xs={12} md={3}>
          <KpiCard
            title="Referral Balance"
            value={format(summary?.referralBalance || 0)}
          />
        </Grid>

        {/* TOTAL COUNTER = all remaining balance (amount - referral) */}
        <Grid item xs={12} md={3}>
          <KpiCard
            title="Total Counter"
            value={format(summary?.totalCounter || 0)}
          />
        </Grid>

      </Grid>

    </Box>
  );

};

export default Dashboard;