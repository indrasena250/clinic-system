import { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Box,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

import { formatDate } from "../../utils/date";
import { fetchDoctorSettlement, fetchDoctors } from "../../api/patientApi";
import { Button } from "@mui/material";
import { downloadSettlementPDF } from "../../api/patientApi";

const DoctorSettlement = () => {

  const [doctor, setDoctor] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");


const handleDownload = async () => {

  try {

    if (!doctor) {
      alert("Select doctor first");
      return;
    }

    if (!fromDate || !toDate) {
      alert("Select date range");
      return;
    }

    const blob = await downloadSettlementPDF(doctor, fromDate, toDate);
    if (!blob) throw new Error("No PDF data received");

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${doctor}_settlement.pdf`);

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Download error:", error);
    alert("Failed to download PDF");
  }

};
  /* ===============================
     LOAD DOCTORS
  =============================== */

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const data = await fetchDoctors();
      setDoctors(data);
    } catch (error) {
      console.error("Doctor fetch error", error);
    }
  };

  /* ===============================
     LOAD SETTLEMENT
  =============================== */

  const loadSettlement = async (doctorName) => {
    if (!doctorName) return;

    try {
      const data = await fetchDoctorSettlement(doctorName);

      const mapped = data.map((item, idx) => ({
        id: idx + 1,
        upload_date: item.upload_date,
        date: formatDate(item.upload_date),
        day: dayjs.utc(item.upload_date).tz("Asia/Kolkata").format("dddd"),
        patient: item.patient_name,
        scan: item.scan_name,
        referral: Number(item.referral_amount) || 0,
      }));

      setRows(mapped);
    } catch (error) {
      console.error("Settlement fetch error", error);
    }
  };

  /* ===============================
     WHEN DOCTOR CHANGES
  =============================== */

  useEffect(() => {
    if (doctor) {
      loadSettlement(doctor);
    }
  }, [doctor]);

  /* ===============================
     DATE FILTER
  =============================== */

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (!fromDate && !toDate) return true;

      const d = dayjs(r.upload_date);

      if (fromDate && d.isBefore(dayjs(fromDate), "day")) return false;
      if (toDate && d.isAfter(dayjs(toDate), "day")) return false;

      return true;
    });
  }, [rows, fromDate, toDate]);

  /* ===============================
     TOTAL REFERRAL
  =============================== */

  const totalReferral = useMemo(
    () => filteredRows.reduce((sum, r) => sum + r.referral, 0),
    [filteredRows]
  );

  /* ===============================
     TABLE COLUMNS
  =============================== */

  const columns = [
    { field: "date", headerName: "Date", width: 120 },
    { field: "day", headerName: "Day", width: 120 },
    { field: "patient", headerName: "Patient", flex: 1 },
    { field: "scan", headerName: "Scan", flex: 1 },
    {
      field: "referral",
      headerName: "Referral",
      width: 140,
      renderCell: (params) => `₹ ${params.value}`,
    },
  ];

  return (
    <Paper sx={{ p: 3 }}>

      <Typography variant="h5" mb={3} fontWeight="bold">
        Doctor Settlement
      </Typography>

      <Grid container spacing={2} mb={3} alignItems="center">

        {/* Doctor Dropdown */}
        <Grid item>
          <TextField
            select
            label="Select Doctor"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            sx={{ width: 250 }}
          >
            {doctors.map((d, index) => (
              <MenuItem key={index} value={d.referred_doctor}>
                {d.referred_doctor}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* From Date */}
        <Grid item>
          <TextField
            label="From"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* To Date */}
        <Grid item>
          <TextField
            label="To"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Total Referral */}
        <Grid item>
          <Button
  variant="contained"
  color="success"
  onClick={handleDownload}
  sx={{ height: 50 }}
>
  Download Settlement
</Button>
          <Chip
            label={`Total Referral: ₹ ${totalReferral}`}
            sx={{
              fontWeight: "bold",
              fontSize: "18px",
              height: 50,
              px: 2,
              backgroundColor: "#1976d2",
              color: "white",
            }}
          />
        </Grid>

      </Grid>

      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSizeOptions={[10]}
          disableRowSelectionOnClick
        />
      </Box>

    </Paper>
  );
};

export default DoctorSettlement;