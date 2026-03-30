// src/pages/patients/AddPatient.jsx
import { keyframes } from "@mui/system";
import Confetti from "react-confetti";

import { useEffect, useMemo, useState } from "react";
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
  CardContent,
  IconButton,
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import dayjs from "dayjs";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { createPatient, getNextPatientId, getNextCTId, getNextUltraId } from "../../api/patientApi";
import { scanPrices, usgScans, ctScans } from "../../utils/scanPrices";
import { playSound } from "../../utils/soundUtils";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const schema = yup.object().shape({
  patient_name: yup.string().required("Patient name required"),
  age: yup.number().typeError("Age must be number").required("Age required").positive("Age must be positive"),
  age_unit: yup.string().required("Age unit required"),
  gender: yup.string().required("Gender required"),
  mobile: yup.string().required("Mobile required"),
  address: yup.string().required("Address required").max(255, "Address is too long"),
  scans: yup.array().of(
    yup.object().shape({
      scan_category: yup.string().required("Scan type required"),
      scan_name: yup.string().required("Scan name required"),
      referred_doctor: yup.string().required("Doctor required"),
      amount: yup.number().typeError("Amount must be number").required("Amount required")
    })
  ).min(1, "At least one scan is required"),
  upload_date: yup.date().required("Upload date required")
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
const popupScale = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.7) translateY(-20px);
  }
  60% {
    transform: scale(1.05) translateY(5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;
const AddPatient = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [openPopup, setOpenPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); // success | error
  const [loading, setLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(dayjs());
  const [nextPatientId, setNextPatientId] = useState(null);
  const [nextCTId, setNextCTId] = useState(null);
  const [nextUltraId, setNextUltraId] = useState(null);

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
    clearErrors,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      patient_name: "",
      age: "",
      age_unit: "years",
      gender: "",
      mobile: "",
      address: "",
      scans: [{
        scan_category: "",
        scan_name: "",
        referred_doctor: "",
        amount: ""
      }],
      upload_date: currentDateTime
    }
  });

  const { fields, append, remove } = useFieldArray({
  control,
  name: "scans"
});

const watchedScans = useWatch({
  control,
  name: "scans",
  defaultValue: []
});

const totalAmount = useMemo(() => {
  return watchedScans.reduce((total, scan) => {
    const amount = Number(scan?.amount);
    return total + (isNaN(amount) ? 0 : amount);
  }, 0);
}, [JSON.stringify(watchedScans)]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNextIds = async () => {
      try {
        const [generalRes, ctRes, ultraRes] = await Promise.all([
          getNextPatientId(),
          getNextCTId(),
          getNextUltraId()
        ]);
        setNextPatientId(generalRes.nextId);
        setNextCTId(ctRes.nextId);
        setNextUltraId(ultraRes.nextId);
      } catch (error) {
        console.error("Error fetching next patient IDs:", error);
      }
    };
    fetchNextIds();
  }, []);

  useEffect(() => {
    setValue('upload_date', currentDateTime);
  }, [currentDateTime, setValue]);

