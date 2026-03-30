import { useEffect, useState, useRef } from "react";
import { Paper, Typography, Grid, Card, CardContent, Button, Stack, TextField, useTheme, useMediaQuery } from "@mui/material";

import { getDailyReportSummary, downloadDailyReportPdf } from "../../api/reportApi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

import { formatDateTimeRange } from "../../utils/date";

const DailyReport = () => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [data, setData] = useState({
    ct: 0,
    usg: 0,
    other: 0,
    income: 0,
    expenses: 0,
    net: 0
  });

  const [reportWindow, setReportWindow] = useState({ from: null, to: null });
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const loadTimeoutRef = useRef(null);
  const MIN_LOAD_INTERVAL = 3000; // Minimum 3 seconds between API calls

  const loadReport = async () => {
    const now = Date.now();
    
    // Prevent rapid successive loads
    if (now - lastLoadTime < MIN_LOAD_INTERVAL) {
      console.log("Load skipped: too soon after last load");
      return;
    }

    try {
      const summary = await getDailyReportSummary(dayjs().format("YYYY-MM-DD"));
      setData({
        ct: summary.ct ?? 0,
        usg: summary.usg ?? 0,
        other: summary.other ?? 0,
        income: summary.income ?? 0,
        expenses: summary.expenses ?? 0,
        net: summary.net ?? 0
      });
      setReportWindow(summary.window || { from: null, to: null });
      setLastLoadTime(now);
    } catch (error) {
      console.error("Daily report load error:", error);
      if (error.response?.status === 429) {
        console.warn("Rate limited, will retry in 5 seconds");
      }
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  useEffect(() => {
    // Auto-refresh every 60 seconds, not 30 (reduced API pressure)
    const interval = setInterval(() => {
      loadReport();
    }, 60000);

    // Listen for settlement events from other pages with debounce
    const handleSettlementEvent = () => {
      console.log("Settlement detected, refreshing daily report");
      // Clear pending timeout if any
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      // Debounce: only refresh after 1.5 seconds to avoid immediate rapid calls
      loadTimeoutRef.current = setTimeout(() => {
        loadReport();
      }, 1500);
    };

    // Only add event listener if window is available
    if (typeof window !== "undefined") {
      window.addEventListener("settlementComplete", handleSettlementEvent);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("settlementComplete", handleSettlementEvent);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    loadReport();
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await downloadDailyReportPdf(dayjs().format("YYYY-MM-DD"));
      if (!blob) throw new Error("No PDF data received");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `daily-report-${dayjs().format("YYYY-MM-DD")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download PDF");
    }
  };

  const ReportCard = ({ title, value }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5">
          ₹ {Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Paper sx={{ p: 4 }}>

      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Typography variant="h5">
          Daily Financial Report
        </Typography>
        <Stack direction="row" gap={1} alignItems="center">
          <Button variant="outlined" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="contained" color="primary" onClick={handleDownloadPdf}>
            Download PDF
          </Button>
        </Stack>
      </Stack>

      <Typography sx={{ mb: 3 }}>
        Report Range: From {formatDateTimeRange(reportWindow.from)} To {formatDateTimeRange(reportWindow.to)}
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={12} md={3}>
          <ReportCard title="CT Income" value={data.ct} />
        </Grid>

        <Grid item xs={12} md={3}>
          <ReportCard title="USG Income" value={data.usg} />
        </Grid>

        <Grid item xs={12} md={3}>
          <ReportCard title="Other Income" value={data.other} />
        </Grid>

        <Grid item xs={12} md={3}>
          <ReportCard title="Total Income" value={data.income} />
        </Grid>

        <Grid item xs={12} md={6}>
          <ReportCard title="Expenses" value={data.expenses} />
        </Grid>

        <Grid item xs={12} md={6}>
          <ReportCard title="Net Collection" value={data.net} />
        </Grid>

      </Grid>

    </Paper>
  );
};

export default DailyReport;