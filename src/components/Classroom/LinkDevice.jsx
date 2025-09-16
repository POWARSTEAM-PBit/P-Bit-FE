import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import { AddLink } from "@mui/icons-material";
import client from "../../api/client";
import styles from "./CreateClassroom.module.css";

/**
 * @returns JSX.Element
 */
export default function LinkDevice() {
  const [formData, setFormData] = useState({ mac_addr: "", device_name: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const classIdFromState = location.state?.class_id ?? null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateMacAddress = (macAddr) => {
    if (!macAddr || !macAddr.trim()) {
      return "MAC address is required";
    }

    // Remove all colons, semicolons, hyphens, and spaces
    const cleanMac = macAddr.replace(/[:\-\s;]/g, "");

    // Check if it's exactly 12 hexadecimal characters
    if (cleanMac.length !== 12) {
      return "MAC address must be exactly 12 characters (excluding separators)";
    }

    // Check if all characters are valid hexadecimal
    const hexPattern = /^[0-9A-Fa-f]{12}$/;
    if (!hexPattern.test(cleanMac)) {
      return "MAC address must contain only hexadecimal characters (0-9, A-F)";
    }

    return null; // Valid
  };

  const validateForm = () => {
    const newErrors = {};
    const macError = validateMacAddress(formData.mac_addr);
    if (macError) {
      newErrors.mac_addr = macError;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        class_id: classIdFromState,
      };

      const resp = await client.post("/device/add/class", payload);

      if (resp?.data?.success) {
        setSuccessMessage("Device linked successfully!");
        setFormData({ mac_addr: "", device_name: "" });
        navigate(classIdFromState ? `/classroom/${classIdFromState}` : "/dashboard");
      } else {
        setApiError(resp?.data?.message || "Failed to link device.");
      }
    } catch (e) {
      if (e?.response?.status === 422) {
        setApiError("The provided MAC address is invalid or the device cannot be linked to this classroom. Please verify the MAC address and try again.");
      } else {
        setApiError(e?.response?.data?.message || e.message || "An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles.container}>
      <Paper elevation={3} className={styles.paper}>
        <Card className={styles.card}>
          <CardContent className={styles.cardContent}>
            <Box className={styles.header}>
              <AddLink className={styles.icon} />
              <Typography variant="h4" component="h1" className={styles.title}>
                Link a New Device
              </Typography>
            </Box>

            {apiError && (
              <Alert severity="error" className={styles.alert}>
                {apiError}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" className={styles.alert}>
                {successMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <TextField
                fullWidth
                label="MAC Address"
                name="mac_addr"
                value={formData.mac_addr}
                onChange={handleInputChange}
                error={!!errors.mac_addr}
                helperText={
                  errors.mac_addr ||
                  "Enter 12 hex characters with or without separators (e.g., AB:CD:EF:12:34:56 or ABCDEF123456)"
                }
                className={styles.textField}
                placeholder="e.g., AB:CD:EF:12:34:56 or ABCDEF123456"
                required
              />

              <TextField
                fullWidth
                label="Device Name (Optional)"
                name="device_name"
                value={formData.device_name}
                onChange={handleInputChange}
                className={styles.textField}
                placeholder="e.g., Raspberry Pi 4"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                className={styles.submitButton}
                startIcon={loading ? <CircularProgress size={20} /> : <AddLink />}
              >
                {loading ? "Linking Device..." : "Link Device"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
}