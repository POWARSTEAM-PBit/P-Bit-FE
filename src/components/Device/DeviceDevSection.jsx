import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { 
  Construction, 
  PlayArrow, 
  Stop, 
  Send,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useClassroom } from '../../contexts/ClassroomContext';
import client from '../../api/client';
import styles from './DeviceDevSection.module.css';

const DeviceDevSection = ({ deviceId, classroomId, onDataAdded }) => {
  const { isLoggedIn } = useAuth();
  const { getAnonymousSession } = useClassroom();
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState(5000);
  const [selectedSensors, setSelectedSensors] = useState({
    temperature: true,
    thermometer: false,
    humidity: true,
    moisture: false,
    light: false,
    sound: false
  });
  const [sensorRanges, setSensorRanges] = useState({
    temperature: { min: 15, max: 35 },
    thermometer: { min: 15, max: 35 },
    humidity: { min: 30, max: 80 },
    moisture: { min: 20, max: 90 },
    light: { min: 0, max: 1000 },
    sound: { min: 30, max: 90 }
  });
  const [lastSentData, setLastSentData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const sensors = [
    { key: 'temperature', label: 'Temperature (°C)', unit: '°C' },
    { key: 'thermometer', label: 'Thermometer (°C)', unit: '°C' },
    { key: 'humidity', label: 'Humidity (%)', unit: '%' },
    { key: 'moisture', label: 'Moisture (%)', unit: '%' },
    { key: 'light', label: 'Light (lux)', unit: 'lux' },
    { key: 'sound', label: 'Sound (dB)', unit: 'dB' }
  ];

  const intervals = [
    { value: 1000, label: '1 second' },
    { value: 2000, label: '2 seconds' },
    { value: 5000, label: '5 seconds' },
    { value: 10000, label: '10 seconds' },
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' }
  ];

  const generateRandomValue = (min, max) => {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  };

  const generateSensorData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      temperature: selectedSensors.temperature ? generateRandomValue(sensorRanges.temperature.min, sensorRanges.temperature.max) : null,
      thermometer: selectedSensors.thermometer ? generateRandomValue(sensorRanges.thermometer.min, sensorRanges.thermometer.max) : null,
      humidity: selectedSensors.humidity ? generateRandomValue(sensorRanges.humidity.min, sensorRanges.humidity.max) : null,
      moisture: selectedSensors.moisture ? generateRandomValue(sensorRanges.moisture.min, sensorRanges.moisture.max) : null,
      light: selectedSensors.light ? generateRandomValue(sensorRanges.light.min, sensorRanges.light.max) : null,
      sound: selectedSensors.sound ? generateRandomValue(sensorRanges.sound.min, sensorRanges.sound.max) : null
    };
    return data;
  };

  const sendDataToDevice = async (data) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await client.post('/device/data', {
        device_id: deviceId,
        ...data
      });

      if (response.data.success) {
        setLastSentData(data);
        setSuccess('Data sent successfully!');
        if (onDataAdded) {
          onDataAdded();
        }
      } else {
        throw new Error(response.data.message || 'Failed to send data');
      }
    } catch (err) {
      console.error('Error sending data:', err);
      setError(err.response?.data?.message || 'Failed to send data to device');
    }
  };

  const handleSendSingleData = () => {
    const data = generateSensorData();
    sendDataToDevice(data);
  };

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setError(null);
    setSuccess(null);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
  };

  useEffect(() => {
    let intervalId;
    
    if (isSimulating) {
      intervalId = setInterval(() => {
        const data = generateSensorData();
        sendDataToDevice(data);
      }, simulationInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isSimulating, simulationInterval, selectedSensors, sensorRanges, deviceId]);

  const handleSensorToggle = (sensor) => {
    setSelectedSensors(prev => ({
      ...prev,
      [sensor]: !prev[sensor]
    }));
  };

  const handleRangeChange = (sensor, field, value) => {
    setSensorRanges(prev => ({
      ...prev,
      [sensor]: {
        ...prev[sensor],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }} className={styles.devSection}>
      <Typography variant="h6" gutterBottom>
        <Construction sx={{ mr: 1, verticalAlign: 'middle' }} />
        Development Tools
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Simulate sensor data for testing and development purposes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Sensor Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Select Sensors to Simulate
              </Typography>
              <Grid container spacing={1}>
                {sensors.map((sensor) => (
                  <Grid item key={sensor.key}>
                    <Chip
                      label={sensor.label}
                      color={selectedSensors[sensor.key] ? "primary" : "default"}
                      variant={selectedSensors[sensor.key] ? "filled" : "outlined"}
                      onClick={() => handleSensorToggle(sensor.key)}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Simulation Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Simulation Controls
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Interval</InputLabel>
                    <Select
                      value={simulationInterval}
                      label="Interval"
                      onChange={(e) => setSimulationInterval(e.target.value)}
                      disabled={isSimulating}
                    >
                      {intervals.map((interval) => (
                        <MenuItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Send />}
                  onClick={handleSendSingleData}
                  disabled={isSimulating}
                >
                  Send Once
                </Button>
                
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={handleStartSimulation}
                  disabled={isSimulating}
                >
                  Start Simulation
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStopSimulation}
                  disabled={!isSimulating}
                >
                  Stop Simulation
                </Button>
              </Box>

              {isSimulating && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Simulation running every {intervals.find(i => i.value === simulationInterval)?.label}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sensor Ranges */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Sensor Value Ranges
              </Typography>
              <Grid container spacing={2}>
                {sensors.map((sensor) => (
                  <Grid item xs={12} sm={6} md={3} key={sensor.key}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        {sensor.label}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <TextField
                            size="small"
                            label="Min"
                            type="number"
                            value={sensorRanges[sensor.key].min}
                            onChange={(e) => handleRangeChange(sensor.key, 'min', e.target.value)}
                            disabled={!selectedSensors[sensor.key]}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            size="small"
                            label="Max"
                            type="number"
                            value={sensorRanges[sensor.key].max}
                            onChange={(e) => handleRangeChange(sensor.key, 'max', e.target.value)}
                            disabled={!selectedSensors[sensor.key]}
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Last Sent Data */}
        {lastSentData && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Last Sent Data
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(lastSentData).map(([key, value]) => {
                    if (key === 'timestamp') return null;
                    if (value === null) return null;
                    const sensor = sensors.find(s => s.key === key);
                    return (
                      <Chip
                        key={key}
                        label={`${sensor?.label}: ${value}${sensor?.unit || ''}`}
                        variant="outlined"
                        size="small"
                      />
                    );
                  })}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Sent at: {new Date(lastSentData.timestamp).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default DeviceDevSection;
