import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import Plot from 'react-plotly.js';

// Mock IoT sensor data for Plotly
const generatePlotlyData = () => {
  const data = [];
  for (let i = 0; i < 48; i++) { // 48 data points (2 days)
    data.push({
      time: new Date(Date.now() - (47 - i) * 60 * 60 * 1000).toISOString().slice(0, 16),
      temperature: 20 + Math.sin(i * 0.3) * 8 + Math.random() * 4,
      moisture: 50 + Math.cos(i * 0.2) * 20 + Math.random() * 10,
      light: 200 + Math.sin(i * 0.4) * 150 + Math.random() * 100,
      sound: 40 + Math.cos(i * 0.25) * 15 + Math.random() * 8
    });
  }
  return data;
};

const sensorData = generatePlotlyData();

const PlotlyDemo = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSensors, setSelectedSensors] = useState({
    temperature: true,
    moisture: true,
    light: true,
    sound: true
  });

  const handleSensorToggle = (sensor) => {
    setSelectedSensors(prev => ({
      ...prev,
      [sensor]: !prev[sensor]
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Current readings
  const currentReadings = {
    temperature: sensorData[sensorData.length - 1].temperature,
    moisture: sensorData[sensorData.length - 1].moisture,
    light: sensorData[sensorData.length - 1].light,
    sound: sensorData[sensorData.length - 1].sound
  };

  // Heatmap data
  const generateHeatmapData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const z = [];
    
    days.forEach(() => {
      const dayData = [];
      hours.forEach(() => {
        dayData.push(Math.random() * 100);
      });
      z.push(dayData);
    });
    
    return { hours, days, z };
  };

  const heatmapData = generateHeatmapData();

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="h5" component="h2">
            🔬 Plotly.js Demo
          </Typography>
          <Chip label="Scientific" color="error" size="small" />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Explore IoT sensor data with advanced scientific visualizations. Toggle sensors to customize your analysis.
        </Typography>

        <Grid container spacing={3}>
          {/* Current Sensor Readings */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Readings
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">🌡️ Temperature:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {currentReadings.temperature.toFixed(1)}°C
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">💧 Moisture:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {currentReadings.moisture.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">☀️ Light:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {currentReadings.light.toFixed(0)} lux
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">🔊 Sound:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {currentReadings.sound.toFixed(1)} dB
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sensor Controls */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Sensors to Display
                </Typography>
                <FormControl component="fieldset">
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSensors.temperature}
                          onChange={() => handleSensorToggle('temperature')}
                        />
                      }
                      label="🌡️ Temperature"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSensors.moisture}
                          onChange={() => handleSensorToggle('moisture')}
                        />
                      }
                      label="💧 Moisture"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSensors.light}
                          onChange={() => handleSensorToggle('light')}
                        />
                      }
                      label="☀️ Light"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSensors.sound}
                          onChange={() => handleSensorToggle('sound')}
                        />
                      }
                      label="🔊 Sound"
                    />
                  </FormGroup>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Chart Tabs */}
          <Grid item xs={12}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Time Series" />
              <Tab label="3D Analysis" />
              <Tab label="Heatmap" />
              <Tab label="Gauges" />
            </Tabs>

            {activeTab === 0 && (
              <Card>
                <CardHeader title="Sensor Data Timeline" />
                <CardContent>
                  <Plot
                    data={[
                      selectedSensors.temperature && {
                        x: sensorData.map(d => d.time),
                        y: sensorData.map(d => d.temperature),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Temperature (°C)',
                        line: { color: '#FF6B6B' }
                      },
                      selectedSensors.moisture && {
                        x: sensorData.map(d => d.time),
                        y: sensorData.map(d => d.moisture),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Moisture (%)',
                        line: { color: '#4ECDC4' }
                      },
                      selectedSensors.light && {
                        x: sensorData.map(d => d.time),
                        y: sensorData.map(d => d.light),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Light (lux)',
                        line: { color: '#45B7D1' }
                      },
                      selectedSensors.sound && {
                        x: sensorData.map(d => d.time),
                        y: sensorData.map(d => d.sound),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Sound (dB)',
                        line: { color: '#A8E6CF' }
                      }
                    ].filter(Boolean)}
                    layout={{
                      title: 'Multi-Sensor Time Series Analysis',
                      xaxis: { title: 'Time' },
                      yaxis: { title: 'Sensor Values' },
                      height: 400,
                      showlegend: true
                    }}
                    config={{ responsive: true }}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 1 && (
              <Card>
                <CardHeader title="3D Sensor Analysis" />
                <CardContent>
                  <Plot
                    data={[
                      {
                        x: sensorData.map(d => d.temperature),
                        y: sensorData.map(d => d.moisture),
                        z: sensorData.map(d => d.light),
                        mode: 'markers',
                        type: 'scatter3d',
                        name: 'Sensor Data',
                        marker: {
                          size: 5,
                          color: sensorData.map(d => d.sound),
                          colorscale: 'Viridis',
                          showscale: true,
                          colorbar: { title: 'Sound (dB)' }
                        }
                      }
                    ]}
                    layout={{
                      title: '3D Sensor Data Analysis',
                      scene: {
                        xaxis: { title: 'Temperature (°C)' },
                        yaxis: { title: 'Moisture (%)' },
                        zaxis: { title: 'Light (lux)' }
                      },
                      height: 400
                    }}
                    config={{ responsive: true }}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 2 && (
              <Card>
                <CardHeader title="Sensor Data Heatmap" />
                <CardContent>
                  <Plot
                    data={[
                      {
                        z: heatmapData.z,
                        x: heatmapData.hours,
                        y: heatmapData.days,
                        type: 'heatmap',
                        colorscale: 'Viridis',
                        showscale: true
                      }
                    ]}
                    layout={{
                      title: 'Weekly Sensor Activity Heatmap',
                      xaxis: { title: 'Hour of Day' },
                      yaxis: { title: 'Day of Week' },
                      height: 400
                    }}
                    config={{ responsive: true }}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 3 && (
              <Card>
                <CardHeader title="Sensor Gauges" />
                <CardContent>
                  <Plot
                    data={[
                      {
                        type: 'indicator',
                        mode: 'gauge+number',
                        value: currentReadings.temperature,
                        title: { text: 'Temperature (°C)' },
                        gauge: {
                          axis: { range: [0, 40] },
                          bar: { color: 'darkblue' },
                          steps: [
                            { range: [0, 20], color: 'lightgray' },
                            { range: [20, 30], color: 'yellow' },
                            { range: [30, 40], color: 'red' }
                          ],
                          threshold: {
                            line: { color: 'red', width: 4 },
                            thickness: 0.75,
                            value: 35
                          }
                        }
                      }
                    ]}
                    layout={{
                      title: 'Current Temperature Reading',
                      height: 400
                    }}
                    config={{ responsive: true }}
                  />
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PlotlyDemo;