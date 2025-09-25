import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { 
  ArrowBack, 
  Devices, 
  BatteryChargingFull,
  BatteryCharging50,
  BatteryAlert,
  Wifi,
  WifiOff,
  AccessTime
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { useClassroom } from '../contexts/ClassroomContext';
import { useDevice } from '../contexts/DeviceContext';
import client from '../api/client';
import styles from './DeviceViewPage.module.css';

// Import device view components (to be created)
import DeviceHeader from '../components/Device/DeviceHeader';
import DeviceLiveSection from '../components/Device/DeviceLiveSection';
import DeviceGraphingSection from '../components/Device/DeviceGraphingSection';
import DeviceDevSection from '../components/Device/DeviceDevSection';

const DeviceViewPage = () => {
  const { deviceId, classroomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isLoggedIn, user } = useAuth();
  const { classrooms, getAnonymousSession } = useClassroom();
  const { devices } = useDevice();

  const [device, setDevice] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deviceData, setDeviceData] = useState(null);

  // Determine if we came from a classroom or directly
  const fromClassroom = classroomId && location.state?.fromClassroom;
  const deviceNickname = fromClassroom && classroom?.device_assignments ? 
    (classroom.device_assignments.find(da => da.device_id === deviceId)?.device?.nickname || device?.nickname) :
    device?.nickname;

  // Fetch device information
  const fetchDevice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let deviceResponse;
      
      // Debug logging
      console.log('DeviceViewPage - fetchDevice:', {
        isLoggedIn,
        deviceId,
        classroomId,
        anonymousSession: getAnonymousSession()
      });
      
      // Use appropriate endpoint based on authentication status
      if (isLoggedIn) {
        // Authenticated user - use regular endpoint
        console.log('Using authenticated endpoint');
        deviceResponse = await client.get(`/device/${deviceId}`);
      } else {
        // Check for anonymous session
        const anonymousSession = getAnonymousSession();
        console.log('Anonymous session check:', { anonymousSession, classroomId });
        
        if (anonymousSession && classroomId) {
          // Anonymous user - use anonymous endpoint
          console.log('Using anonymous endpoint with params:', {
            class_id: classroomId,
            first_name: anonymousSession.first_name,
            pin_code: anonymousSession.pin_code
          });
          
          deviceResponse = await client.get(`/device/${deviceId}/anonymous`, {
            params: {
              class_id: classroomId,
              first_name: anonymousSession.first_name,
              pin_code: anonymousSession.pin_code
            }
          });
        } else {
          console.log('No anonymous session or classroomId, throwing error');
          throw new Error('Authentication required. Please log in to view device details.');
        }
      }

      if (deviceResponse.data.success) {
        setDevice(deviceResponse.data.data);
      } else {
        throw new Error(deviceResponse.data.message || 'Failed to fetch device');
      }

      // If we have a classroomId, get device assignment details for classroom-specific nickname
      if (classroomId) {
        try {
          let assignmentResponse;
          
          if (isLoggedIn) {
            // Authenticated user
            assignmentResponse = await client.get(`/device/classroom/${classroomId}/devices`);
          } else {
            // Anonymous user - we already have the device info from the anonymous endpoint
            // No need to fetch assignment details separately
            return;
          }
          
          if (assignmentResponse && assignmentResponse.data.success) {
            // Find the assignment for this device
            const deviceAssignment = assignmentResponse.data.data.find(
              assignment => assignment.device_id === deviceId
            );
            if (deviceAssignment) {
              setClassroom({
                id: classroomId,
                device_assignments: [deviceAssignment]
              });
            }
          }
        } catch (assignmentErr) {
          console.warn('Could not fetch device assignment details:', assignmentErr);
          // This is not critical, we can still show the device with its default nickname
        }
      }

    } catch (err) {
      console.error('Error fetching device:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in to view device details.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view this device.');
      } else if (err.response?.status === 404) {
        setError('Device not found.');
      } else {
        setError(err.response?.data?.message || 'Failed to load device information');
      }
    } finally {
      setLoading(false);
    }
  }, [deviceId, classroomId, isLoggedIn, getAnonymousSession]);

  // Fetch latest device data
  const fetchLatestData = useCallback(async () => {
    try {
      let response;
      
      // Use appropriate endpoint based on authentication status
      if (isLoggedIn) {
        // Authenticated user - use regular endpoint
        response = await client.get(`/device/${deviceId}/data/latest`);
      } else {
        // Check for anonymous session
        const anonymousSession = getAnonymousSession();
        if (anonymousSession && classroomId) {
          // Anonymous user - use anonymous endpoint
          response = await client.get(`/device/${deviceId}/data/latest/anonymous`, {
            params: {
              class_id: classroomId,
              first_name: anonymousSession.first_name,
              pin_code: anonymousSession.pin_code
            }
          });
        } else {
          // No authentication available
          return;
        }
      }
      
      if (response.data.success) {
        setDeviceData(response.data.data.data);
      }
    } catch (err) {
      console.error('Error fetching latest device data:', err);
      // Don't set error state for device data as it's not critical for the page to load
      // The device view can still show device info without sensor data
    }
  }, [deviceId, isLoggedIn, getAnonymousSession, classroomId]);

  // Initial data fetch
  useEffect(() => {
    fetchDevice();
  }, [fetchDevice]);

  // Fetch latest data on mount and set up polling
  useEffect(() => {
    fetchLatestData();
    
    // Poll for latest data every 30 seconds
    const interval = setInterval(fetchLatestData, 30000);
    return () => clearInterval(interval);
  }, [fetchLatestData]);

  const handleBack = () => {
    if (fromClassroom) {
      navigate(`/classroom/${classroomId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const getBatteryIcon = (batteryLevel) => {
    if (batteryLevel >= 80) return <BatteryChargingFull color="success" />;
    if (batteryLevel >= 30) return <BatteryCharging50 color="warning" />;
    return <BatteryAlert color="error" />;
  };

  const getOnlineStatus = (lastSeen) => {
    if (!lastSeen) return { online: false, text: 'Never seen', icon: <WifiOff color="error" /> };
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = (now - lastSeenDate) / (1000 * 60);
    
    if (diffMinutes <= 1) {
      return { online: true, text: 'Online', icon: <Wifi color="success" /> };
    } else if (diffMinutes <= 60) {
      return { online: false, text: `${Math.round(diffMinutes)}m ago`, icon: <WifiOff color="warning" /> };
    } else {
      return { online: false, text: `${Math.round(diffMinutes / 60)}h ago`, icon: <WifiOff color="error" /> };
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading device information...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleBack} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!device) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Device not found
        </Alert>
        <Button variant="contained" onClick={handleBack} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Container>
    );
  }

  const onlineStatus = getOnlineStatus(device.last_seen);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); handleBack(); }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBack sx={{ mr: 0.5 }} fontSize="inherit" />
          {fromClassroom ? 'Classroom' : 'Dashboard'}
        </Link>
        <Typography color="text.primary">
          {deviceNickname || device.nickname}
        </Typography>
      </Breadcrumbs>

      {/* Device Header */}
      <DeviceHeader 
        device={device}
        deviceNickname={deviceNickname}
        onlineStatus={onlineStatus}
        batteryLevel={device.battery_level}
        getBatteryIcon={getBatteryIcon}
      />

      <Divider sx={{ my: 3 }} />

      {/* Live Section */}
      <DeviceLiveSection 
        device={device}
        deviceData={deviceData}
        onRefresh={fetchLatestData}
      />

      <Divider sx={{ my: 3 }} />

      {/* Graphing Section */}
      <DeviceGraphingSection 
        deviceId={deviceId}
        classroomId={classroomId}
      />

      {/* Dev Section - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <Divider sx={{ my: 3 }} />
          <DeviceDevSection 
            deviceId={deviceId}
            classroomId={classroomId}
            onDataAdded={fetchLatestData}
          />
        </>
      )}
    </Container>
  );
};

export default DeviceViewPage;
