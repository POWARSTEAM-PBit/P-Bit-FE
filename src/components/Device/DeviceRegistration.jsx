import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Wifi as WifiIcon,
  Battery20 as BatteryLowIcon,
  Battery50 as BatteryMediumIcon,
  Battery90 as BatteryHighIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { useDevice } from '../../contexts/DeviceContext';
import { useAuth } from '../../contexts/AuthContext';

const DeviceRegistration = () => {
  const { user } = useAuth();
  const { 
    devices, 
    loading, 
    error, 
    registerDevice, 
    getUserDevices, 
    deleteDevice, 
    clearError 
  } = useDevice();

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [macAddress, setMacAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (user) {
      getUserDevices();
    }
  }, [user, getUserDevices]);

  const validateForm = () => {
    const errors = {};
    
    // MAC address validation (basic format check)
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macAddress.trim()) {
      errors.macAddress = 'MAC address is required';
    } else if (!macRegex.test(macAddress.trim())) {
      errors.macAddress = 'Please enter a valid MAC address (e.g., AA:BB:CC:DD:EE:FF)';
    }

    // Nickname validation
    if (!nickname.trim()) {
      errors.nickname = 'Nickname is required';
    } else if (nickname.trim().length < 2) {
      errors.nickname = 'Nickname must be at least 2 characters';
    } else if (nickname.trim().length > 20) {
      errors.nickname = 'Nickname must be less than 20 characters';
    }

    // Check for duplicate nickname
    const existingNickname = devices.find(device => 
      device.nickname.toLowerCase() === nickname.trim().toLowerCase()
    );
    if (existingNickname) {
      errors.nickname = 'You already have a device with this nickname';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await registerDevice(macAddress.trim(), nickname.trim());
    
    if (result.success) {
      setShowRegisterDialog(false);
      setMacAddress('');
      setNickname('');
      setValidationErrors({});
    }
  };

  const handleDelete = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      await deleteDevice(deviceId);
    }
  };

  const getBatteryIcon = (batteryLevel) => {
    if (batteryLevel >= 80) return <BatteryHighIcon color="success" />;
    if (batteryLevel >= 30) return <BatteryMediumIcon color="warning" />;
    return <BatteryLowIcon color="error" />;
  };

  const getStatusIcon = (isActive) => {
    return isActive ? 
      <ActiveIcon color="success" /> : 
      <InactiveIcon color="error" />;
  };

  const formatMacAddress = (mac) => {
    return mac.toUpperCase().replace(/:/g, ':');
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            📱 P-Bit Device Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowRegisterDialog(true)}
            disabled={loading}
          >
            Register New Device
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Register and manage your P-Bit devices. Each device needs a unique nickname and MAC address.
        </Typography>

        {devices.length === 0 ? (
          <Box textAlign="center" py={4}>
            <WifiIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No devices registered yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Register your first P-Bit device to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowRegisterDialog(true)}
            >
              Register Your First Device
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {devices.map((device) => (
              <Grid item xs={12} sm={6} md={4} key={device.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h3">
                        {device.nickname}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Tooltip title={device.is_active ? 'Active' : 'Inactive'}>
                          {getStatusIcon(device.is_active)}
                        </Tooltip>
                        <Tooltip title={`Battery: ${device.battery_level}%`}>
                          {getBatteryIcon(device.battery_level)}
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      MAC: {formatMacAddress(device.mac_address)}
                    </Typography>
                    
                    <Box display="flex" gap={1} mt={2}>
                      <Chip 
                        label={device.is_active ? 'Active' : 'Inactive'} 
                        color={device.is_active ? 'success' : 'error'}
                        size="small"
                      />
                      <Chip 
                        label={`${device.battery_level}%`} 
                        color={device.battery_level > 30 ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>

                    {device.classrooms && device.classrooms.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="caption" color="text.secondary">
                          Assigned to {device.classrooms.length} classroom(s)
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => handleDelete(device.id)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Register Device Dialog */}
      <Dialog 
        open={showRegisterDialog} 
        onClose={() => setShowRegisterDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Register New P-Bit Device</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="MAC Address"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              placeholder="AA:BB:CC:DD:EE:FF"
              error={!!validationErrors.macAddress}
              helperText={validationErrors.macAddress || 'Enter the MAC address of your P-Bit device'}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Device Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="My P-Bit"
              error={!!validationErrors.nickname}
              helperText={validationErrors.nickname || 'Choose a unique nickname for this device'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRegisterDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRegister} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Device'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceRegistration;
