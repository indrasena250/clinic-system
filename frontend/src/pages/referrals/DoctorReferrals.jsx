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
  Card,
  CardContent,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ referral_amount: 0, referral_status: "Balance" });

  // Generate referral amount options from 0 to 1500 in increments of 100
  const referralAmountOptions = [0, ...Array.from({ length: 15 }, (_, i) => (i + 1) * 100)];

  /* ============================
     Load Patients
  ============================ */

  useEffect(() => {
    loadPatients();

    const refreshInterval = setInterval(() => {
      loadPatients();
    }, 60000);

    if (typeof window !== "undefined") {
      window.addEventListener("settlementComplete", loadPatients);
    }

    return () => {
      clearInterval(refreshInterval);
      if (typeof window !== "undefined") {
        window.removeEventListener("settlementComplete", loadPatients);
      }
    };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    loadPatients();
  };

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
    
    // Update UI immediately (use functional update to avoid stale state issues)
    let updatedRowSnapshot = null;
    setRows((prev) => {
      const next = prev.map((row) => {
        if (row.id !== id) return row;
        const nextRow = {
          ...row,
          [field]: field === "referral_amount" ? Number(value) : value,
        };
        updatedRowSnapshot = nextRow;
        return nextRow;
      });
      return next;
    });
    setEditingId(null);

    // Auto-save to backend
    try {
      const dataToSend = {
        referral_amount: Number(updatedRowSnapshot?.referral_amount),
        referral_status: updatedRowSnapshot?.referral_status,
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

  const handleMobileSave = async (id) => {
    try {
      await updateReferral(id, {
        referral_amount: Number(editDraft.referral_amount),
        referral_status: editDraft.referral_status,
      });

      setSnackbar({
        open: true,
        message: "Updated successfully",
        severity: "success",
      });

      setEditingId(null);
      await loadPatients();
    } catch (error) {
      console.error("Update error:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update",
        severity: "error",
      });
      await loadPatients();
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
        const currentValue = params.row.referral_amount ?? 100;
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

      {isMobile ? (
        <Stack spacing={2}>
          {rows.map((row) => (
            <Card
              key={row.id}
              sx={{
                borderRadius: 2,
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.08)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)"
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#0f1c6e" }}>
                    {row.patient_name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#65748b" }}>
                    {formatDateTime(row.upload_date)}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: 14, mb: 0.4 }}><strong>Scan:</strong> {row.scan_name}</Typography>
                <Typography sx={{ fontSize: 14, mb: 0.4 }}><strong>Doctor:</strong> {row.doctor}</Typography>
                <Typography sx={{ fontSize: 14, mb: 1 }}><strong>Scan Amount:</strong> ₹{row.amount}</Typography>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip label={`Referral: ₹${row.referral_amount}`} color="primary" size="small" />
                  <Chip
                    label={row.referral_status}
                    color={row.referral_status === "Paid" ? "success" : "warning"}
                    size="small"
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, flexWrap: "wrap", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setEditingId(row.id);
                      setEditDraft({
                        referral_amount: row.referral_amount,
                        referral_status: row.referral_status
                      });
                    }}
                  >
                    {editingId === row.id ? "Editing" : "Edit"}
                  </Button>
                  <IconButton color="primary" size="small" onClick={handleRefresh}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Box>

                {editingId === row.id && (
                  <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                    <FormControl size="small">
                      <Select
                        value={editDraft.referral_amount}
                        onChange={(e) => setEditDraft({ ...editDraft, referral_amount: Number(e.target.value) })}
                      >
                        {referralAmountOptions.map((amount) => (
                          <MenuItem key={amount} value={amount}>
                            ₹ {amount}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small">
                      <Select
                        value={editDraft.referral_status}
                        onChange={(e) => setEditDraft({ ...editDraft, referral_status: e.target.value })}
                      >
                        <MenuItem value="Balance">Balance</MenuItem>
                        <MenuItem value="Paid">Paid</MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleMobileSave(row.id)}
                      >
                        Save
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
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
      )}:

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