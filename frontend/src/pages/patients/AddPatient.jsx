// src/pages/patients/AddPatient.jsx
import { keyframes } from "@mui/system";

import { useEffect, useState } from "react";
import {
  Button,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Paper,
  Alert,
  Divider,
  Autocomplete,
  Box,
  Card,
  CardContent
} from "@mui/material";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import dayjs from "dayjs";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { createPatient } from "../../api/patientApi";
import { scanPrices, usgScans, ctScans } from "../../utils/scanPrices";

const schema = yup.object().shape({
  patient_name: yup.string().required("Patient name required"),
  age: yup.number().typeError("Age must be number").required(),
  gender: yup.string().required(),
  mobile: yup.string().required(),
  // Optional address field for billing and display
  address: yup.string().max(255, "Address is too long"),
  scan_category: yup.string().required(),
  scan_name: yup.string().required(),
  referred_doctor: yup.string().required(),
  amount: yup.number().typeError("Amount must be number").required(),
  upload_date: yup.date().required()
});
const fadeSlide = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(3px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;
const AddPatient = () => {
  const [scanOptions, setScanOptions] = useState([]);
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(dayjs());

  const [doctorOptions, setDoctorOptions] = useState(() => {
    const saved = localStorage.getItem("doctors");
    return saved ? JSON.parse(saved) : [];
  });

  const {
  control,
  handleSubmit,
  reset,
  setValue,
  watch,
  clearErrors,   // ✅ ADD THIS
  formState: { errors }
} = useForm({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      patient_name: "",
      age: "",
      gender: "",
      mobile: "",
      address: "",
      scan_category: "",
      scan_name: "",
      referred_doctor: "",
      amount: "",
      upload_date: currentDateTime
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setValue('upload_date', currentDateTime);
  }, [currentDateTime, setValue]);

  const handleCategoryChange = (value) => {
    if (value === "CT") setScanOptions(ctScans);
    else if (value === "Ultrasound") setScanOptions(usgScans);
    else setScanOptions([]);

    setValue("scan_name", "");
    setValue("amount", "", { shouldValidate: true, shouldDirty: true });
  };

  const selectedScan = watch("scan_name");

  useEffect(() => {
    const price = scanPrices[selectedScan];
    if (price != null) {
      setValue("amount", price, { shouldValidate: true, shouldDirty: true });
    }
  }, [selectedScan, setValue]);
  useEffect(() => {
  if (success) {
    const timer = setTimeout(() => {
      setSuccess("");
    }, 10000);

    return () => clearTimeout(timer);
  }
}, [success]);

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess("");
    setErrorMsg("");

    try {
      const uploadDateTime = dayjs(data.upload_date);
      // If time is 00:00:00, use current time instead
      const finalDateTime = uploadDateTime.hour() === 0 && uploadDateTime.minute() === 0 && uploadDateTime.second() === 0
        ? uploadDateTime.hour(dayjs().hour()).minute(dayjs().minute()).second(dayjs().second())
        : uploadDateTime;

      await createPatient({
        ...data,
        upload_date: finalDateTime.format("YYYY-MM-DD HH:mm:ss")
      });

      if (!doctorOptions.includes(data.referred_doctor)) {
        const updated = [...doctorOptions, data.referred_doctor];
        setDoctorOptions(updated);
        localStorage.setItem("doctors", JSON.stringify(updated));
      }

      setSuccess("Patient added successfully");

      // ✅ RESET FORM
      reset({
        patient_name: "",
        age: "",
        gender: "",
        mobile: "",
        address: "",
        scan_category: "",
        scan_name: "",
        referred_doctor: "",
        amount: "",
        upload_date: dayjs()
      });

      // ✅ CLEAR ERRORS (MOST IMPORTANT FIX)
      clearErrors();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to add patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          background: "linear-gradient(135deg, #001a8f 0%, #764ba2 25%, #56ca39 50%, #7e08b4 75%, #05038d 100%)",
          minHeight: "83vh",
          pt: 1,
          px: 1,
          pb: .5,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center"
        }}
      >
        <Paper
          elevation={12}
          sx={{
            maxWidth: "95%",
            width: "100%",
            mx: "auto",
            p: 2,
            borderRadius: 3,
            background: "linear-gradient(to bottom right, #ffffff 0%, #f5f7ff 100%)",
            backdropFilter: "blur(10px)"
          }}
        >
          <Typography variant="h5" fontWeight="900" mb={0.25} sx={{ background: "linear-gradient(135deg, #0f0064 0%, #ff0101 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: '1.5rem' }}>
            Add Patient Scan
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={0.75} sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
            Enter patient details and scan information
          </Typography>

          <Divider sx={{ my: 1, opacity: 0.5 }} />

          {success && (
  <Box
    sx={{
      mb: 1,
      p: 1.5,
      borderRadius: 2,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
      border: "1px solid #28a745",
      boxShadow: "0 4px 12px rgba(40,167,69,0.2)",
      animation: `${fadeSlide} 0.4s ease`
    }}
  >
    {/* ICON */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#28a745",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "bold"
              }}
            >
              ✓
            </Box>


            {/* TEXT */}
            <Box>
              <Typography sx={{ fontWeight: 700, color: "#155724", fontSize: "0.95rem" }}>
                Patient Added Successfully
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "#155724" }}>
                The patient record has been saved and is now available.
              </Typography>
            </Box>
          </Box>
        )}
{errorMsg && <Alert severity="error" sx={{ mb: 0.75, py: 0.5, fontSize: '0.85rem' }}>{errorMsg}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* PATIENT INFORMATION SECTION */}
            <Card
              sx={{
                mb: 1.5,
                boxShadow: "0 8px 32px rgba(102, 126, 234, 0.15)",
                borderRadius: 2,
                border: "1px solid rgba(102, 126, 234, 0.1)",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,247,255,0.95) 100%)"
              }}
            >
              <CardContent
                sx={{
                  pt: 1,
                  pb: 1.5
                }}
              >
                {/* Title */}
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.9rem",
                    color: "#0f0092",
                    mb: 1.5   // 🔥 spacing fix
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: 18,
                      background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                      borderRadius: 0.5,
                      mr: 1
                    }}
                  />
                  Patient Information
                </Typography>

                {/* FLEX ROW (STABLE) */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    width: "100%",
                    flexWrap: "wrap"
                  }}
                >

                  {/* Patient Name */}
                  <Box sx={{ flex: 4, minWidth: 220 }}>
                    <Controller
                      name="patient_name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Patient Name"
                          fullWidth
                          size="small"
                          error={!!errors.patient_name}
                          helperText={errors.patient_name?.message}
                        />
                      )}
                    />
                  </Box>

                  {/* Age */}
                  <Box sx={{ flex: 2, minWidth: 120 }}>
                    <Controller
                      name="age"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Age"
                          type="number"
                          fullWidth
                          size="small"
                          error={!!errors.age}
                          helperText={errors.age?.message}
                        />
                      )}
                    />
                  </Box>

                  {/* Gender (WIDER FIXED) */}
                  <Box sx={{ flex: 2.5, minWidth: 150 }}>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Gender"
                          fullWidth
                          size="small"
                          sx={{
                            width: "100%"
                          }}
                          error={!!errors.gender}
                          helperText={errors.gender?.message}
                        >
                          <MenuItem value="">Select</MenuItem>
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </TextField>
                      )}
                    />
                  </Box>

                  {/* Mobile */}
                  <Box sx={{ flex: 3, minWidth: 220 }}>
                    <Controller
                      name="mobile"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Mobile Number"
                          fullWidth
                          size="small"
                          error={!!errors.mobile}
                          helperText={errors.mobile?.message}
                        />
                      )}
                    />
                  </Box>

                </Box>
              </CardContent>
            </Card>
            {/* SCAN DETAILS SECTION */}
            <Card
              sx={{
                mb: 1.5,
                boxShadow: "0 8px 32px rgba(255, 107, 107, 0.15)",
                borderRadius: 2,
                border: "1px solid rgba(255, 107, 107, 0.1)",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,247,255,0.95) 100%)"
              }}
            >
              <CardContent
                sx={{
                  pt: 1,
                  pb: 1
                }}
              >
                {/* Title */}
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.9rem",
                    color: "#fd0a0a",
                    mb: 1.5   // 🔥 spacing fix
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: 18,
                      background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
                      borderRadius: 0.5,
                      mr: 1
                    }}
                  />
                  Scan Details
                </Typography>

                {/* FLEX ROW */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    width: "100%",
                    flexWrap: "wrap"
                  }}
                >

                  {/* Scan Type */}
                  <Box sx={{ flex: 3, minWidth: 220 }}>
                    <Controller
                      name="scan_category"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Scan Type"
                          fullWidth
                          size="small"
                          error={!!errors.scan_category}
                          helperText={errors.scan_category?.message}
                          onChange={(e) => {
                            field.onChange(e);
                            handleCategoryChange(e.target.value);
                          }}
                        >
                          <MenuItem value="">Select</MenuItem>
                          <MenuItem value="CT">CT Scan</MenuItem>
                          <MenuItem value="Ultrasound">Ultrasound</MenuItem>
                        </TextField>
                      )}
                    />
                  </Box>

                  {/* Scan Name */}
                  <Box sx={{ flex: 4, minWidth: 260 }}>
                    <Controller
                      name="scan_name"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          freeSolo
                          options={scanOptions}
                          value={field.value || ""}
                          onChange={(e, value) => field.onChange(value)}
                          onInputChange={(e, value) => field.onChange(value)}
                          sx={{ width: "100%" }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Scan Name"
                              fullWidth
                              size="small"
                              error={!!errors.scan_name}
                              helperText={errors.scan_name?.message}
                            />
                          )}
                        />
                      )}
                    />
                  </Box>

                  {/* Referring Doctor */}
                  <Box sx={{ flex: 3, minWidth: 220 }}>
                    <Controller
                      name="referred_doctor"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          freeSolo
                          options={doctorOptions}
                          value={field.value || ""}
                          onChange={(e, value) => field.onChange(value)}
                          onInputChange={(e, value) => field.onChange(value)}
                          sx={{ width: "100%" }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Referring Doctor"
                              fullWidth
                              size="small"
                              error={!!errors.referred_doctor}
                              helperText={errors.referred_doctor?.message}
                            />
                          )}
                        />
                      )}
                    />
                  </Box>

                </Box>
              </CardContent>
            </Card>
            {/* BILLING SECTION */}
            <Card sx={{ mb: 1, boxShadow: "0 8px 32px rgba(76, 175, 80, 0.15)", borderRadius: 2, border: "1px solid rgba(76, 175, 80, 0.1)", background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,247,255,0.95) 100%)" }}>
              <CardContent sx={{ pt: 1, pb: 1, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="subtitle2" fontWeight="bold" mb={1} sx={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: '#08860c' }}>
                  <Box sx={{ width: 4, height: 18, background: "linear-gradient(135deg, #008304 0%, #008307 100%)", borderRadius: 0.5, mr: 1 }} />
                  Billing
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Amount (₹)"
                          type="number"
                          fullWidth
                          variant="outlined"
                          error={!!errors.amount}
                          helperText={errors.amount?.message}
                          size="small"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Controller
                      name="upload_date"
                      control={control}
                      render={({ field }) => (
                        <DateTimePicker
                          label="Upload Date & Time"
                          value={field.value}
                          onChange={(date) => field.onChange(date)}
                          format="DD/MM/YYYY HH:mm:ss"
                          views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
                          slotProps={{ textField: { fullWidth: true, variant: 'outlined', error: !!errors.upload_date, helperText: errors.upload_date?.message, size: 'small' } }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="address"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Address"
                          fullWidth
                          multiline
                          minRows={2}
                          size="small"
                          variant="outlined"
                          error={!!errors.address}
                          helperText={errors.address?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* SUBMIT BUTTON */}
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  size="small"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    height: 42,
                    fontWeight: "900",
                    fontSize: 13,
                    background: "linear-gradient(135deg, #042cdd 0%, #2b00a1 50%, #210ce6 100%)",
                    borderRadius: 2,
                    boxShadow: "0 8px 24px rgb(255, 255, 255)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    '&:hover': {
                      boxShadow: "0 12px 32px rgb(0, 47, 255)",
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': {
                      opacity: 0.7
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? "Adding Patient..." : "ADD PATIENT"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default AddPatient;