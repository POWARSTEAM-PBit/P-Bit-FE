import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Wifi as WifiIcon,
  Battery20 as BatteryLowIcon,
  Battery50 as BatteryMediumIcon,
  Battery90 as BatteryHighIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { useDevice } from '../contexts/DeviceContext';
import IoTDataVisualization from '../components/IoT/IoTDataVisualization';

const DirectPBitPage = () => {
  const { macAddress } = useParams();
  const navigate = useNavigate();
  const { getDeviceByMacAddress, getDeviceData, loading, error, clearError } = useDevice();
  
  const [device, setDevice] = useState(null);
  const [deviceData, setDeviceData] = useState(null);
  const [manualMacAddress, setManualMacAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (macAddress) {
      loadDevice(macAddress);
    } else {
      setShowManualInput(true);
    }
  }, [macAddress]);

  const loadDevice = async (mac) => {
    const result = await getDeviceByMacAddress(mac);
    if (result.success) {
      setDevice(result.data);
      loadDeviceData(result.data.id);
    }
  };

  const loadDeviceData = async (deviceId) => {
    const result = await getDeviceData(deviceId);
    if (result.success) {
      setDeviceData(result.data);
    }
  };

  const handleManualSubmit = () => {
    if (manualMacAddress.trim()) {
      navigate(`/pbit/${manualMacAddress.trim()}`);
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

  if (showManualInput) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <WifiIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Direct P-Bit Access
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your P-Bit's MAC address to view its sensor data
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="MAC Address"
              value={manualMacAddress}
              onChange={(e) => setManualMacAddress(e.target.value)}
              placeholder="AA:BB:CC:DD:EE:FF"
              helperText="Enter the MAC address of your P-Bit device"
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleManualSubmit}
              disabled={loading || !manualMacAddress.trim()}
            >
              {loading ? <CircularProgress size={24} /> : 'View P-Bit Data'}
            </Button>
          </Box>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Don't have a P-Bit?{' '}
              <Button 
                variant="text" 
                onClick={() => navigate('/')}
                sx={{ textTransform: 'none' }}
              >
                Learn more about our platform
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (loading && !device) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !device) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/pbit')}
            fullWidth
          >
            Try Different MAC Address
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!device) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 2 }}>
      {/* Device Info Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            📱 {device.nickname || 'P-Bit Device'}
          </Typography>
          <Box display="flex" gap={2}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/pbit')}
            >
              Change Device
            </Button>
          </Box>
        </Box>

        <Box display="flex" gap={3} alignItems="center" mb={2}>
          <Typography variant="body1" color="text.secondary">
            MAC: {formatMacAddress(device.mac_address)}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title={device.is_active ? 'Active' : 'Inactive'}>
              {getStatusIcon(device.is_active)}
            </Tooltip>
            <Typography variant="body2">
              {device.is_active ? 'Active' : 'Inactive'}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title={`Battery: ${device.battery_level}%`}>
              {getBatteryIcon(device.battery_level)}
            </Tooltip>
            <Typography variant="body2">
              {device.battery_level}%
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Chip 
            label={device.is_active ? 'Active' : 'Inactive'} 
            color={device.is_active ? 'success' : 'error'}
            size="small"
          />
          <Chip 
            label={`${device.battery_level}% Battery`} 
            color={device.battery_level > 30 ? 'success' : 'error'}
            size="small"
          />
          <Chip 
            label="Direct Access" 
            color="info"
            size="small"
          />
        </Box>
      </Paper>

      {/* Data Visualization */}
      {deviceData ? (
        <IoTDataVisualization deviceData={deviceData} />
      ) : (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No data available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This device hasn't uploaded any sensor data yet.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DirectPBitPage;
