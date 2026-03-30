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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SendIcon from "@mui/icons-material/Send";
import ClearIcon from "@mui/icons-material/Clear";
import { fetchCTPatients, updatePatient, downloadInvoicePDF, fetchInvoiceScans } from "../../api/patientApi";
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

  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.down("md"));

  /* ==============================
     FETCH DATA
  ============================== */
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchCTPatients();

      const mappedRows = data.map((item, index) => ({
        slno: item.clinic_wise_id || index + 1,
        id: item.clinic_patient_id || item.id,
        database_id: item.id,
        invoice_id: item.invoice_id,
        patient_name: item.patient_name,
        age: item.age && item.age_unit ? `${item.age}${item.age_unit === 'months' ? 'M' : 'Y'}` : item.age,
        gender: item.gender,
        mobile: item.mobile,
        address: item.address,
        scan_category: item.scan_category,
        scan_name: item.scan_name,
        referred_doctor: item.referred_doctor,
        amount: item.amount,
        upload_date: item.upload_date,
      }));
      setRows(mappedRows);
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

const handleDownloadInvoice = async (invoiceId) => {
  try {
    const blob = await downloadInvoicePDF(invoiceId);
    if (!blob) throw new Error("No PDF data received");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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

const formatInvoiceMessage = (patientRow, allScans, invoiceUrl) => {
  const name = patientRow.patient_name || "-";
  const age = patientRow.age ?? "-";
  const gender = patientRow.gender || "-";

  // Calculate total amount from all scans
  let totalAmount = 0;
  allScans.forEach((scan) => {
    const amount = Number(scan.amount ?? 0);
    if (Number.isFinite(amount)) {
      totalAmount += amount;
    }
  });
  const formattedTotal = totalAmount.toFixed(2);

  const messageLines = [
    `${CENTER_NAME}`,
    "Hello!",
    "",
    "Patient Details:",
    `Name: ${name}`,
    `Age: ${age}`,
    `Gender: ${gender}`,
    "",
    "Scan Details:",
  ];

  // Add each scan
  allScans.forEach((scan, index) => {
    const category = scan.scan_category || "-";
    const type = scan.scan_name || "-";
    const amount = Number(scan.amount ?? 0);
    const formattedAmount = Number.isFinite(amount) ? amount.toFixed(2) : String(scan.amount ?? "-");
    const dateStr = formatDateTime(scan.upload_date);

    messageLines.push(`${index + 1}. ${type} (${category})`);
    messageLines.push(`   Amount: ₹${formattedAmount}`);
    messageLines.push(`   Date: ${dateStr}`);
  });

  messageLines.push(
    "",
    `Total Amount: ₹${formattedTotal}`,
    "",
    "Thank you for visiting us.",
    "Wishing you good health!",
    "",
    `Download PDF: ${invoiceUrl}`
  );

  return messageLines.join("\n");
};

const handleSendWhatsApp = async (row) => {
  const waNumber = toWhatsAppNumber(row.mobile);
  if (!waNumber) {
    alert("Patient mobile number not found");
    return;
  }

  try {
    console.log("Fetching scans for invoice:", row.invoice_id);
    // Fetch ALL scans for this invoice_id from API (not just from current list)
    const allScans = await fetchInvoiceScans(row.invoice_id);
    console.log("Fetched scans:", allScans);

    if (!allScans.length) {
      alert("No scans found for this invoice");
      return;
    }

    // Open WhatsApp chat immediately on click (avoids popup blockers).
    const baseUrl = (import.meta.env.VITE_PUBLIC_API_BASE_URL || API.defaults.baseURL).replace(/\/+$/, "");
    const invoiceUrl = `${baseUrl}/patients/invoice/public/${row.invoice_id}`;
    const message = formatInvoiceMessage(row, allScans, invoiceUrl);
    console.log("WhatsApp message:", message);

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;
    console.log("WhatsApp URL:", whatsappUrl);

    // wa.me works on both mobile + desktop (redirects to web.whatsapp.com when needed)
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("WhatsApp error:", error);
    alert("Failed to send WhatsApp message: " + (error.message || "Unknown error"));
  }
};

  /* ==============================
     TABLE COLUMNS
  ============================== */
  const columns = [
    {
      field: "slno",
      headerName: "SL No",
      flex: 0.35,
      minWidth: 45,
      align: "left",
      headerAlign: "left",
    },
    {
      field: "upload_date",
      headerName: "Date & Time",
      flex: 1.4,
      minWidth: 140,
      align: "left",
      headerAlign: "left",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, height: "100%" }}>
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
              height: "20px",
            }}
          />
        </Box>
      ),
    },
    {
      field: "id",
      headerName: "ID",
      flex: 0.5,
      minWidth: 60,
      align: "left",
      headerAlign: "left",
    },
    { field: "patient_name", headerName: "Patient Name", flex: 1.4, minWidth: 110, align: "left", headerAlign: "left" },
    { field: "age", headerName: "Age", flex: 0.35, minWidth: 45, align: "left", headerAlign: "left" },
    { field: "gender", headerName: "Gender", flex: 0.6, minWidth: 70, align: "left", headerAlign: "left" },
    {
      field: "scan_name",
      headerName: "Scan Type",
      flex: 1.1,
      minWidth: 105,
      align: "left",
      headerAlign: "left",
      renderCell: (params) => (
        <Typography sx={{ fontSize: 14, whiteSpace: "normal", wordBreak: "break-word" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    
    {
      field: "referred_doctor",
      headerName: "Doctor",
      flex: 1.1,
      minWidth: 100,
      align: "left",
      headerAlign: "left",
      renderCell: (params) => (
        <Typography sx={{ fontSize: 14, whiteSpace: "normal", wordBreak: "break-word" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    { field: "mobile", headerName: "Mobile", flex: 0.9, minWidth: 100, align: "left", headerAlign: "left" },
    {
      field: "address",
      headerName: "Address",
      flex: 1.25,
      minWidth: 110,
      align: "left",
      headerAlign: "left",
      renderCell: (params) => (
        <Typography sx={{ fontSize: 14, whiteSpace: "normal", wordBreak: "break-word" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.75,
      minWidth: 70,
      align: "left",
      headerAlign: "left",
      renderCell: (params) => `₹ ${params.value}`,
    },
    {
      field: "tools",
      headerName: "Actions",
      flex: 1,
      minWidth: 105,
      sortable: false,
      filterable: false,
      align: "left",
      headerAlign: "left",
      renderCell: (params) => (
        <Box sx={{
          display: "flex",
          flexDirection: "row",
          gap: 0.5,
          alignItems: "center",
          justifyContent: "flex-start",
          width: "100%",
        }}>
          <IconButton
            color="success"
            title="Download Invoice"
            size="small"
            onClick={() => handleDownloadInvoice(params.row.invoice_id)}
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
            title="Edit"
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

      {isMd ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {filteredRows.map((row) => (
            <Paper key={row.id} sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {row.patient_name || "-"}
                </Typography>
                <Typography variant="caption">
                  #{row.slno} • {row.upload_date ? formatDateTime(row.upload_date) : "-"}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Scan: {row.scan_name || "-"}
              </Typography>
              <Typography variant="body2">Doctor: {row.referred_doctor || "-"}</Typography>
              <Typography variant="body2">Gender: {row.gender || "-"}</Typography>
              <Typography variant="body2">Mobile: {row.mobile || "-"}</Typography>
              <Typography variant="body2">Address: {row.address || "-"}</Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                Amount: ₹{row.amount || 0}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                <IconButton color="success" title="Download Invoice" size="small" onClick={() => handleDownloadInvoice(row.invoice_id)}>
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
                <IconButton color="info" title="Send via WhatsApp" size="small" onClick={() => handleSendWhatsApp(row)} sx={{ color: "#25D366" }}>
                  <SendIcon fontSize="small" />
                </IconButton>
                <IconButton color="primary" title="Edit" size="small" onClick={() => handleEditClick(row)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
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
            autoHeight
            disableSelectionOnClick
            sx={{
              "& .MuiDataGrid-virtualScroller": {
                overflowX: "hidden !important",
              },
              "& .MuiDataGrid-cell": {
                whiteSpace: "normal !important",
                wordBreak: "break-word",
                lineHeight: 1.3,
                px: 0.5,
                py: 0.5,
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-row": {
                maxHeight: "none !important",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              },
              "& .MuiDataGrid-columnHeader": {
                px: 0.5,
                backgroundColor: "#f0f0f0",
                fontWeight: "bold",
              },
            }}
          />
        </div>
      )}

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