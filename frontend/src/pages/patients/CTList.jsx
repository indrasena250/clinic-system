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
  Card,
  CardContent,
  Grid,
  Autocomplete,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SendIcon from "@mui/icons-material/Send";
import ClearIcon from "@mui/icons-material/Clear";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
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
  const [doctorOptions, setDoctorOptions] = useState(() => {
    const saved = localStorage.getItem("doctors");
    return saved ? JSON.parse(saved) : [];
  });

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
        id: item.clinic_scan_patient_id || item.clinic_patient_id || item.id,
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
    // Parse age and age_unit from combined format (e.g., "5Y" -> age: 5, age_unit: "years")
    let ageNum = row.age;
    let ageUnit = "years";
    
    if (typeof row.age === "string") {
      const match = row.age.match(/^(\d+)([YM]?)$/);
      if (match) {
        ageNum = parseInt(match[1], 10);
        ageUnit = match[2] === "M" ? "months" : "years";
      }
    }

    setEditData({ 
      ...row, 
      age: ageNum,
      age_unit: ageUnit
    });
    setOpen(true);
  };

const handleUpdate = async () => {
  if (!editData.mobile || editData.mobile.length !== 10) {
    alert("Mobile number must be exactly 10 digits");
    return;
  }

  try {
    const existingRow = rows.find(r => r.id === editData.id);
    
    // Use database_id for backend API call
    const updateId = editData.database_id || editData.id;
    
    // Format age with unit
    const ageUnit = editData.age_unit === 'months' ? 'M' : 'Y';
    const formattedAge = `${editData.age}${ageUnit}`;

    await updatePatient(updateId, {
      patient_name: editData.patient_name || existingRow.patient_name,
      age: editData.age ?? existingRow.age,
      age_unit: editData.age_unit || "years",
      gender: editData.gender || existingRow.gender,
      mobile: editData.mobile || existingRow.mobile,
      address: editData.address ?? existingRow.address ?? null,
      scan_category: existingRow.scan_category, // LOCKED
      scan_name: editData.scan_name ?? existingRow.scan_name,
      referred_doctor: editData.referred_doctor ?? existingRow.referred_doctor,
      amount: editData.amount ?? existingRow.amount,
    });

    // Update doctor list if new doctor added
    if (editData.referred_doctor && !doctorOptions.includes(editData.referred_doctor)) {
      const updated = [...doctorOptions, editData.referred_doctor];
      setDoctorOptions(updated);
      localStorage.setItem("doctors", JSON.stringify(updated));
    }

    // Reload from backend so mobile/desktop views stay in sync (esp. doctor updates)
    await loadData();
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

const { user } = useAuth();

  const toWhatsAppNumber = (mobile) => {
  // WhatsApp expects digits only with country code (no +, no spaces)
  const digits = String(mobile || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("91") && digits.length >= 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits; // fallback for other formats/countries
};

const CENTER_NAME = user?.clinic_name || "SRIDEVI DIAGNOSTIC CENTER";

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
    "",
    `Hello! ${name}, Your Bill Details are:`, 
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
    const type = scan.scan_name || "-";
    const amount = Number(scan.amount ?? 0);
    const formattedAmount = Number.isFinite(amount) ? amount.toFixed(2) : String(scan.amount ?? "-");
    const dateStr = formatDateTime(scan.upload_date);

    messageLines.push(`${index + 1}. ${type}`);
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
    `If you want to Download PDF kindly click the link : ${invoiceUrl}`
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
    const invoiceUrl = `${baseUrl}/patients/invoice/public/${row.invoice_id}?download=1`;
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
      headerName: "Sl No",
      flex: 0.342,
      minWidth: 30,
      align: "left",
      headerAlign: "left",
      display: 'flex',
    },
    {
      field: "upload_date",
      headerName: "Date & Time",
      flex: 1.1,
      minWidth: 120,
      align: "left",
      headerAlign: "left",
      display: 'flex',
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.2, height: "100%" }}>
          <Typography sx={{ fontSize: "13px", color: "#666" }}>
            {formatDate(params.value)}
          </Typography>
          <Chip
            label={formatTime(params.value)}
            size="small"
            sx={{
              backgroundColor: "#2196F3",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "11px",
              height: "20px",
            }}
          />
        </Box>
      ),
    },
    {
      field: "id",
      headerName: "ID",
      flex: 0.4,
      minWidth: 30,
      align: "left",
      headerAlign: "left",
      display: 'flex',
    },
    { field: "patient_name", headerName: "Patient Name", flex: 1.1,display: 'flex', minWidth: 100, align: "left", headerAlign: "left" },
    { field: "age", headerName: "Age", flex: 0.3,display: 'flex', minWidth: 10, align: "left", headerAlign: "left" },
    { field: "gender", headerName: "Gender", flex: 0.44, display: 'flex',minWidth: 30, align: "left", headerAlign: "left" },
    {
      field: "scan_name",
      headerName: "Scan Name",
      flex: 0.8,
      minWidth: 90,
      align: "left",
      headerAlign: "left",
      display: 'flex',
      renderCell: (params) => (
        <Typography sx={{ fontSize: 13, whiteSpace: "normal", wordBreak: "break-word" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "referred_doctor",
      headerName: "Doctor",
      flex: 1.15,
      minWidth: 50,
      align: "left",
      headerAlign: "left",
      display: 'flex',
      renderCell: (params) => (
        <Typography sx={{ fontSize: 12.5, whiteSpace: "normal", wordBreak: "break-word" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    { field: "mobile", headerName: "Mobile", flex: 0.65, display: 'flex',minWidth: 90, align: "left", headerAlign: "left" },
    {
      field: "address",
      headerName: "Address",
      flex: 1.0,
      minWidth: 100,
      align: "left",
      headerAlign: "left",
      display: 'flex',
      renderCell: (params) => (
        <Typography sx={{ fontSize: 13, whiteSpace: "normal", wordBreak: "break-word" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.6,
      minWidth: 65,
      align: "left",
      headerAlign: "left",
      display: 'flex',
      renderCell: (params) => `₹ ${params.value}`,
    },
    {
      field: "tools",
      headerName: "Actions",
      flex: 0.5,
      minWidth: 93,
      sortable: false,
      filterable: false,
      align: "left",
      headerAlign: "left",
      display: 'flex',
      renderCell: (params) => (
        <Box sx={{
          display: "flex",
          flexDirection: "row",
          gap: 0.01,
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
  }).sort((a, b) => {
    // Sort by ID in descending order, then recalculate SL NO
    return b.id - a.id;
  }).map((row, index) => ({
    ...row,
    slno: index + 1, // Recalculate SL NO in increasing order
  }));

  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: "20px",
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 0.1,
          pb: 1,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* TITLE */}
        <Box>
          <Typography
            sx={{
              fontSize: "1.6rem",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            CT Patients
          </Typography>

          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Manage patient records, invoices & reports
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "nowrap" }}>
          {[
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "7days", label: "7 Days" },
            { key: "month", label: "Month" },
            { key: "all", label: "All" },
          ].map((item) => (
            <Button
              key={item.key}
              onClick={() => setFilterRange(item.key)}
              sx={{
                borderRadius: "10px",
                px: isMd ? 0 : 3,
                py: isMd ? 0.2 : 0.6,
                fontSize: "0.8rem",
                textTransform: "none",
                fontWeight: 600,
                flexShrink: 0,
                whiteSpace: "nowrap",
                background:
                  filterRange === item.key
                    ? "linear-gradient(135deg,#1976d2,#42a5f5)"
                    : "rgba(0,0,0,0.04)",
                color: filterRange === item.key ? "#fff" : "#555",
                transition: "all 0.25s",
                "&:hover": {
                  transform: "translateY(-2px)",
                },
              }}
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
          sx={{
            minWidth: 260,
            "& .MuiOutlinedInput-root": {
              borderRadius: "999px",
              background: "rgba(0,0,0,0.03)",
            },
          }}
          InputProps={{
            endAdornment: searchTerm ? (
              <IconButton size="small" onClick={() => setSearchTerm("")}>
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null,
          }}
        />
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {isMd ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, px: 1 }}>
          {filteredRows.map((row) => (
            <Card key={row.id} sx={{
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid rgba(255,107,107,0.1)",
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(10px)",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              }
            }}>
              {/* Header Section */}
              <Box sx={{
                background: "linear-gradient(135deg, #3659a5, #4c3aaf)",
                color: "white",
                p: 2,
                position: "relative"
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 0.5 }}>
                      {row.patient_name || "-"}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`ID: ${row.id}`}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "0.75rem"
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.8rem", py: 0.7 }}>
                      {row.upload_date ? formatDateTime(row.upload_date) : "-"}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      SL: #{row.slno}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Content Section */}
              <CardContent sx={{ p: 1.5 }}>
                <Grid container spacing={1}>
                  {/* Scan Details */}
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", pt: 0.5, alignItems: "center", gap: 1, mb: 0.01, mt: 0.01 }}>
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#ff6b6b"
                      }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#333" }}>
                        Scan Details :
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: "#000000" }}>
                        {row.scan_name || "-"}
                      </Typography>
                    </Box>
                  </Grid>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ display: "flex", pt: 1, flexDirection: "row", gap: 1.5, justifyContent: "space-between", width: "100%" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: "#666" }} />
                        <Typography variant="body2" sx={{ color: "#000000" }}>
                          {row.referred_doctor || "-"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {row.gender || "-"}, {row.age || "-"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                

                  <Grid item xs={6}>
                    <Box sx={{ display: "flex", pt: 1, flexDirection: "row", gap: 1.5,justifyContent: "space-between", width: "100%" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          component="a"
                          href={row.mobile ? `tel:${row.mobile}` : undefined}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1,
                            py: 0.3,
                            borderRadius: "20px",
                            background: "rgba(25,118,210,0.08)",
                            color: "#1976d2",
                            textDecoration: "none",
                            cursor: row.mobile ? "pointer" : "default",
                            transition: "all 0.25s ease",
                            "&:hover": row.mobile
                              ? {
                                  background: "rgba(25,118,210,0.18)",
                                  transform: "scale(1.05)",
                                }
                              : {},
                          }}
                        >
                          <PhoneIcon sx={{ fontSize: 16 }} />
                          <Typography
                            sx={{
                              fontSize: 15,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.mobile || "-"}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.1 }}>
                        <LocationOnIcon sx={{ fontSize: 16, color: "#666" }} />
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          {row.address || "-"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                

                {/* Amount & Actions */}
                <Box sx={{
                  mt: 1,
                  pt: 1,
                  borderTop: "1px solid rgba(0,0,0,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#2e7d32" }}>
                      ₹{row.amount || 0}
                    </Typography>
                    <Chip
                      label="Paid"
                      size="small"
                      sx={{
                        backgroundColor: "#4caf50",
                        color: "white",
                        fontSize: "0.7rem",
                        height: "20px"
                      }}
                    />
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      size="small"
                      sx={{
                        backgroundColor: "#4caf50",
                        color: "white",
                        "&:hover": { backgroundColor: "#45a049" }
                      }}
                      onClick={() => handleDownloadInvoice(row.invoice_id)}
                      title="Download Invoice"
                    >
                      <FileDownloadIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        backgroundColor: "#25D366",
                        color: "white",
                        "&:hover": { backgroundColor: "#1da851" }
                      }}
                      onClick={() => handleSendWhatsApp(row)}
                      title="Send via WhatsApp"
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        backgroundColor: "#2196f3",
                        color: "white",
                        "&:hover": { backgroundColor: "#1976d2" }
                      }}
                      onClick={() => handleEditClick(row)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <div style={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[5, 10, 20, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
            getRowHeight={() => "auto"}
            autoHeight
            disableSelectionOnClick
            sx={{
              border: "none",
              fontSize: "0.82rem",

              "& .MuiDataGrid-columnHeaders": {
                background: "rgba(0,0,0,0.04)",
                borderRadius: "10px",
                fontWeight: 600,
                py: 0.01,
              },

              "& .MuiDataGrid-row": {
                borderRadius: "10px",
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: "rgba(25,118,210,0.05)",
                  transform: "scale(1.002)",
                },
              },

              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid rgba(0,0,0,0.05)",
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
              <Box sx={{ display: "flex", gap: 2 }}>
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
                  label="Age Unit"
                  value={editData.age_unit || "years"}
                  onChange={(e) =>
                    setEditData({ ...editData, age_unit: e.target.value })
                  }
                  sx={{ maxWidth: "120px" }}
                >
                  <MenuItem value="years">Years</MenuItem>
                  <MenuItem value="months">Months</MenuItem>
                </TextField>
              </Box>
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
              <Autocomplete
                fullWidth
                options={doctorOptions}
                value={editData.referred_doctor || ""}
                onChange={(e, value) =>
                  setEditData({ ...editData, referred_doctor: value })
                }
                inputValue={editData.referred_doctor || ""}
                onInputChange={(e, value) =>
                  setEditData({ ...editData, referred_doctor: value })
                }
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Referred Doctor"
                    margin="normal"
                    helperText="Select from list or type new doctor name"
                  />
                )}
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