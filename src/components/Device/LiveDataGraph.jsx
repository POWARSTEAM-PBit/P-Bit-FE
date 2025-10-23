import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Grid
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const LiveDataGraph = ({ bleReading, isConnected }) => {
  const [dataHistory, setDataHistory] = useState([]);
  const [timeLabels, setTimeLabels] = useState([]);

  // Toggle state for each sensor
  const [visibleSensors, setVisibleSensors] = useState({
    temperature: true,
    thermometer: true,
    humidity: true,
    moisture: true,
    light: true,
    sound: true
  });

  const handleSensorToggle = (sensor) => {
    setVisibleSensors(prev => ({
      ...prev,
      [sensor]: !prev[sensor]
    }));
  };

  const toggleAllSensors = (enabled) => {
    setVisibleSensors({
      temperature: enabled,
      thermometer: enabled,
      humidity: enabled,
      moisture: enabled,
      light: enabled,
      sound: enabled
    });
  };

  // Update data history when new reading comes in
  useEffect(() => {
    if (bleReading && isConnected) {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString();
      
      setDataHistory(prev => {
        const newHistory = [...prev, {
          timestamp: now,
          temperature: bleReading.temp,
          thermometer: bleReading.thermometer,
          humidity: bleReading.hum,
          moisture: bleReading.moisture,
          light: bleReading.ldr,
          sound: bleReading.mic,
          battery: bleReading.batt
        }];

        // Keep only last 20 readings
        return newHistory.slice(-20);
      });
      
      setTimeLabels(prev => {
        const newLabels = [...prev, timeLabel];
        return newLabels.slice(-20);
      });
    }
  }, [bleReading, isConnected]);

  // Clear data when disconnected
  useEffect(() => {
    if (!isConnected) {
      setDataHistory([]);
      setTimeLabels([]);
    }
  }, [isConnected]);

  const chartData = {
    labels: timeLabels,
    datasets: [
      visibleSensors.temperature && {
        label: 'Temperature (°C)',
        data: dataHistory.map(d => d.temperature),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        yAxisID: 'y'
      },
      visibleSensors.thermometer && {
        label: 'Thermometer (°C)',
        data: dataHistory.map(d => d.thermometer),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.1,
        yAxisID: 'y'
      },
      visibleSensors.humidity && {
        label: 'Humidity (%)',
        data: dataHistory.map(d => d.humidity),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
        yAxisID: 'y1'
      },
      visibleSensors.moisture && {
        label: 'Moisture (%)',
        data: dataHistory.map(d => d.moisture),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.1,
        yAxisID: 'y1'
      },
      visibleSensors.light && {
        label: 'Light (lux)',
        data: dataHistory.map(d => d.light),
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        tension: 0.1,
        yAxisID: 'y2'
      },
      visibleSensors.sound && {
        label: 'Sound (dB)',
        data: dataHistory.map(d => d.sound),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        yAxisID: 'y3'
      }
    ].filter(Boolean)
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperature (°C)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Humidity/Moisture (%)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Light (lux)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y3: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Sound (dB)'
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: 'Live Sensor Data'
      }
    }
  };

  if (!isConnected || dataHistory.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          {!isConnected ? 'Connect to device to view live data' : 'Waiting for data...'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Control Panel */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="subtitle1" fontWeight="bold">
                Sensor Controls
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={Object.values(visibleSensors).every(Boolean)}
                    onChange={(e) => toggleAllSensors(e.target.checked)}
                    size="small"
                  />
                }
                label="All"
                labelPlacement="start"
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={visibleSensors.temperature}
                    onChange={() => handleSensorToggle('temperature')}
                    size="small"
                    sx={{
                      color: 'rgb(255, 99, 132)',
                      '&.Mui-checked': {
                        color: 'rgb(255, 99, 132)',
                      },
                    }}
                  />
                }
                label="Temperature"
                sx={{ fontSize: '0.875rem' }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={visibleSensors.thermometer}
                    onChange={() => handleSensorToggle('thermometer')}
                    size="small"
                    sx={{
                      color: 'rgb(153, 102, 255)',
                      '&.Mui-checked': {
                        color: 'rgb(153, 102, 255)',
                      },
                    }}
                  />
                }
                label="Thermometer"
                sx={{ fontSize: '0.875rem' }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={visibleSensors.humidity}
                    onChange={() => handleSensorToggle('humidity')}
                    size="small"
                    sx={{
                      color: 'rgb(54, 162, 235)',
                      '&.Mui-checked': {
                        color: 'rgb(54, 162, 235)',
                      },
                    }}
                  />
                }
                label="Humidity"
                sx={{ fontSize: '0.875rem' }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={visibleSensors.moisture}
                    onChange={() => handleSensorToggle('moisture')}
                    size="small"
                    sx={{
                      color: 'rgb(255, 159, 64)',
                      '&.Mui-checked': {
                        color: 'rgb(255, 159, 64)',
                      },
                    }}
                  />
                }
                label="Moisture"
                sx={{ fontSize: '0.875rem' }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={visibleSensors.light}
                    onChange={() => handleSensorToggle('light')}
                    size="small"
                    sx={{
                      color: 'rgb(255, 205, 86)',
                      '&.Mui-checked': {
                        color: 'rgb(255, 205, 86)',
                      },
                    }}
                  />
                }
                label="Light"
                sx={{ fontSize: '0.875rem' }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={visibleSensors.sound}
                    onChange={() => handleSensorToggle('sound')}
                    size="small"
                    sx={{
                      color: 'rgb(75, 192, 192)',
                      '&.Mui-checked': {
                        color: 'rgb(75, 192, 192)',
                      },
                    }}
                  />
                }
                label="Sound"
                sx={{ fontSize: '0.875rem' }}
              />
            </FormGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Live Graph */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box sx={{ height: 500 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </Paper>
    </Box>
  );
};

export default LiveDataGraph;
