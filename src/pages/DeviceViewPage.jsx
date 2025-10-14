// src/pages/DeviceViewPage.jsx
// Device detail page with dual mode:
// 1) Backend mode (default): fetch device info + latest data, render as before.
// 2) Live-only BLE mode: if navigated with { liveOnly: true } OR deviceId starts with "ble:",
//    skip all backend calls and render BLE-powered components directly.

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
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  BatteryChargingFull,
  BatteryCharging50,
  BatteryAlert,
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { useClassroom } from '../contexts/ClassroomContext';
import { useDevice } from '../contexts/DeviceContext';
import client from '../api/client';
import styles from './DeviceViewPage.module.css';

// BLE-first device view components (no props required)
import DeviceHeader from '../components/Device/DeviceHeader';
import DeviceLiveSection from '../components/Device/DeviceLiveSection';
import DeviceGraphingSection from '../components/Device/DeviceGraphingSection';
import DeviceDevSection from '../components/Device/DeviceDevSection';

const DeviceViewPage = () => {
  const { deviceId, classroomId } = useParams(); // route likely: /classroom/:classroomId/device/:deviceId
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoggedIn } = useAuth();
  const { getAnonymousSession } = useClassroom();
  const { devices } = useDevice();

  // --- Live-only (BLE) mode detection ---
  // When coming from the session device card or when deviceId starts with "ble:", we do NOT call backend.
  const liveOnly = Boolean(location.state?.liveOnly) || String(deviceId || '').startsWith('ble:');
  const titleOverride = liveOnly ? (location.state?.name || 'P-BIT (BLE)') : undefined;
  const fromClassroom = Boolean(classroomId && location.state?.fromClassroom);

  // --- Backend-driven states (used only when not in liveOnly mode) ---
  const [device, setDevice] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(!liveOnly); // if liveOnly, we don't load from backend
  const [error, setError] = useState(null);
  const [deviceData, setDeviceData] = useState(null);

  // Compute nickname shown in breadcrumbs (backend mode only)
  const deviceNickname =
    fromClassroom && classroom?.device_assignments
      ? (classroom.device_assignments.find((da) => da.device_id === deviceId)?.device?.nickname ||
          device?.nickname)
      : device?.nickname;

  // --- Backend: fetch device info (skipped in liveOnly) ---
  const fetchDevice = useCallback(async () => {
    if (liveOnly) return; // do nothing in BLE mode

    try {
      setLoading(true);
      setError(null);

      let deviceResponse;

      if (isLoggedIn) {
        // Authenticated user
        deviceResponse = await client.get(`/device/${deviceId}`);
      } else {
        // Anonymous (student) viewer
        const anonymousSession = getAnonymousSession();
        if (anonymousSession && classroomId) {
          deviceResponse = await client.get(`/device/${deviceId}/anonymous`, {
            params: {
              class_id: classroomId,
              first_name: anonymousSession.first_name,
              pin_code: anonymousSession.pin_code,
            },
          });
        } else {
          throw new Error('Authentication required. Please log in to view device details.');
        }
      }

      if (deviceResponse.data?.success) {
        setDevice(deviceResponse.data.data);
      } else {
        throw new Error(deviceResponse.data?.message || 'Failed to fetch device');
      }

      // Optional: classroom assignment (only for authenticated)
      if (classroomId && isLoggedIn) {
        try {
          const assignmentResponse = await client.get(`/device/classroom/${classroomId}/devices`);
          if (assignmentResponse?.data?.success) {
            const deviceAssignment = assignmentResponse.data.data.find(
              (assignment) => assignment.device_id === deviceId
            );
            if (deviceAssignment) {
              setClassroom({
                id: classroomId,
                device_assignments: [deviceAssignment],
              });
            }
          }
        } catch (assignmentErr) {
          console.warn('Could not fetch device assignment details:', assignmentErr);
        }
      }
    } catch (err) {
      console.error('Error fetching device:', err);
      if (err.response?.status === 401) setError('Authentication required. Please log in to view device details.');
      else if (err.response?.status === 403) setError('Access denied. You do not have permission to view this device.');
      else if (err.response?.status === 404) setError('Device not found.');
      else setError(err.response?.data?.message || 'Failed to load device information');
    } finally {
      setLoading(false);
    }
  }, [liveOnly, deviceId, classroomId, isLoggedIn, getAnonymousSession]);

  // --- Backend: fetch latest data (skipped in liveOnly) ---
  const fetchLatestData = useCallback(async () => {
    if (liveOnly) return; // do nothing in BLE mode

    try {
      let response;
      if (isLoggedIn) {
        response = await client.get(`/device/${deviceId}/data/latest`);
      } else {
        const anonymousSession = getAnonymousSession();
        if (anonymousSession && classroomId) {
          response = await client.get(`/device/${deviceId}/data/latest/anonymous`, {
            params: {
              class_id: classroomId,
              first_name: anonymousSession.first_name,
              pin_code: anonymousSession.pin_code,
            },
          });
        } else {
          return;
        }
      }
      if (response?.data?.success) {
        setDeviceData(response.data.data.data);
      }
    } catch (err) {
      console.error('Error fetching latest device data:', err);
      // non-fatal
    }
  }, [liveOnly, deviceId, isLoggedIn, getAnonymousSession, classroomId]);

  // Initial load (backend mode)
  useEffect(() => {
    fetchDevice();
  }, [fetchDevice]);

  // Polling latest data (backend mode)
  useEffect(() => {
    fetchLatestData();
    if (liveOnly) return; // no polling in BLE mode
    const interval = setInterval(fetchLatestData, 30000);
    return () => clearInterval(interval);
  }, [fetchLatestData, liveOnly]);

  const handleBack = () => {
    if (fromClassroom) navigate(`/classroom/${classroomId}`);
    else navigate('/dashboard');
  };

  const getBatteryIcon = (batteryLevel) => {
    if (batteryLevel >= 80) return <BatteryChargingFull color="success" />;
    if (batteryLevel >= 30) return <BatteryCharging50 color="warning" />;
    return <BatteryAlert color="error" />;
  };

  const getOnlineStatus = (lastSeen) => {
    if (!lastSeen) return { online: false, text: 'Never seen', icon: <WifiOffIcon color="error" /> };
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = (now - lastSeenDate) / (1000 * 60);
    if (diffMinutes <= 1) return { online: true, text: 'Online', icon: <WifiIcon color="success" /> };
    if (diffMinutes <= 60) return { online: false, text: `${Math.round(diffMinutes)}m ago`, icon: <WifiOffIcon color="warning" /> };
    return { online: false, text: `${Math.round(diffMinutes / 60)}h ago`, icon: <WifiOffIcon color="error" /> };
  };

  // --- Render paths ---
  if (!liveOnly && loading) {
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

  if (!liveOnly && error) {
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

  // backend mode needs device; BLE mode does not
  if (!liveOnly && !device) {
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

  // compute status only in backend mode
  const onlineStatus = !liveOnly ? getOnlineStatus(device.last_seen) : null;
  const breadcrumbName = liveOnly ? (titleOverride || 'P-BIT (BLE)') : (deviceNickname || device.nickname);

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
          {breadcrumbName}
        </Typography>
      </Breadcrumbs>

      {/* Header:
          - BLE mode: show titleOverride & BLE connect controls
          - Backend mode: you can still pass battery info via chips if needed,
            but our DeviceHeader supports titleOverride and handles BLE itself. */}
      <DeviceHeader titleOverride={titleOverride} />

      <Divider sx={{ my: 3 }} />

      {/* Live Section (BLE-powered). In backend mode you can still pass deviceData if you need,
          but our BLE LiveSection ignores props and renders off the BLE stream. */}
      <DeviceLiveSection />

      <Divider sx={{ my: 3 }} />

      {/* Graphs (BLE-powered live charts). */}
      <DeviceGraphingSection />

      {/* Dev Section - Only show in development (optional) */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <Divider sx={{ my: 3 }} />
          <DeviceDevSection
            deviceId={deviceId}
            classroomId={classroomId}
            onDataAdded={() => {
              if (!liveOnly) fetchLatestData();
            }}
          />
        </>
      )}
    </Container>
  );
};

export default DeviceViewPage;
