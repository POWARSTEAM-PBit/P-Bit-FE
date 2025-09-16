import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, Paper} from '@mui/material';
import { AddLink } from '@mui/icons-material';
import client from '../../api/client';
import styles from './CreateClassroom.module.css'; // Reuse same styles
import { useLocation } from 'react-router-dom';

export default function LinkDevice() {
  
  const [formData, setFormData] = useState({mac_addr: '', device_name: ''});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    /**
     * Add MAC address validation
     */

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const location = useLocation();
  const classIdFromState = location.state?.class_id ?? null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        class_id: classIdFromState
      };

      const resp = await client.post('/device/add/class', payload);

      if (resp?.data?.success) {
        setSuccessMessage('Device linked successfully!');
        setFormData({ mac_addr: '', device_name: '' });

        if (classIdFromState) {
          navigate(`/classroom/${classIdFromState}`);
        } else {
          navigate('/dashboard');
        }
      }
      else 
      {
        setApiError(resp?.data?.message || 'Failed to link device.');
      }
    } catch (e) {
      setApiError(e?.response?.data?.message || e.message || 'An error occurred.');
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
                helperText={errors.mac_addr}
                className={styles.textField}
                placeholder="e.g., AB:CD:EF:12:34:56"
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
                {loading ? 'Linking Device...' : 'Link Device'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
}