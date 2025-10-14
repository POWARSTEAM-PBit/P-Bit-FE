import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Refresh,
  Thermostat,
  WaterDrop,
  LightMode,
  VolumeUp,
  BatteryChargingFull,
  BatteryCharging50,
  BatteryAlert,
  DeviceThermostat,
  Grass,
} from '@mui/icons-material';
import styles from './DeviceLiveSection.module.css';

const DeviceLiveSection = ({ device, deviceData, onRefresh }) => {
  const [showGauges, setShowGauges] = useState({
    temperature: true,
    thermometer: true,
    humidity: true,
    moisture: true,
    light: true,
    sound: true,
    battery: true,
  });

  const handleGaugeToggle = (sensor) => {
    setShowGauges(prev => ({
      ...prev,
      [sensor]: !prev[sensor]
    }));
  };

  const getSensorIcon = (sensor) => {
    switch (sensor) {
      case 'temperature': return <Thermostat />;
      case 'thermometer': return <DeviceThermostat />;
      case 'humidity': return <WaterDrop />;
      case 'moisture': return <Grass />;
      case 'light': return <LightMode />;
      case 'sound': return <VolumeUp />;
      case 'battery': return <BatteryChargingFull />;
      default: return null;
    }
  };

  const getSensorColor = (sensor, value) => {
    if (!value && value !== 0) return 'default';
    
    switch (sensor) {
      case 'temperature':
        if (value > 30) return 'error';
        if (value < 5) return 'info';
        return 'success';
      case 'thermometer':
        if (value > 30) return 'error';
        if (value < 5) return 'info';
        return 'success';
      case 'humidity':
        if (value > 80) return 'error';
        if (value < 20) return 'warning';
        return 'success';
      case 'moisture':
        if (value > 80) return 'error';
        if (value < 20) return 'warning';
        return 'success';
      case 'light':
        if (value > 1000) return 'error';
        if (value < 100) return 'warning';
        return 'success';
      case 'sound':
        if (value > 80) return 'error';
        if (value > 60) return 'warning';
        return 'success';
      case 'battery':
        if (value < 20) return 'error';
        if (value < 50) return 'warning';
        return 'success';
      default:
        return 'default';
    }
  };

  const getSensorUnit = (sensor) => {
    switch (sensor) {
      case 'temperature': return '°C';
      case 'thermometer': return '°C';
      case 'humidity': return '%';
      case 'moisture': return '%';
      case 'light': return 'lux';
      case 'sound': return 'dB';
      case 'battery': return '%';
      default: return '';
    }
  };

  const getSensorRange = (sensor) => {
    switch (sensor) {
      case 'temperature': return { min: -10, max: 50 };
      case 'thermometer': return { min: -10, max: 50 };
      case 'humidity': return { min: 0, max: 100 };
      case 'moisture': return { min: 0, max: 100 };
      case 'light': return { min: 0, max: 10000 };
      case 'sound': return { min: 0, max: 120 };
      case 'battery': return { min: 0, max: 100 };
      default: return { min: 0, max: 100 };
    }
  };

  const getSensorValue = (sensor) => {
    if (sensor === 'battery') {
      return device?.battery_level || 0;
    }
    return deviceData?.[sensor] || null;
  };

  const formatSensorValue = (sensor, value) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (sensor) {
      case 'temperature':
        return `${value.toFixed(1)}°C`;
      case 'thermometer':
        return `${value.toFixed(1)}°C`;
      case 'humidity':
        return `${value.toFixed(1)}%`;
      case 'moisture':
        return `${value.toFixed(1)}%`;
      case 'light':
        return `${Math.round(value)} lux`;
      case 'sound':
        return `${value.toFixed(1)} dB`;
      case 'battery':
        return `${value}%`;
      default:
        return value.toString();
    }
  };

  const sensors = [
    { key: 'temperature', label: 'Temperature' },
    { key: 'thermometer', label: 'Thermometer' },
    { key: 'humidity', label: 'Humidity' },
    { key: 'moisture', label: 'Moisture' },
    { key: 'light', label: 'Light' },
    { key: 'sound', label: 'Sound' },
    { key: 'battery', label: 'Battery' },
  ];

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2" className={styles.sectionTitle}>
          Live Data
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={onRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Recent Readouts Summary */}
      <Box className={styles.summaryGrid}>
        {sensors.map(sensor => {
          const value = getSensorValue(sensor.key);
          const formattedValue = formatSensorValue(sensor.key, value);
          const color = getSensorColor(sensor.key, value);
          
          return (
            <Box key={sensor.key} className={styles.summaryCard}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {getSensorIcon(sensor.key)}
                <Typography variant="body2" className={styles.summaryLabel}>
                  {sensor.label}
                </Typography>
              </Box>
              <Typography variant="h6" className={styles.summaryValue}>
                {formattedValue}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Gauge Controls */}
      <Box mt={3} mb={2}>
        <Typography variant="h6" gutterBottom>
          Sensor Gauges
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          {sensors.map(sensor => (
            <FormControlLabel
              key={sensor.key}
              control={
                <Switch
                  checked={showGauges[sensor.key]}
                  onChange={() => handleGaugeToggle(sensor.key)}
                  color="primary"
                />
              }
              label={sensor.label}
            />
          ))}
        </Box>
      </Box>

      {/* Gauges */}
      <Box className={styles.gaugesContainer}>
        {sensors.map(sensor => {
          if (!showGauges[sensor.key]) return null;
          
          const value = getSensorValue(sensor.key);
          const range = getSensorRange(sensor.key);
          const percentage = value !== null && value !== undefined ? 
            ((value - range.min) / (range.max - range.min)) * 100 : 0;
          const color = getSensorColor(sensor.key, value);
          
          return (
            <Box key={sensor.key} className={styles.gaugeCard}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                {getSensorIcon(sensor.key)}
                <Typography variant="subtitle1" className={styles.gaugeTitle}>
                  {sensor.label}
                </Typography>
              </Box>
              
              <Box className={styles.gaugeContainer}>
                <Box className={styles.gaugeValue}>
                  {formatSensorValue(sensor.key, value)}
                </Box>
                
                <Box className={styles.gaugeBar}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.max(percentage, 0), 100)}
                    color={color}
                    sx={{
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 10,
                      },
                    }}
                  />
                </Box>
                
                <Box className={styles.gaugeRange}>
                  <Typography variant="caption" color="text.secondary">
                    {range.min} - {range.max} {getSensorUnit(sensor.key)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Last Updated */}
      {deviceData?.timestamp && (
        <Box mt={3} display="flex" justifyContent="center">
          <Chip
            icon={<Refresh />}
            label={`Last updated: ${new Date(deviceData.timestamp).toLocaleString()}`}
            variant="outlined"
            size="small"
          />
        </Box>
      )}
    </Paper>
  );
};

export default DeviceLiveSection;

