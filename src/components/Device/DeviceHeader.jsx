// src/components/Device/DeviceHeader.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Bluetooth as BluetoothIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  CloudQueue,
  CloudOff,
  InfoOutlined,
} from '@mui/icons-material';

import { isConnected, connectBLEFiltered, connectBLECompatible, stop } from '../../ble';

/**
 * Device header showing device name and BLE/cloud status.
 * - Reads the BT device name from sessionStorage ('pbit.deviceName') after connect.
 * - Provides quick connect/disconnect actions here (in addition to Live section).
 * - Cloud chips are placeholders; keep or remove depending on your backend usage.
 */
export default function DeviceHeader() {
  const [connected, setConnected] = useState(isConnected());
  const [deviceName, setDeviceName] = useState(sessionStorage.getItem('pbit.deviceName') || 'P-BIT');

  useEffect(() => {
    // Poll minimal state to reflect reconnection/disconnection
    const t = setInterval(() => setConnected(isConnected()), 1000);
    return () => clearInterval(t);
  }, []);

  const doConnectRecommended = async () => {
    try {
      const name = await connectBLEFiltered();
      setDeviceName(name || 'P-BIT');
      setConnected(isConnected());
    } catch (e) {
      console.error(e);
      setConnected(false);
    }
  };

  const doConnectCompatible = async () => {
    try {
      const name = await connectBLECompatible();
      setDeviceName(name || 'P-BIT');
      setConnected(isConnected());
    } catch (e) {
      console.error(e);
      setConnected(false);
    }
  };

  const doDisconnect = () => {
    stop();
    setConnected(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        {/* Left: Title + name */}
        <Box display="flex" alignItems="center" gap={1} minWidth={0}>
          <BluetoothIcon color={connected ? 'primary' : 'disabled'} />
          <Typography variant="h6" noWrap>
            {deviceName}
          </Typography>
          <Tooltip title="P-BIT IoT Device">
            <InfoOutlined fontSize="small" sx={{ opacity: 0.7 }} />
          </Tooltip>
        </Box>

        {/* Middle: Status chips */}
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          {/* BLE status chip */}
          <Chip
            label={connected ? 'BLE Connected' : 'BLE Idle'}
            color={connected ? 'success' : 'default'}
            variant={connected ? 'filled' : 'outlined'}
            size="small"
            icon={<BluetoothIcon />}
          />

          {/* Cloud status (placeholder). Keep/remove as you need. */}
          <Chip
            label="Cloud Ready"
            color="default"
            variant="outlined"
            size="small"
            icon={<CloudQueue />}
          />
          {/* If you want an "offline" look, swap to CloudOff: */}
          {/* <Chip label="Cloud Offline" color="default" variant="outlined" size="small" icon={<CloudOff />} /> */}
        </Box>

        {/* Right: Actions */}
        <Box display="flex" alignItems="center" gap={1}>
          {!connected ? (
            <>
              <Button
                variant="contained"
                startIcon={<LinkIcon />}
                onClick={doConnectRecommended}
              >
                Connect (P-BIT)
              </Button>
              <Button variant="outlined" onClick={doConnectCompatible}>
                Compatible
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              color="error"
              startIcon={<LinkOffIcon />}
              onClick={doDisconnect}
            >
              Disconnect
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
