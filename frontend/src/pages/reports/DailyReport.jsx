import { useEffect, useState } from "react";
import { Paper, Typography, Grid, Card, CardContent, Button, Stack, TextField } from "@mui/material";

import { getDailyReportSummary, downloadDailyReportPdf } from "../../api/reportApi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

import { formatDate } from "../../utils/date";

const DailyReport = () => {

  const [data, setData] = useState({
    ct: 0,
    usg: 0,
    other: 0,
    income: 0,
    expenses: 0,
    net: 0
  });

  const [selectedDate, setSelectedDate] = useState(dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD"));

  const loadReport = async (date = selectedDate) => {
    try {
      const summary = await getDailyReportSummary(date);
      setData({
        ct: summary.ct ?? 0,
        usg: summary.usg ?? 0,
        other: summary.other ?? 0,
        income: summary.income ?? 0,
        expenses: summary.expenses ?? 0,
        net: summary.net ?? 0
      });
    } catch (error) {
      console.error("Daily report load error:", error);
    }
  };
  useEffect(() => {
    loadReport(selectedDate);
  }, [selectedDate]);

  const handleDownloadPdf = async () => {
    try {
      const blob = await downloadDailyReportPdf(selectedDate);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `daily-report-${selectedDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
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
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="outlined" onClick={() => loadReport(selectedDate)}>
            Refresh
          </Button>
          <Button variant="contained" color="primary" onClick={handleDownloadPdf}>
            Download PDF
          </Button>
        </Stack>
      </Stack>

      <Typography sx={{ mb: 3 }}>
        Date: {formatDate(selectedDate)}
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