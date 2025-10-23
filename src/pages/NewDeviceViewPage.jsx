import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { isConnected, subscribe, startRecordingAfterDeviceAdded } from '../ble';
import { useAuth } from '../contexts/AuthContext';
import { useClassroom } from '../contexts/ClassroomContext';
import LiveDataGraph from '../components/Device/LiveDataGraph';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Bluetooth as BluetoothIcon,
  BluetoothConnected as BluetoothConnectedIcon,
  Battery20 as BatteryLowIcon,
  Battery50 as BatteryMediumIcon,
  Battery90 as BatteryHighIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import client from '../api/client';
import DeviceLiveSection from '../components/Device/DeviceLiveSection';
import DeviceGraphingSection from '../components/Device/DeviceGraphingSection';

// Import BLE functionality
import {
  connectBLEFiltered, connectBLECompatible, stop as stopBLE,
  isConnected as isBLEConnected
} from '../ble';

const NewDeviceViewPage = () => {
  const { classroomId, deviceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getAnonymousSession } = useClassroom();

  // State
  const [device, setDevice] = useState(null);
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Default to historical data (1) if not connected, live data (0) if connected
    return isConnected() ? 0 : 1;
  });

  // BLE state
  const [bleConnected, setBleConnected] = useState(isConnected());
  const [bleName, setBleName] = useState(sessionStorage.getItem('pbit.deviceName') || 'P-BIT');
  const [bleReading, setBleReading] = useState({ temp: null, hum: null, ldr: null, mic: null, batt: null });

  // Get device info from location state
  const { fromClassroom, deviceName, isConnected: isCurrentlyConnected } = location.state || {};

  // Monitor BLE connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = isConnected();
      setBleConnected(connected);
      
      // Clear recording flag if disconnected
      if (!connected) {
        sessionStorage.removeItem('pbit.recordingStarted');
      }
      
      // If BLE is connected and we have a device in the classroom, start recording
      if (connected && device && !sessionStorage.getItem('pbit.recordingStarted')) {
        startRecordingAfterDeviceAdded();
        sessionStorage.setItem('pbit.recordingStarted', 'true');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [device]);

  // Auto-switch tabs based on BLE connection status
  useEffect(() => {
    if (bleConnected) {
      // When connected, default to live data tab (0)
      setActiveTab(0);
    } else {
      // When not connected, default to historical data tab (1)
      setActiveTab(1);
    }
  }, [bleConnected]);

  // BLE connection monitoring and data subscription
  useEffect(() => {
    const off = subscribe((r) => {
      setBleReading({
        temp: r.temp ?? r.air_temp ?? r.soil_temp ?? null,
        hum:  r.hum  ?? r.air_hum  ?? r.soil_hum  ?? null,
        ldr:  r.ldr ?? null,
        mic:  r.mic ?? null,
        batt: r.batt ?? null,
      });
      setBleConnected(true);
    });
    const t = setInterval(() => setBleConnected(isBLEConnected()), 1000);
    return () => { off && off(); clearInterval(t); };
  }, []);

  // Load device data
  useEffect(() => {
    if (deviceId && deviceId !== 'live') {
      loadDeviceInfo();
      loadDeviceData();
    } else if (deviceName) {
      // For live view, create a mock device object
      setDevice({
        id: 'live',
        device_name: deviceName,
        is_active: true,
        battery_level: bleReading.batt ?? 0,
        last_seen: new Date().toISOString(),
        assignment: { type: 'public' }
      });
      setLoading(false);
    }
  }, [deviceId, deviceName]);

  const loadDeviceInfo = async () => {
    try {
      let response;
      
      // Check if user is authenticated
      const isLoggedIn = !!user;
      
      if (isLoggedIn) {
        // Authenticated user - use regular endpoint
        response = await client.get(`/classroom-device/${deviceId}`);
      } else {
        // Check for anonymous session
        const anonymousSession = getAnonymousSession();
        if (anonymousSession && classroomId) {
          // Anonymous user - use anonymous endpoint
          response = await client.get(`/classroom-device/${deviceId}/anonymous`, {
            params: {
              class_id: classroomId,
              first_name: anonymousSession.first_name,
              pin_code: anonymousSession.pin_code
            }
          });
        } else {
          throw new Error('Authentication required. Please log in to view device information.');
        }
      }
      
      if (response.data.success) {
        setDevice(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load device info:', err);
      // Don't set error here as it's not critical for the main functionality
    }
  };

  const loadDeviceData = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      // Check if user is authenticated
      const isLoggedIn = !!user;
      
      if (isLoggedIn) {
        // Authenticated user - use regular endpoint
        response = await client.get(`/classroom-device/${deviceId}/data/latest`);
      } else {
        // Check for anonymous session
        const anonymousSession = getAnonymousSession();
        if (anonymousSession && classroomId) {
          // Anonymous user - use anonymous endpoint
          response = await client.get(`/classroom-device/${deviceId}/data/latest/anonymous`, {
            params: {
              class_id: classroomId,
              first_name: anonymousSession.first_name,
              pin_code: anonymousSession.pin_code
            }
          });
        } else {
          throw new Error('Authentication required. Please log in to view device data.');
        }
      }
      
      if (response.data.success) {
        setDeviceData(response.data.data);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch device data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // BLE connection methods
  const connectRecommended = async () => {
    try { 
      const n = await connectBLEFiltered(); 
      setBleName(n || 'P-BIT'); 
      setBleConnected(isBLEConnected()); 
    }
    catch (e) { 
      console.error(e); 
      setBleConnected(false); 
    }
  };

  const connectCompatible = async () => {
    try { 
      const n = await connectBLECompatible(); 
      setBleName(n || 'P-BIT'); 
      setBleConnected(isBLEConnected()); 
    }
    catch (e) { 
      console.error(e); 
      setBleConnected(false); 
    }
  };

  const disconnectBLE = () => {
    try {
      stopBLE(); 
    } finally { 
      setBleConnected(false); 
    } 
  };

  const handleRefresh = () => {
    if (deviceId && deviceId !== 'live') {
      loadDeviceData();
    }
  };

  const handleBack = () => {
    if (fromClassroom) {
      navigate(`/classroom/${classroomId}`);
    } else {
      navigate(-1);
    }
  };

  // Helper functions
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

  const isLiveView = deviceId === 'live' || (bleConnected && deviceName && bleName === deviceName);
  const isTeacher = user?.user_type === 'teacher';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {device?.device_name || deviceName || 'Device'}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
              <Tooltip title={isLiveView ? 'Live Data Available' : 'Historical Data Only'}>
                {isLiveView ? 
                  <BluetoothConnectedIcon color="success" /> : 
                  <BluetoothIcon color="disabled" />
                }
              </Tooltip>
              <Chip
                size="small"
                label={isLiveView ? 'Live Data' : 'Historical Data'}
                color={isLiveView ? 'success' : 'default'}
                variant={isLiveView ? 'filled' : 'outlined'}
              />
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {device && (
              <>
                <Tooltip title={`Battery: ${device.battery_level}%`}>
                  {getBatteryIcon(device.battery_level)}
                </Tooltip>
                <Tooltip title={device.is_active ? 'Active' : 'Inactive'}>
                  {getStatusIcon(device.is_active)}
                </Tooltip>
              </>
            )}
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* BLE Connection Panel (only show if not connected) */}
      {!bleConnected && (
        <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <BluetoothIcon color="disabled" />
              <Typography variant="subtitle1">Connect to view live data</Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button variant="contained" startIcon={<BluetoothIcon />} onClick={connectRecommended}>
                Connect (P-BIT)
              </Button>
              <Button variant="outlined" onClick={connectCompatible}>Compatible</Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Recording Status Panel (show if connected but not recording) */}
      {bleConnected && !sessionStorage.getItem('pbit.recordingStarted') && (
        <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'warning.light' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1" color="warning.contrastText">
                Data recording is not active
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="warning" 
              onClick={() => {
                startRecordingAfterDeviceAdded();
                sessionStorage.setItem('pbit.recordingStarted', 'true');
              }}
            >
              Start Recording
            </Button>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Live Data" disabled={!isLiveView} />
          <Tab label="Historical Data" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && isLiveView && (
        <DeviceLiveSection 
          device={device}
          deviceData={deviceData}
          onRefresh={handleRefresh}
          activeTab={activeTab}
          bleConnected={bleConnected}
        />
      )}

      {activeTab === 1 && (
        <DeviceGraphingSection 
          deviceId={deviceId}
          classroomId={classroomId}
          activeTab={activeTab}
        />
      )}

      {/* Connection Status */}
      {bleConnected && (
        <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <BluetoothConnectedIcon />
            <Typography variant="body2">
              Connected to {bleName} - Live data streaming
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Live Data Graph */}
      {bleConnected && (
        <Box sx={{ mt: 2 }}>
          <LiveDataGraph 
            bleReading={bleReading} 
            isConnected={bleConnected} 
          />
        </Box>
      )}
    </Box>
  );
};

export default NewDeviceViewPage;
