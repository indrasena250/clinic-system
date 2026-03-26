import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { formatDateTime, formatCurrency } from "../utils/date";
import { fetchSettlementHistory, downloadSettlementPeriodPDF } from "../api/patientApi";

const SettlementHistory = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      const data = await fetchSettlementHistory();
      setSettlements(data);
    } catch (error) {
      console.error("Error loading settlements:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadSettlementPDF = async (settlementId) => {
    try {
      const blob = await downloadSettlementPeriodPDF(settlementId);
      if (!blob) throw new Error("No PDF data received");

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `settlement-${settlementId}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download settlement PDF");
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: "12px" }}>
        <Typography>Loading settlement history...</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: "700",
            color: "#333",
            mb: 1,
          }}
        >
          Settlement History
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#666",
            fontSize: "14px",
          }}
        >
          View past settlements and download PDF reports
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Settlement ID</strong></TableCell>
              <TableCell><strong>From Date & Time</strong></TableCell>
              <TableCell><strong>To Date & Time</strong></TableCell>
              <TableCell><strong>Settlement Amount</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {settlements.map((settlement) => (
              <TableRow key={settlement.id}>
                <TableCell>#{settlement.id}</TableCell>
                <TableCell>{formatDateTime(settlement.from_time)}</TableCell>
                <TableCell>{formatDateTime(settlement.to_time)}</TableCell>
                <TableCell>
                  <Chip
                    label={formatCurrency(settlement.amount)}
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{formatDateTime(settlement.created_at)}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => downloadSettlementPDF(settlement.id)}
                    sx={{
                      textTransform: "none",
                      fontWeight: "600",
                    }}
                  >
                    Download PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {settlements.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            No settlement history found
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SettlementHistory;