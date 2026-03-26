import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  Select,
  FormControl,
  Box,
  Chip,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

import { formatDateTime } from "../../utils/date";
import { fetchAllPatients } from "../../api/patientApi";
import { updateReferral } from "../../api/patientApi";

const DoctorReferral = () => {

  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [editingId, setEditingId] = useState(null);

  // Generate referral amount options from 100 to 1500 in increments of 100
  const referralAmountOptions = Array.from({ length: 15 }, (_, i) => (i + 1) * 100);

  /* ============================
     Load Patients
  ============================ */

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await fetchAllPatients();

      setRows(
        data.map((item) => ({
          id: item.id,
          patient_name: item.patient_name,
          scan_name: item.scan_name,
          doctor: item.referred_doctor,
          amount: item.amount,
          referral_amount: item.referral_amount || 0,
          referral_status: item.referral_status || "Balance",
          upload_date: item.upload_date
        }))
      );

    } catch (err) {
      console.log(err);
      setError("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     Handle Field Change (Auto Save)
  ============================ */

  const handleChange = async (id, field, value) => {
    console.log(`Updating field: ${field}, value: ${value}, for id: ${id}`);
    
    // Update UI immediately
    const updatedRows = rows.map((row) =>
      row.id === id 
        ? { 
            ...row, 
            [field]: field === "referral_amount" ? Number(value) : value 
          } 
        : row
    );
    setRows(updatedRows);
    setEditingId(null);

    // Auto-save to backend
    try {
      const updatedRow = updatedRows.find(r => r.id === id);
      
      const dataToSend = {
        referral_amount: Number(updatedRow.referral_amount),
        referral_status: updatedRow.referral_status,
      };

      console.log("Sending to backend:", dataToSend);
      
      await updateReferral(id, dataToSend);

      setSnackbar({
        open: true,
        message: "Updated successfully",
        severity: "success"
      });

    } catch (error) {
      console.error("Update error:", error);
      console.error("Error response:", error.response?.data);

      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update",
        severity: "error"
      });

      // Revert on error
      loadPatients();
    }

  };

  /* ============================
     Table Columns
  ============================ */

  const columns = [

    {
      field: "upload_date",
      headerName: "Date",
      width: 180,
      renderCell: (params) =>
        formatDateTime(params.row.upload_date)
    },

    { field: "patient_name", headerName: "Patient", flex: 1 },

    { field: "scan_name", headerName: "Scan", flex: 1 },

    { field: "doctor", headerName: "Doctor", flex: 1 },

    {
      field: "amount",
      headerName: "Scan Amount",
      width: 140,
      renderCell: (params) => `₹ ${params.value}`
    },

    {
      field: "referral_amount",
      headerName: "Referral Amount",
      width: 180,
      renderCell: (params) => {
        const rowId = params.row.id;
        const currentValue = params.row.referral_amount || 100;
        const isEditing = editingId === rowId;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
            {isEditing ? (
              <FormControl size="small" sx={{ width: "100%" }}>
                <Select
                  value={currentValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    handleChange(rowId, "referral_amount", newValue);
                  }}
                  autoFocus
                  sx={{
                    backgroundColor: "#fff",
                    fontSize: "14px",
                  }}
                >
                  {referralAmountOptions.map((amount) => (
                    <MenuItem key={amount} value={amount}>
                      ₹ {amount}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setEditingId(rowId)}
                sx={{
                  width: "100%",
                  textTransform: "none",
                  fontWeight: "600",
                  color: "#667eea",
                  borderColor: "#667eea",
                  "&:hover": {
                    backgroundColor: "rgba(102, 126, 234, 0.05)",
                  },
                }}
              >
                ₹ {currentValue}
              </Button>
            )}
          </Box>
        );
      }
    },

    {
      field: "referral_status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        const rowId = params.row.id;
        const value = params.row.referral_status || "Balance";
        const isPaid = value === "Paid";
        const isEditing = editingId === rowId;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
            {isEditing ? (
              <FormControl size="small" sx={{ width: "100%" }}>
                <Select
                  value={value}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    handleChange(rowId, "referral_status", newValue);
                  }}
                  autoFocus
                  sx={{
                    backgroundColor: isPaid ? "#4caf50" : "#f44336",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  <MenuItem value="Balance">Balance</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Chip
                label={value}
                color={isPaid ? "success" : "error"}
                variant="filled"
                onClick={() => setEditingId(rowId)}
                sx={{
                  width: "100%",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  height: "32px",
                }}
              />
            )}
          </Box>
        );
      }
    }

  ];

  /* ============================
     Render Page
  ============================ */

  return (

    <Paper
      sx={{
        p: 3,
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: "700",
            color: "#333",
            mb: 1,
          }}
        >
          Doctor Referral Management
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#666",
            fontSize: "14px",
          }}
        >
          Click on amount or status to edit. Changes are saved automatically.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: "8px",
          }}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          height: "auto",
          maxHeight: "600px",
          "& .MuiDataGrid-root": {
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
          },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 20, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 }
            }
          }}
          sx={{
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#f5f5f5",
              fontWeight: "600",
              fontSize: "14px",
            },
            "& .MuiDataGrid-cell": {
              fontSize: "14px",
              py: 1.5,
            },
            "& .MuiDataGrid-row": {
              borderBottom: "1px solid #f0f0f0",
              "&:hover": {
                backgroundColor: "#fafafa",
              },
            },
          }}
        />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />

    </Paper>

  );

};

export default DoctorReferral;