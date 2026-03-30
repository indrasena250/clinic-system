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
  useTheme,
  useMediaQuery
} from "@mui/material";
import { CloudUpload, Image, Refresh, Delete } from "@mui/icons-material";
import API from "../../api/axios";
import { uploadSignature, getAllSignatures, deleteSignature } from "../../api/settingsApi";

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
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    fetchCurrentSignature();
    fetchAllSignatures();

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
        Upload Digital Signature
      </Typography>

      <Grid container spacing={3} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "auto 1fr" }, gap: 3 }}>
        {/* Current Signature */}
        <Box>
          <Paper sx={{ p: 3, height: "100%" }}>
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
                  sx={{ height: 150, objectFit: "contain" }}
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
          </Paper>
        </Box>

        {/* Upload New Signature */}
        <Box>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Upload New Signature
            </Typography>
            <Typography variant="body2" gutterBottom>
              Upload a digital signature image that will be used in PDF reports.
              Supported formats: JPG, PNG, GIF. Maximum size: 5MB.
            </Typography>

            <Box sx={{ mt: 3 }}>
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
              <Card sx={{ mt: 3, maxWidth: 300 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Preview
                  </Typography>
                </CardContent>
                <CardMedia
                  component="img"
                  image={preview}
                  alt="Signature preview"
                  sx={{ height: 150, objectFit: "contain" }}
                />
              </Card>
            )}

            {selectedFile && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}

            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
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

      {/* Previously Uploaded Signatures */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          Previously Uploaded Signatures
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
    </Box>
  );
};

export default UploadSignature;