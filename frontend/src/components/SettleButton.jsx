import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PrintIcon from "@mui/icons-material/Print";
import { settle } from "../api/settlementApi";
import { formatDateTime } from "../utils/date";

const formatCurrency = (num) =>
  `₹ ${Number(num).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const SettleButton = ({ onSettlementComplete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const handleSettleClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    setLoading(true);

    try {
      const data = await settle();
      const normalized = {
        fromTime: data.fromTime ?? data.from_time,
        toTime: data.toTime ?? data.to_time,
        income: data.income ?? 0,
        extraIncome: data.extraIncome ?? data.extra_income ?? 0,
        expenses: data.expenses ?? 0,
        settlementAmount: data.settlementAmount ?? data.settlement_amount ?? 0,
      };
      setReportData(normalized);
      setReportOpen(true);
      
      // Silently update dashboard data in background while showing report
      if (onSettlementComplete) {
        await onSettlementComplete();
      }
    } catch (err) {
      console.error("Settlement error:", err);
      alert(err.response?.data?.message || "Failed to process settlement");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("settlement-report");
    if (!printContent) return;
    const prevTitle = document.title;
    document.title = "Settlement Report";
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Settlement Report</title></head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    document.title = prevTitle;
  };

  const ReportCard = () => (
    <Paper
      id="settlement-report"
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 2,
        maxWidth: 420,
        mx: "auto",
      }}
    >
      <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
        Settlement Report
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
        <Row label="From Time" value={formatDateTime(reportData.fromTime)} />
        <Row label="To Time" value={formatDateTime(reportData.toTime)} />
        <Row label="Income" value={formatCurrency(reportData.income)} />
        <Row label="Extra Income" value={formatCurrency(reportData.extraIncome)} />
        <Row label="Expenses" value={formatCurrency(reportData.expenses)} />
        <Row
          label="Settlement Amount"
          value={formatCurrency(reportData.settlementAmount)}
          highlight
        />
      </Box>
    </Paper>
  );

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSettleClick}
        disabled={loading}
        startIcon={<AccountBalanceWalletIcon />}
        sx={{
          textTransform: "none",
          fontSize: "0.9rem",
          fontWeight: 600,
          px: isMobile ? 1.25 : 2.5,
          py: 1.25,
          }}
      >
        {loading ? "Settling..." : "Settle & Report"}
      </Button>

      {/* Confirmation Modal */}
      <Dialog
        open={confirmOpen}
        onClose={() => !loading && setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Settle & Generate Report</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to settle?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Settling..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Modal */}
      <Dialog
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Settlement Complete</DialogTitle>
        <DialogContent>
          {reportData ? (
            <>
              <ReportCard />
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{ textTransform: "none" }}
                >
                  Print Report
                </Button>
              </Box>
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setReportOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const Row = ({ label, value, highlight }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      py: 0.5,
      borderBottom: highlight ? "none" : "1px solid",
      borderColor: "divider",
      fontWeight: highlight ? 700 : 400,
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{ fontWeight: highlight ? 700 : 500, color: highlight ? "primary.main" : "text.primary" }}
    >
      {value}
    </Typography>
  </Box>
);

export default SettleButton;
