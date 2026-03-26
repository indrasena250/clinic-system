import { useEffect, useState } from "react";
import {
  Typography,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Chip,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SendIcon from "@mui/icons-material/Send";
import ClearIcon from "@mui/icons-material/Clear";
import { fetchCTPatients, updatePatient, downloadInvoicePDF } from "../../api/patientApi";
import API from "../../api/axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

import { formatDate, formatTime, formatDateTime } from "../../utils/date";

const CTList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [filterRange, setFilterRange] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");

  /* ==============================
     FETCH DATA
  ============================== */
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchCTPatients();

      setRows(
        data.map((item) => ({
          id: item.id,
          patient_name: item.patient_name,
          age: item.age,
          gender: item.gender,
          mobile: item.mobile,
          address: item.address,
          scan_category: item.scan_category,
          scan_name: item.scan_name,
          referred_doctor: item.referred_doctor,
          amount: item.amount,
          upload_date: item.upload_date,
        }))
      );
    } catch (err) {
      console.log(err);
      setError("Failed to load CT patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ==============================
     EDIT HANDLERS
  ============================== */
  const handleEditClick = (row) => {
    setEditData({ ...row });
    setOpen(true);
  };

const handleUpdate = async () => {
  if (!editData.mobile || editData.mobile.length !== 10) {
    alert("Mobile number must be exactly 10 digits");
    return;
  }

  try {
    const existingRow = rows.find(r => r.id === editData.id);

    await updatePatient(editData.id, {
      patient_name: editData.patient_name || existingRow.patient_name,
      age: editData.age ?? existingRow.age,
      gender: editData.gender || existingRow.gender,
      mobile: editData.mobile || existingRow.mobile,
      address: editData.address ?? existingRow.address ?? null,
      scan_category: existingRow.scan_category, // LOCKED
      scan_name: editData.scan_name ?? existingRow.scan_name,
      referred_doctor: editData.referred_doctor ?? existingRow.referred_doctor,
      amount: editData.amount ?? existingRow.amount,
      upload_date: dayjs.utc(existingRow.upload_date).format("YYYY-MM-DD HH:mm:ss"),
    });

    setRows(prev =>
      prev.map(row =>
        row.id === editData.id
          ? { ...row, ...editData }
          : row
      )
    );

    setOpen(false);
  } catch (error) {
    console.log("UPDATE ERROR:", error.response?.data);
    alert(
      error.response?.data?.message ||
      error.response?.data?.sqlMessage ||
      "Update failed"
    );
  }
};

const handleDownloadInvoice = async (patientId) => {
  try {
    const blob = await downloadInvoicePDF(patientId);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${patientId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Download error:", error);
    alert("Failed to download invoice");
  }
};

const toWhatsAppNumber = (mobile) => {
  // WhatsApp expects digits only with country code (no +, no spaces)
  const digits = String(mobile || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("91") && digits.length >= 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits; // fallback for other formats/countries
};

const CENTER_NAME = "SRIDEVI DIAGNOSTIC CENTER";

const formatInvoiceMessage = (row, invoiceUrl) => {
  const name = row.patient_name || "-";
  const age = row.age ?? "-";
  const gender = row.gender || "-";
  const category = row.scan_category || "-";
  const type = row.scan_name || "-";
  const amount = Number(row.amount ?? 0);
  const formattedAmount = Number.isFinite(amount) ? amount.toFixed(2) : String(row.amount ?? "-");
  const dateStr = formatDateTime(row.upload_date);

  // Put the URL on its own line with no extra characters after it
  // so WhatsApp reliably makes it clickable.
  return [
    `${CENTER_NAME}`,
    "Hello!",
    "",
    "Patient Details:",
    `Name: ${name}`,
    `Age: ${age}`,
    `Gender: ${gender}`,
    "",
    "Scan Details:",
    `Category: ${category}`,
    `Type: ${type}`,
    "",
    `Amount: ₹${formattedAmount}`,
    `Date: ${dateStr}`,
    "",
    "Thank you for visiting us.",
    "Wishing you good health!",
    "",
    `Download PDF: ${invoiceUrl}`,
  ].join("\n");
};

const handleSendWhatsApp = (row) => {
  const waNumber = toWhatsAppNumber(row.mobile);
  if (!waNumber) {
    alert("Patient mobile number not found");
    return;
  }

  // Open WhatsApp chat immediately on click (avoids popup blockers).
  const baseUrl = (import.meta.env.VITE_PUBLIC_API_BASE_URL || API.defaults.baseURL).replace(/\/+$/, "");
  const invoiceUrl = `${baseUrl}/patients/invoice/public/${row.id}`;
  const message = formatInvoiceMessage(row, invoiceUrl);
  const encodedMessage = encodeURIComponent(message);

  // wa.me works on both mobile + desktop (redirects to web.whatsapp.com when needed)
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
};

  /* ==============================
     TABLE COLUMNS
  ============================== */
  const columns = [
    {
      field: "upload_date",
      headerName: "Date",
      width: 175,
      renderCell: (params) => {
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "14px", color: "#666" }}>
              {formatDate(params.value)}
            </Typography>
            <Chip
              label={formatTime(params.value)}
              size="small"
              sx={{
                backgroundColor: "#2196F3",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            />
          </Box>
        );
      },
    },
    { field: "id", headerName: "ID", width: 70 },
    { field: "patient_name", headerName: "Patient", flex: 1.3, minWidth: 150 },
    { field: "age", headerName: "Age", width: 60 },
    { field: "gender", headerName: "Sex", width: 70 },
    { field: "mobile", headerName: "Mobile", width: 110 },
    {
      field: "address",
      headerName: "Address",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: 13, whiteSpace: "normal", wordBreak: "break-word" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "scan_name",
      headerName: "Scan",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: 13, whiteSpace: "normal", wordBreak: "break-word" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "referred_doctor",
      headerName: "Doctor",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: 13, whiteSpace: "normal", wordBreak: "break-word" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 95,
      renderCell: (params) => `₹ ${params.value}`,
    },
    {
      field: "tools",
      headerName: "Actions",
      width: 115,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ 
          display: "flex", 
          flexDirection: "row", 
          gap: 1, 
          alignItems: "center", 
          justifyContent: "center", 
          width: "100%"
        }}>
          <IconButton
            color="success"
            title="Download Invoice"
            size="small"
            onClick={() => handleDownloadInvoice(params.row.id)}
          >
            <FileDownloadIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="info"
            title="Send via WhatsApp"
            size="small"
            onClick={() => handleSendWhatsApp(params.row)}
            sx={{ color: "#25D366" }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const getRangeDates = (range) => {
    const today = dayjs().startOf("day");
    switch (range) {
      case "today":
        return { start: today, end: today.endOf("day") };
      case "yesterday":
        const yesterday = today.subtract(1, "day");
        return { start: yesterday, end: yesterday.endOf("day") };
      case "7days":
        return { start: today.subtract(6, "day"), end: today.endOf("day") };
      case "month":
        return { start: today.subtract(30, "day"), end: today.endOf("day") };
      default:
        return { start: null, end: null };
    }
  };

  const rangeDates = getRangeDates(filterRange);

  const filteredRows = rows.filter((row) => {
    if (rangeDates.start && rangeDates.end) {
      const rowDate = dayjs(row.upload_date);
      if (!rowDate.isBetween(rangeDates.start, rangeDates.end, "second", "[]")) {
        return false;
      }
    }

    if (!searchTerm) return true;

    const normalized = searchTerm.trim().toLowerCase();
    return (
      row.patient_name?.toLowerCase().includes(normalized) ||
      row.mobile?.toLowerCase().includes(normalized) ||
      row.referred_doctor?.toLowerCase().includes(normalized)
    );
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          CT Patients
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center", flex: 1 }}>
          {[
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "7days", label: "7 Days" },
            { key: "month", label: "Month" },
            { key: "all", label: "All" },
          ].map((item) => (
            <Button
              key={item.key}
              variant={filterRange === item.key ? "contained" : "outlined"}
              size="small"
              onClick={() => setFilterRange(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <TextField
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search patient, mobile, doctor..."
          InputProps={{
            endAdornment: searchTerm ? (
              <IconButton size="small" onClick={() => setSearchTerm("")}>
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null,
          }}
          sx={{ minWidth: 250 }}
        />
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <div style={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 20]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          getRowHeight={() => "auto"}
          sx={{
            "& .MuiDataGrid-cell": {
              whiteSpace: "normal !important",
              wordBreak: "break-word",
              lineHeight: 1.25,
              px: 0.75,
              py: 0.75,
              alignItems: "flex-start",
            },
            "& .MuiDataGrid-columnHeader": {
              px: 0.75,
            },
            "& .MuiDataGrid-row": {
              maxHeight: "none !important",
            },
          }}
        />
      </div>

      {/* ==============================
         EDIT DIALOG
      ============================== */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Patient</DialogTitle>

        <DialogContent>
          {editData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <TextField
                fullWidth
                margin="normal"
                label="Patient Name"
                value={editData.patient_name || ""}
                onChange={(e) =>
                  setEditData({ ...editData, patient_name: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Age"
                type="number"
                value={editData.age ?? ""}
                onChange={(e) =>
                  setEditData({ ...editData, age: e.target.value })
                }
                inputProps={{ min: 0, max: 150 }}
              />
              <TextField
                fullWidth
                margin="normal"
                select
                label="Gender"
                value={editData.gender || ""}
                onChange={(e) =>
                  setEditData({ ...editData, gender: e.target.value })
                }
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="M">M</MenuItem>
                <MenuItem value="F">F</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
              <TextField
                fullWidth
                margin="normal"
                label="Mobile"
                value={editData.mobile || ""}
                inputProps={{ maxLength: 10 }}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setEditData({ ...editData, mobile: value });
                  }
                }}
                error={editData.mobile && editData.mobile.length !== 10}
                helperText={
                  editData.mobile && editData.mobile.length !== 10
                    ? "Mobile must be exactly 10 digits"
                    : ""
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Address"
                multiline
                rows={2}
                value={editData.address || ""}
                onChange={(e) =>
                  setEditData({ ...editData, address: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Scan"
                value={editData.scan_name || ""}
                onChange={(e) =>
                  setEditData({ ...editData, scan_name: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Referred Doctor"
                value={editData.referred_doctor || ""}
                onChange={(e) =>
                  setEditData({ ...editData, referred_doctor: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Amount"
                type="number"
                value={editData.amount ?? ""}
                onChange={(e) =>
                  setEditData({ ...editData, amount: e.target.value })
                }
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={
              !editData ||
              editData.mobile?.length !== 10
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CTList;