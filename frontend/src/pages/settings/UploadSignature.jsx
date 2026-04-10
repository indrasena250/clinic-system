import { useState, useRef, useEffect } from "react";
import {
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Grid,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { CloudUpload, Image, Refresh, Delete } from "@mui/icons-material";
import API from "../../api/axios";
import { playSound } from "../../utils/soundUtils";
import { uploadSignature, getAllSignatures, deleteSignature, getClinicSettings, updateClinicSettings } from "../../api/settingsApi";

const UploadSignature = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [allSignatures, setAllSignatures] = useState([]);
  const [signatureUrls, setSignatureUrls] = useState({});
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicLoading, setClinicLoading] = useState(true);
  const [clinicSaving, setClinicSaving] = useState(false);
  const [clinicError, setClinicError] = useState("");
  const [clinicSuccess, setClinicSuccess] = useState("");
  const [selectedSuccessSound, setSelectedSuccessSound] = useState(() => localStorage.getItem("selectedSuccessSound") || "chime");
  const [selectedErrorSound, setSelectedErrorSound] = useState(() => localStorage.getItem("selectedErrorSound") || "gentle");
  const [customSuccessSoundUrl, setCustomSuccessSoundUrl] = useState(() => localStorage.getItem("customSuccessSoundUrl") || "");
  const [customSuccessSoundName, setCustomSuccessSoundName] = useState(() => localStorage.getItem("customSuccessSoundName") || "");
  const [customErrorSoundUrl, setCustomErrorSoundUrl] = useState(() => localStorage.getItem("customErrorSoundUrl") || "");
  const [customErrorSoundName, setCustomErrorSoundName] = useState(() => localStorage.getItem("customErrorSoundName") || "");
  const [playingSound, setPlayingSound] = useState(null);
  const [soundSuccess, setSoundSuccess] = useState("");
  const fileInputRef = useRef(null);
  const previewAudioRef = useRef(null);

  const fetchCurrentSignature = async () => {
    try {
      // Clean up old blob URL if it exists
      if (currentSignature && currentSignature.startsWith("blob:")) {
        
      }

      // Add cache-busting query parameter to force fresh fetch
      const timestamp = new Date().getTime();
      const res = await API.get(`/patients/signature-image?t=${timestamp}`);

      setCurrentSignature(res.data.filePath);
    } catch (err) {
      console.error("Failed to fetch current signature:", err);
      setCurrentSignature(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSignatures = async () => {
    try {
      setLoadingSignatures(true);
      const data = await getAllSignatures();
      const sigs = data.signatures || [];
      setAllSignatures(sigs);
      
      // Preload all signature images as blobs
      const urls = {};
for (const sig of sigs) {
  urls[sig.id] = sig.file_path;
}
setSignatureUrls(urls);
    } catch (err) {
      console.error("Failed to fetch all signatures:", err);
      setAllSignatures([]);
    } finally {
      setLoadingSignatures(false);
    }
  };

  const handleSelectSignature = async (id) => {
    try {
      const selected = allSignatures.find(sig => sig.id === id);
if (selected) {
  setCurrentSignature(selected.file_path);
}
    } catch (err) {
      console.error("Failed to select signature:", err);
      setError("Failed to select signature");
    }
  };

  const handleDeleteSignature = async (id, event) => {
    event.stopPropagation(); // Prevent triggering select when clicking delete
    
    if (window.confirm("Are you sure you want to delete this signature?")) {
      try {
        await deleteSignature(id);
        setSuccess("Signature deleted successfully!");
        await fetchAllSignatures();
        await fetchCurrentSignature();
      } catch (err) {
        console.error("Failed to delete signature:", err);
        setError("Failed to delete signature");
      }
    }
  };

  const fetchClinicSettings = async () => {
    setClinicLoading(true);
    setClinicError("");
    try {
      const data = await getClinicSettings();
      setClinicName(data.name || "");
      setClinicAddress(data.address || "");
      setClinicPhone(data.phone || "");
    } catch (err) {
      console.error("Failed to fetch clinic settings:", err);
      setClinicError("Failed to load clinic settings");
    } finally {
      setClinicLoading(false);
    }
  };

  const successSounds = [
    { id: "chime", name: "Success Chime", description: "Pleasant ascending chime" },
    { id: "notification", name: "Notification", description: "Modern notification sound" },
    { id: "celebration", name: "Celebration", description: "Joyful celebration sound" },
    { id: "soft", name: "Soft Melody", description: "Gentle melodic tone" },
    { id: "crystal", name: "Crystal", description: "Clear crystal-like sound" },
    { id: "magic", name: "Magic", description: "Magical sparkling sound" },
    { id: "uplifting", name: "Uplifting", description: "Motivational uplifting tone" },
  ];

  const errorSounds = [
    { id: "gentle", name: "Gentle Descend", description: "Soft descending melody" },
    { id: "soft", name: "Soft Alert", description: "Gentle warning tone" },
    { id: "subtle", name: "Subtle", description: "Very subtle notification" },
    { id: "classic", name: "Classic Error", description: "Traditional error sound" },
    { id: "modern", name: "Modern Alert", description: "Contemporary alert" },
    { id: "calm", name: "Calm Warning", description: "Calm but noticeable" },
    { id: "minimal", name: "Minimal", description: "Minimalist tone" },
  ];

  const persistSuccessSound = (soundId, url, name) => {
    setSelectedSuccessSound(soundId);
    localStorage.setItem("selectedSuccessSound", soundId);
    if (soundId === "custom-success") {
      if (url) {
        setCustomSuccessSoundUrl(url);
        localStorage.setItem("customSuccessSoundUrl", url);
      }
      if (name) {
        setCustomSuccessSoundName(name);
        localStorage.setItem("customSuccessSoundName", name);
      }
    }
  };

  const persistErrorSound = (soundId, url, name) => {
    setSelectedErrorSound(soundId);
    localStorage.setItem("selectedErrorSound", soundId);
    if (soundId === "custom-error") {
      if (url) {
        setCustomErrorSoundUrl(url);
        localStorage.setItem("customErrorSoundUrl", url);
      }
      if (name) {
        setCustomErrorSoundName(name);
        localStorage.setItem("customErrorSoundName", name);
      }
    }
  };

  const handleSoundChange = (type, soundId) => {
    if (type === "success") {
      persistSuccessSound(soundId);
    } else {
      persistErrorSound(soundId);
    }
    playSoundPreview(type, soundId);
  };

  const handleCustomToneUpload = (type, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setError("Please select an audio file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Audio file size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      if (type === "success") {
        persistSuccessSound("custom-success", url, file.name);
      } else {
        persistErrorSound("custom-error", url, file.name);
      }
      setSoundSuccess("Custom tone uploaded and selected.");
      setTimeout(() => setSoundSuccess(""), 3000);
    };
    reader.readAsDataURL(file);
  };

  const playSoundPreview = (type, soundId) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    setPlayingSound(`${type}-${soundId}`);

    if (soundId === "custom-success" || soundId === "custom-error") {
      const url = soundId === "custom-success" ? customSuccessSoundUrl : customErrorSoundUrl;
      if (url) {
        const audio = new Audio(url);
        previewAudioRef.current = audio;
        audio.play().catch((err) => console.error("Preview playback failed:", err));
      }
    } else {
      playSound(type, soundId, true);
    }

    setTimeout(() => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPlayingSound(null);
    }, 3000);
  };

  const handleSaveClinicSettings = async () => {
    setClinicSaving(true);
    setClinicError("");
    setClinicSuccess("");
    try {
      await updateClinicSettings(clinicName, clinicAddress, clinicPhone);
      setClinicSuccess("Clinic details updated successfully");
    } catch (err) {
      console.error("Failed to save clinic settings:", err);
      setClinicError("Failed to save clinic details");
    } finally {
      setClinicSaving(false);
    }
  };

  useEffect(() => {
    fetchCurrentSignature();
    fetchAllSignatures();
    fetchClinicSettings();

    // Cleanup object URLs on component unmount
    return () => {
      Object.values(signatureUrls).forEach(url => {
      });
    };
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setError("");

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      await uploadSignature(selectedFile);
      setSuccess("Signature uploaded successfully!");
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Refresh current signature and all signatures
      await fetchCurrentSignature();
      await fetchAllSignatures();
    } catch (err) {
      console.error(err);
      setError("Failed to upload signature. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError("");
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Clinic Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set the clinic name, address, and phone number to use in generated PDFs. Address and phone are used only in the invoice header.
        </Typography>

        <Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: 2,
    p: 2,
    borderRadius: 2,
    backgroundColor: "#f9fafb",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  }}
>
  {/* Clinic Name */}
  <Box sx={{ flex: "1 1 150px", minWidth: 250 }}>
    <TextField
      label="Clinic Name"
      value={clinicName}
      onChange={(e) => setClinicName(e.target.value)}
      fullWidth
      disabled={clinicLoading}
      size="small"
    />
  </Box>

  {/* Clinic Address */}
  <Box sx={{ flex: "1 1 300px", minWidth: 250 }}>
    <TextField
      label="Clinic Address"
      value={clinicAddress}
      onChange={(e) => setClinicAddress(e.target.value)}
      fullWidth
      rows={1}
      disabled={clinicLoading}
      size="small"
    />
  </Box>

  {/* Clinic Phone */}
  <Box sx={{ flex: "1 1 50px", minWidth: 100 }}>
    <TextField
      label="Clinic Phone"
      value={clinicPhone}
      onChange={(e) => setClinicPhone(e.target.value)}
      fullWidth
      disabled={clinicLoading}
      placeholder="e.g. 1234567890"
      size="small"
    />
  </Box>
</Box>

        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleSaveClinicSettings}
            disabled={clinicLoading || clinicSaving}
          >
            {clinicSaving ? "Saving..." : "Save Clinic Details"}
          </Button>
          <Button
            variant="outlined"
            onClick={fetchClinicSettings}
            disabled={clinicLoading || clinicSaving}
          >
            Reload
          </Button>
        </Box>

        {clinicError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {clinicError}
          </Alert>
        )}

        {clinicSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {clinicSuccess}
          </Alert>
        )}
      </Paper>

      <Grid container spacing={1} sx={{ display: "flex", gridTemplateColumns: { xs: "1fr", md: "auto 1fr" }, gap: 1 }}>
        {/* Current Signature */}
        <Box>
          
            <Typography variant="h6" gutterBottom>
              Current Signature
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : currentSignature ? (
              <Card>
                <CardMedia
                  component="img"
                  image={currentSignature}
                  alt="Current signature"
                  sx={{ height: 155, objectFit: "contain" }}
                  onError={(e) => {
                    console.error("Image failed to load:", currentSignature);
                    console.error("Image error:", e);
                  }}
                  onLoad={() => console.log("Image loaded successfully:", currentSignature)}
                />
                <CardContent>
                  <Button
                    startIcon={<Refresh />}
                    onClick={fetchCurrentSignature}
                    size="small"
                  >
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No signature uploaded yet.
              </Typography>
            )}
          
       </Box>

        
      {/* Previously Uploaded Signatures */}
      <Box sx={{ mt: 0.1 }}>
        
        <Typography variant="h6" gutterBottom>
          Previous Signatures
        </Typography>

        {loadingSignatures ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : allSignatures.length > 0 ? (
          <Grid container spacing={2}>
            {allSignatures.map((sig) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={sig.id}>
                <Card
                  sx={{
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    position: "relative",
                    "&:hover": {
                      transform: "scale(1.02)",
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleSelectSignature(sig.id)}
                >
                  {signatureUrls[sig.id] ? (
                    <CardMedia
                      component="img"
                      image={signatureUrls[sig.id]}
                      alt={`Signature ${sig.id}`}
                      sx={{ height: 120, objectFit: "contain", p: 1, bgcolor: "#f5f5f5" }}
                    />
                  ) : (
                    <Box sx={{ height: 120, bgcolor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CircularProgress size={30} />
                    </Box>
                  )}
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => handleSelectSignature(sig.id)}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Select
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        fullWidth
                        startIcon={<Delete />}
                        onClick={(e) => handleDeleteSignature(sig.id, e)}
                        sx={{ textTransform: "none", fontWeight: 500 }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No previously uploaded signatures found. Upload a new one above.
          </Alert>
        )}
        
        </Box>
        {/* Upload New Signature */}
        <Box>
          <Paper sx={{ p: 1.5, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Upload New Signature
            </Typography>
            <Typography variant="body2" gutterBottom>
              Upload a digital signature image that will be used in PDF reports.
              </Typography>
              <Typography variant="body2" gutterBottom>
              Supported formats: JPG, PNG, GIF. Maximum size: 5MB.
            </Typography>

            <Box sx={{ mt: 1 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                style={{ display: "none" }}
              />

              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Choose Image
              </Button>
            </Box>

            {preview && (
              <Card sx={{ mt: 0.1, maxWidth: 150 }}>
                <CardContent>
                  <Typography variant="subtitle1" mb={- 2.5} mt={- 1.5} gutterBottom>
                    Preview
                  </Typography>
                </CardContent>
                <CardMedia
                  component="img"
                  image={preview}
                  alt="Signature preview"
                  sx={{ height: 100, objectFit: "contain" }}
                />
              </Card>
            )}

            {selectedFile && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 1 }}>
                {success}
              </Alert>
            )}

            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <Image />}
              >
                {uploading ? "Uploading..." : "Upload Signature"}
              </Button>

              {selectedFile && (
                <Button variant="outlined" onClick={handleCancel} disabled={uploading}>
                  Cancel
                </Button>
              )}
            </Box>
          </Paper>
        </Box>   
       </Grid>

      {/* Sound Selection */}

        <Paper sx={{ p: 3, mt: 4, background: "rgba(255,255,255,0.92)", boxShadow: "0 14px 40px rgba(15,23,42,0.08)", borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sound Selection
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pick the sounds you want for success and error feedback across the app. Preview each tone before saving.
        </Typography>

        {soundSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {soundSuccess}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, background: "linear-gradient(135deg, rgba(20, 179, 28, 0.43) 0%, rgba(91, 204, 109, 0.42) 100%)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} color="success.main">
                Success Sounds
              </Typography>
              <FormControl component="fieldset" sx={{ width: "100%" }}>
                <FormLabel component="legend" sx={{ mb: 2, color: "text.secondary" }}>
                  Select a pleasant confirmation tone.
                </FormLabel>
                <RadioGroup
                  value={selectedSuccessSound}
                  onChange={(e) => handleSoundChange("success", e.target.value)}
                >
                  {successSounds.map((sound) => (
                    <Box key={sound.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <FormControlLabel
                        value={sound.id}
                        control={<Radio color="success" />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {sound.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {sound.description}
                            </Typography>
                          </Box>
                        }
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  ))}
                  {customSuccessSoundUrl && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <FormControlLabel
                        value="custom-success"
                        control={<Radio color="success" />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              Custom Tone{customSuccessSoundName ? ` — ${customSuccessSoundName}` : ""}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Uploaded local audio file
                            </Typography>
                          </Box>
                        }
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  )}
                </RadioGroup>
                <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                  <Button variant="outlined" component="label" size="small">
                    Upload Custom Success Tone
                    <input
                      hidden
                      accept="audio/*"
                      type="file"
                      onChange={(e) => handleCustomToneUpload("success", e)}
                    />
                  </Button>
                  
                </Box>
              </FormControl>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, background: "linear-gradient(135deg, rgba(244, 67, 54, 0.38) 0%, rgba(179, 34, 34, 0.31) 100%)", border: "1px solid rgba(244,67,54,0.2)", borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} color="error.main">
                Error Sounds
              </Typography>
              <FormControl component="fieldset" sx={{ width: "100%" }}>
                <FormLabel component="legend" sx={{ mb: 2, color: "text.secondary" }}>
                  Select a calm alert tone for errors.
                </FormLabel>
                <RadioGroup
                  value={selectedErrorSound}
                  onChange={(e) => handleSoundChange("error", e.target.value)}
                >
                  {errorSounds.map((sound) => (
                    <Box key={sound.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <FormControlLabel
                        value={sound.id}
                        control={<Radio color="error" />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {sound.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {sound.description}
                            </Typography>
                          </Box>
                        }
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  ))}
                  {customErrorSoundUrl && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <FormControlLabel
                        value="custom-error"
                        control={<Radio color="error" />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              Custom Tone{customErrorSoundName ? ` — ${customErrorSoundName}` : ""}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Uploaded local audio file
                            </Typography>
                          </Box>
                        }
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  )}
                </RadioGroup>
                <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                  <Button variant="outlined" component="label" size="small">
                    Upload Custom Error Tone
                    <input
                      hidden
                      accept="audio/*"
                      type="file"
                      onChange={(e) => handleCustomToneUpload("error", e)}
                    />
                  </Button>
                </Box>
              </FormControl>
            </Paper>
          </Grid>
        </Grid>

      </Paper>
    </Box>
  );
};

export default UploadSignature;