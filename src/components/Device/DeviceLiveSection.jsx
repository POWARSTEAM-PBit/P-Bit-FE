// src/components/Device/DeviceLiveSection.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, IconButton, Tooltip, Switch,
  FormControlLabel, LinearProgress, Chip, Button, Grid
} from '@mui/material';
import {
  Refresh, Thermostat, WaterDrop, LightMode, VolumeUp,
  BatteryChargingFull, Link as LinkIcon, LinkOff as LinkOffIcon, Bluetooth as BluetoothIcon
} from '@mui/icons-material';
import styles from './DeviceLiveSection.module.css';

// BLE helpers (new)
import {
  subscribe, connectBLEFiltered, connectBLECompatible, stop, isConnected
} from '../../ble';

/**
 * Live section reading type aligned with the dashboard needs.
 */
const useLiveReading = () => {
  const [connected, setConnected] = useState(false);
  const [reading, setReading] = useState({
    temperature: null, humidity: null, light: null, sound: null, battery: null, ts: null,
  });

  useEffect(() => {
    const off = subscribe((r) => {
      setReading({
        temperature: r.temp ?? r.air_temp ?? r.soil_temp ?? null,
        humidity: r.hum ?? r.air_hum ?? r.soil_hum ?? null,
        light: r.ldr ?? null,
        sound: r.mic ?? null,
        battery: r.batt ?? null,
        ts: r.ts ?? Date.now(),
      });
      setConnected(true);
    });
    return off;
  }, []);

  const connectRecommended = async () => {
    try {
      await connectBLEFiltered();   // only show PBIT-xxxx
      setConnected(isConnected());
    } catch (e) {
      console.error(e);
      setConnected(false);
    }
  };

  const connectCompatible = async () => {
    try {
      await connectBLECompatible(); // accept all devices, then try both services
      setConnected(isConnected());
    } catch (e) {
      console.error(e);
      setConnected(false);
    }
  };

  const disconnect = () => {
    stop();
    setConnected(false);
  };

  return { reading, connected, connectRecommended, connectCompatible, disconnect };
};

const SensorCard = ({ icon, label, value, unit, color }) => (
  <Paper elevation={2} sx={{ p: 2 }}>
    <Box display="flex" alignItems="center" gap={1}>
      {icon}
      <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
    </Box>
    <Typography variant="h5" sx={{ mt: 1 }}>
      {value ?? '—'}{value != null ? ` ${unit}` : ''}
    </Typography>
    <LinearProgress
      variant="determinate"
      value={value != null ? Math.max(0, Math.min(100, Number(value))) : 0}
      color={color}
      sx={{ mt: 1 }}
    />
  </Paper>
);

export default function DeviceLiveSection() {
  const { reading, connected, connectRecommended, connectCompatible, disconnect } = useLiveReading();

  const [showGauges, setShowGauges] = useState({
    temperature: true, humidity: true, light: true, sound: true, battery: true,
  });

  const handleGaugeToggle = (sensor) => {
    setShowGauges(prev => ({ ...prev, [sensor]: !prev[sensor] }));
  };

  const getSensorColor = (sensor, value) => {
    if (value == null) return 'inherit';
    switch (sensor) {
      case 'temperature':
        if (value > 30) return 'error'; if (value < 10) return 'warning'; return 'success';
      case 'humidity':
        if (value > 80) return 'error'; if (value < 20) return 'warning'; return 'success';
      case 'light':
        if (value > 1000) return 'error'; if (value < 100) return 'warning'; return 'success';
      case 'sound':
        if (value > 80) return 'error'; if (value > 60) return 'warning'; return 'success';
      case 'battery':
        if (value < 20) return 'error'; if (value < 50) return 'warning'; return 'success';
      default:
        return 'inherit';
    }
  };

  const getSensorUnit = (sensor) => {
    switch (sensor) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'light': return 'lux';
      case 'sound': return 'dB';
      case 'battery': return '%';
      default: return '';
    }
  };

  const sensorList = useMemo(() => ([
    { key: 'temperature', label: 'Temperature', icon: <Thermostat /> },
    { key: 'humidity',    label: 'Humidity',    icon: <WaterDrop /> },
    { key: 'light',       label: 'Light',       icon: <LightMode /> },
    { key: 'sound',       label: 'Sound',       icon: <VolumeUp /> },
    { key: 'battery',     label: 'Battery',     icon: <BatteryChargingFull /> },
  ]), []);

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header: BLE connect / disconnect */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <BluetoothIcon color={connected ? 'primary' : 'disabled'} />
          <Typography variant="h6">Live Data (BLE)</Typography>
          <Chip
            size="small"
            label={connected ? 'BLE Connected' : 'Not Connected'}
            color={connected ? 'success' : 'default'}
            variant={connected ? 'filled' : 'outlined'}
          />
        </Box>
        <Box display="flex" gap={1}>
          {!connected ? (
            <>
              <Button variant="contained" onClick={connectRecommended} startIcon={<LinkIcon />}>
                Connect (P-BIT)
              </Button>
              <Button variant="outlined" onClick={connectCompatible}>
                Compatible
              </Button>
            </>
          ) : (
            <Button variant="outlined" color="error" onClick={disconnect} startIcon={<LinkOffIcon />}>
              Disconnect
            </Button>
          )}
        </Box>
      </Box>

      {/* Gauge toggles */}
      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        {sensorList.map(s => (
          <FormControlLabel
            key={s.key}
            control={
              <Switch
                checked={!!showGauges[s.key]}
                onChange={() => handleGaugeToggle(s.key)}
              />
            }
            label={s.label}
          />
        ))}
      </Box>

      {/* Cards */}
      <Grid container spacing={2}>
        {sensorList.map(s => (
          showGauges[s.key] && (
            <Grid item xs={12} sm={6} md={4} key={s.key}>
              <SensorCard
                icon={s.icon}
                label={s.label}
                value={reading[s.key]}
                unit={getSensorUnit(s.key)}
                color={getSensorColor(s.key, reading[s.key])}
              />
            </Grid>
          )
        ))}
      </Grid>
    </Paper>
  );
}