useEffect(() => {
  if (openPopup) {
    const timer = setTimeout(() => {
      setOpenPopup(false);
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }
}, [openPopup]);

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
        upload_date: finalDateTime.format("YYYY-MM-DD HH:mm:ss"),
        scans: data.scans // Send scans array
      });

      // Update doctor options
      const newDoctors = data.scans
        .map(scan => scan.referred_doctor)
        .filter(doctor => doctor && !doctorOptions.includes(doctor));

      if (newDoctors.length > 0) {
        const updated = [...doctorOptions, ...newDoctors];
        setDoctorOptions(updated);
        localStorage.setItem("doctors", JSON.stringify(updated));
      }

      setPopupType("success");
      setOpenPopup(true);
      playSound("success");

      // Refresh next patient ID
      const response = await getNextPatientId();
      setNextPatientId(response.nextId);

      // Reset form
      reset({
        patient_name: "",
        age: "",
        age_unit: "years",
        gender: "",
        mobile: "",
        address: "",
        scans: [{
          scan_category: "",
          scan_name: "",
          referred_doctor: "",
          amount: ""
        }],
        upload_date: dayjs()
      });

      clearErrors();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || "Failed to add patient");
      setPopupType("error");
      setOpenPopup(true);
      playSound("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          background: "linear-gradient(135deg, #001a8f 0%, #764ba2 25%, #56ca39 50%, #7e08b4 75%, #05038d 100%)",
          minHeight: "50vh",
          pt: 4,
          px: 0,
          pb: 4,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          borderRadius: 3
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
            Add Patient Scans
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={0.75} sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
            Enter patient details and scan information (multiple scans supported)
          </Typography>

          <Divider sx={{ my: 1, opacity: 0.5 }} />

          

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* PATIENT INFORMATION SECTION */}
            <Card
              sx={{
                mb: 1,
                boxShadow: "1 8px 32px rgba(102, 126, 234, 0.15)",
                borderRadius: 2,
                border: "1px solid rgba(102, 126, 234, 0.1)",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,247,255,0.95) 100%)"
              }}
            >
              <CardContent
                sx={{
                  pt: 0.5,
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
                    fontSize: "1.2rem",
                    color: "#0f0092",
                    mb: 1   // 🔥 spacing fix
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

                {/* FLEX ROW (RESPONSIVE) */}
                <Box
                  sx={{
                    display: "flex",
                    gap: isMobile ? 1 : 2,
                    width: "100%",
                    flexWrap: "wrap",
                    flexDirection: isMobile ? "column" : "row"
                  }}
                >

                  {/* Patient Name */}
                  <Box sx={{ flex: isMobile ? "none" : 3.5, minWidth: isMobile ? "100%" : 220, width: isMobile ? "100%" : "auto" }}>
                    <Controller
                      name="patient_name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Patient Name"
                          fullWidth
                          size={isMobile ? "medium" : "small"}
                          error={!!errors.patient_name}
                          helperText={errors.patient_name?.message}
                        />
                      )}
                    />
                  </Box>

                  {/* Age & Age Unit Row */}
                  <Box sx={{
                    flex: isMobile ? "none" : 3,
                    minWidth: isMobile ? "100%" : 190,
                    width: isMobile ? "100%" : "auto",
                    display: "flex",
                    gap: 1
                  }}>
                    <Box sx={{ flex: 2 }}>
                      <Controller
                        name="age"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Age"
                            type="number"
                            fullWidth
                            size={isMobile ? "medium" : "small"}
                            error={!!errors.age}
                            helperText={errors.age?.message}
                          />
                        )}
                      />
                    </Box>
                    <Box sx={{ flex: 2 }}>
                      <Controller
                        name="age_unit"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            label="Unit"
                            fullWidth
                            size={isMobile ? "medium" : "small"}
                            error={!!errors.age_unit}
                            helperText={errors.age_unit?.message}
                          >
                            <MenuItem value="years">Years</MenuItem>
                            <MenuItem value="months">Months</MenuItem>
                          </TextField>
                        )}
                      />
                    </Box>
                  </Box>

                  {/* Gender */}
                  <Box sx={{ flex: isMobile ? "none" : 2.5, minWidth: isMobile ? "100%" : 150, width: isMobile ? "100%" : "auto" }}>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Gender"
                          fullWidth
                          size={isMobile ? "medium" : "small"}
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
                  <Box sx={{ flex: isMobile ? "none" : 3, minWidth: isMobile ? "100%" : 220, width: isMobile ? "100%" : "auto" }}>
                    <Controller
                      name="mobile"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Mobile Number"
                          fullWidth
                          size={isMobile ? "medium" : "small"}
                          error={!!errors.mobile}
                          helperText={errors.mobile?.message}
                        />
                      )}
                    />
                  </Box>
                  <Box sx={{ flex: isMobile ? "none" : 4, minWidth: isMobile ? "100%" : 220, width: isMobile ? "100%" : "auto" }}>
                    <Controller
                      name="address"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Address"
                          fullWidth
                          multiline
                          minRows={1}
                          size="small"
                          variant="outlined"
                          error={!!errors.address}
                          helperText={errors.address?.message}
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
                mb: 1,
                boxShadow: "2px 8px 32px rgba(255, 107, 107, 0.15)",
                borderRadius: 2,
                border: "1px solid rgba(255, 107, 107, 0.1)",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,247,255,0.95) 100%)"
              }}
            >
              <CardContent
                sx={{
                  pt: 0.5,
                  pb: 1,
                  "&:last-child": { pb: 1 }
                }}
              >
                {/* Title with Add Button */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: "1.2rem",
                      color: "#02046e"
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
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const firstScanDoctor = watch('scans.0.referred_doctor');
                      append({
                        scan_category: "",
                        scan_name: "",
                        referred_doctor: firstScanDoctor || "",
                        amount: ""
                      });
                    }}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Add Scan
                  </Button>
                </Box>

                {/* Dynamic Scan Forms */}
                {fields.map((field, index) => (
                  <Card
                    key={field.id}
                    sx={{
                      mb: 2,
                      p: 1.5,
                      background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,247,255,0.9) 100%)",
                      border: "1px solid rgba(255, 107, 107, 0.2)",
                      position: 'relative'
                    }}
                  >
                    {/* Remove button */}
                    {fields.length > 1 && (
                      <IconButton
                        onClick={() => remove(index)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          color: '#ff6b6b',
                          '&:hover': { backgroundColor: 'rgba(255, 107, 107, 0.1)' }
                        }}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#ff8800', fontWeight: 'bold' }}>
                        Scan {index + 1}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      {/* ID DISPLAY */}
                      <Box
                        sx={{
                          flex: isMobile ? "none" : 0.5,
                          minWidth: isMobile ? "100%" : 120,
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        {(() => {
                          const scanCategory = watch(`scans.${index}.scan_category`);
                          let scanId = null;

                          const allScans = watch("scans") || [];

                          // Count previous scans of same category
                          const sameTypeCount = allScans
                            .slice(0, index)
                            .filter(scan => scan?.scan_category === scanCategory).length;

                          if (scanCategory === 'CT' && nextCTId) {
                            scanId = Number(nextCTId) + sameTypeCount;
                          } 
                          else if (scanCategory === 'Ultrasound' && nextUltraId) {
                            scanId = Number(nextUltraId) + sameTypeCount;
                          } 
                          else if (!scanCategory && nextUltraId) {
                          const sameTypeCount = watchedScans
                            ?.slice(0, index)
                            ?.filter(s => !s?.scan_category || s?.scan_category === '').length;

                          scanId = Number(nextUltraId) + sameTypeCount;
                        }

                          return scanId && (
                            <Box
                              sx={{
                                width: "100%",
                                textAlign: "center",
                                p: 1,
                                borderRadius: 1,
                                backgroundColor: "rgba(117, 216, 255, 0.18)"
                              }}
                            >
                              <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
                                ID:
                                <Box
                                  component="span"
                                  sx={{
                                    color: "#d32f2f",
                                    fontWeight: 900,
                                    ml: 1
                                  }}
                                >
                                  {scanId}
                                </Box>
                              </Typography>
                            </Box>
                          );
                        })()}
                      </Box>
                      {/* Scan Type */}
                      <Box sx={{ flex: isMobile ? "none" : 1.5, minWidth: isMobile ? "100%" : 150, width: isMobile ? "100%" : "auto" }}>
                        <Controller
                          name={`scans.${index}.scan_category`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              select
                              label="Scan Type"
                              fullWidth
                              size={isMobile ? "medium" : "small"}
                              error={!!errors.scans?.[index]?.scan_category}
                              helperText={errors.scans?.[index]?.scan_category?.message}
                            >
                              <MenuItem value="">Select</MenuItem>
                              <MenuItem value="CT">CT Scan</MenuItem>
                              <MenuItem value="Ultrasound">Ultrasound</MenuItem>
                            </TextField>
                          )}
                        />
                      </Box>

                      {/* Scan Name */}
                      <Box sx={{ flex: isMobile ? "none" : 1.5, minWidth: isMobile ? "100%" : 150, width: isMobile ? "100%" : "auto" }}>
                        <Controller
                          name={`scans.${index}.scan_name`}
                          control={control}
                          render={({ field }) => {
                            const currentCategory = watch(`scans.${index}.scan_category`);
                            const scanOptions = currentCategory === "CT" ? ctScans : currentCategory === "Ultrasound" ? usgScans : [];
                            return (
                              <Autocomplete
                                freeSolo
                                options={scanOptions}
                                value={field.value || ""}
                                onChange={(e, value) => {
                                  field.onChange(value);
                                  // Auto-fill amount based on scan name
                                  const price = scanPrices[value];
                                  if (price != null) {
                                    setValue(`scans.${index}.amount`, price, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                    shouldTouch: true
                                  });
                                  }
                                }}
                                onInputChange={(e, value) => field.onChange(value)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Scan Name"
                                    fullWidth
                                    size={isMobile ? "medium" : "small"}
                                    error={!!errors.scans?.[index]?.scan_name}
                                    helperText={errors.scans?.[index]?.scan_name?.message}
                                  />
                                )}
                              />
                            );
                          }}
                        />
                      </Box>

                      {/* Referring Doctor */}
                      <Box sx={{ flex: isMobile ? "none" : 1.5, minWidth: isMobile ? "100%" : 150, width: isMobile ? "100%" : "auto" }}>
                        <Controller
                          name={`scans.${index}.referred_doctor`}
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              freeSolo
                              options={doctorOptions}
                              value={field.value || ""}
                              onChange={(e, value) => field.onChange(value || "")}
                              onInputChange={(e, value, reason) => {
                                if (reason === 'input') {
                                  field.onChange(value);
                                }
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Referring Doctor"
                                  fullWidth
                                  size={isMobile ? "medium" : "small"}
                                  error={!!errors.scans?.[index]?.referred_doctor}
                                  helperText={errors.scans?.[index]?.referred_doctor?.message}
                                />
                              )}
                            />
                          )}
                        />
                      </Box>

                      {/* Amount */}
                      <Grid item xs={12}>
                        <Controller
                          name={`scans.${index}.amount`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                              }}
                              label="Amount (₹)"
                              type="number"
                              fullWidth
                              size={isMobile ? "medium" : "small"}
                              error={!!errors.scans?.[index]?.amount}
                              helperText={errors.scans?.[index]?.amount?.message}
                            />
                          )}
                        />
                      </Grid>


                    </Grid>
                  </Card>
                ))}

                
              </CardContent>
            </Card>


            {/* BILLING SECTION */}
            <Card sx={{ mb: 1, boxShadow: "0 8px 32px rgba(76, 175, 80, 0.15)", borderRadius: 2, border: "1px solid rgba(76, 175, 80, 0.1)", background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,247,255,0.95) 100%)" }}>
              <CardContent sx={{ pt: 1, pb: 1, "&:last-child": { pb: 1 } }}>
                <Typography variant="subtitle2" fontWeight="bold" mb={1} sx={{ display: 'flex', alignItems: 'center', fontSize: '1.2 rem', color: '#08860c' }}>
                  <Box sx={{ width: 5, height: 18, background: "linear-gradient(135deg, #008304 0%, #008307 100%)", borderRadius: 0.5, mr: 1 }} />
                  Billing & Upload Details
                </Typography>

                <Grid container spacing={2}>
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
                    
                  
                
                {/* Total Amount Display */}
                <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mt: 0, p: 0, backgroundColor: 'rgba(117, 216, 255, 0.18)', borderRadius: 1 }}>
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: '900',
                        color: '#000',
                        fontSize: '1.8rem'
                      }}
                    >
                      Total Amount:{" "}
                      <Box
                        component="span"
                        sx={{
                          color: '#d32f2f',
                          fontWeight: 800,
                          fontSize: '2.1rem',
                          alignment: 'right'
                        }}
                      >
                        ₹{totalAmount.toFixed(2)}
                      </Box>
                    </Typography>
                </Box>
                </Grid>
                
              

            {/* SUBMIT BUTTON */}
           
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  type="submit"
                  fullWidth
                  size="small"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    height: 42,
                    fontWeight: "900",
                    fontSize: 25,
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
            </CardContent>
            </Card>
          </form>
        </Paper>
      </Box>
      {openPopup && popupType === "success" && (
  <Confetti
    width={window.innerWidth}
    height={window.innerHeight}
    numberOfPieces={900}
    recycle={false}
  />
)}
      <Dialog
  open={openPopup}
  onClose={() => setOpenPopup(false)}
  PaperProps={{
    sx: {
      borderRadius: 4,
      px: 4,
      py: 3,
      textAlign: "center",
      minWidth: 320,
      animation: `${popupScale} 0.4s ease`
    }
  }}
>
  <DialogContent>
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>

      {/* ICON */}
      <Box
        sx={{
          width: 70,
          height: 70,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            popupType === "success"
              ? "linear-gradient(135deg, #28a745, #4caf50)"
              : "linear-gradient(135deg, #dc3545, #ff6b6b)",
          color: "#fff",
          fontSize: 30,
          boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
        }}
      >
        {popupType === "success" ? "✓" : "!"}
      </Box>

      {/* TITLE */}
      <Typography sx={{ fontWeight: 800, fontSize: "1.2rem" }}>
        {popupType === "success"
          ? "Patient Added Successfully"
          : "Error"}
      </Typography>

      {/* MESSAGE */}
      <Typography sx={{ fontSize: "0.9rem", color: "#555" }}>
        {popupType === "success"
          ? "Patient data saved successfully."
          : errorMsg}
      </Typography>

    </Box>
  </DialogContent>
</Dialog>
    </LocalizationProvider>
  );
};

export default AddPatient;