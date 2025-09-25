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
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';

// Mock IoT sensor data with more detailed structure
const generateRechartsData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      time: `${i}:00`,
      temperature: Math.floor(Math.random() * 15) + 20,
      moisture: Math.floor(Math.random() * 40) + 30,
      light: Math.floor(Math.random() * 800) + 200,
      sound: Math.floor(Math.random() * 60) + 40,
      humidity: Math.floor(Math.random() * 30) + 40,
      pressure: Math.floor(Math.random() * 50) + 1000
    });
  }
  return data;
};

const sensorData = generateRechartsData();

// Color scheme
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const RechartsDemo = () => {
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
  const currentReadings = sensorData[sensorData.length - 1];
  
  // Data for pie chart (sensor distribution)
  const pieData = Object.keys(selectedSensors)
    .filter(sensor => selectedSensors[sensor])
    .map((sensor, index) => ({
      name: sensor.charAt(0).toUpperCase() + sensor.slice(1),
      value: currentReadings[sensor],
      fill: COLORS[index % COLORS.length]
    }));

  // Data for radial bar chart
  const radialData = Object.keys(selectedSensors)
    .filter(sensor => selectedSensors[sensor])
    .map((sensor, index) => ({
      name: sensor.charAt(0).toUpperCase() + sensor.slice(1),
      value: sensor === 'temperature' ? (currentReadings[sensor] / 35) * 100 :
             sensor === 'light' ? (currentReadings[sensor] / 1000) * 100 :
             sensor === 'sound' ? (currentReadings[sensor] / 100) * 100 :
             currentReadings[sensor], // moisture is already 0-100
      fill: COLORS[index % COLORS.length]
    }));

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="h5" component="h2">
            📈 Recharts Demo
          </Typography>
          <Chip label="React Native" color="secondary" size="small" />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Explore IoT sensor data with beautiful animated charts. Toggle sensors to customize your view.
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
                      {currentReadings.temperature}°C
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">💧 Moisture:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {currentReadings.moisture}%
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">☀️ Light:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {currentReadings.light} lux
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">🔊 Sound:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {currentReadings.sound} dB
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
              <Tab label="Line Chart" />
              <Tab label="Area Chart" />
              <Tab label="Bar Chart" />
              <Tab label="Pie Chart" />
            </Tabs>

            {activeTab === 0 && (
              <Card>
                <CardHeader title="Sensor Trends Over Time" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={sensorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {selectedSensors.temperature && (
                        <Line 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#FF8042" 
                          strokeWidth={2}
                          name="Temperature (°C)"
                        />
                      )}
                      {selectedSensors.moisture && (
                        <Line 
                          type="monotone" 
                          dataKey="moisture" 
                          stroke="#0088FE" 
                          strokeWidth={2}
                          name="Moisture (%)"
                        />
                      )}
                      {selectedSensors.light && (
                        <Line 
                          type="monotone" 
                          dataKey="light" 
                          stroke="#FFBB28" 
                          strokeWidth={2}
                          name="Light (lux)"
                        />
                      )}
                      {selectedSensors.sound && (
                        <Line 
                          type="monotone" 
                          dataKey="sound" 
                          stroke="#8884D8" 
                          strokeWidth={2}
                          name="Sound (dB)"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {activeTab === 1 && (
              <Card>
                <CardHeader title="Environmental Conditions" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={sensorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {selectedSensors.temperature && (
                        <Area 
                          type="monotone" 
                          dataKey="temperature" 
                          stackId="1" 
                          stroke="#FF8042" 
                          fill="#FF8042"
                          name="Temperature (°C)"
                        />
                      )}
                      {selectedSensors.moisture && (
                        <Area 
                          type="monotone" 
                          dataKey="moisture" 
                          stackId="1" 
                          stroke="#0088FE" 
                          fill="#0088FE"
                          name="Moisture (%)"
                        />
                      )}
                      {selectedSensors.light && (
                        <Area 
                          type="monotone" 
                          dataKey="light" 
                          stackId="1" 
                          stroke="#FFBB28" 
                          fill="#FFBB28"
                          name="Light (lux)"
                        />
                      )}
                      {selectedSensors.sound && (
                        <Area 
                          type="monotone" 
                          dataKey="sound" 
                          stackId="1" 
                          stroke="#8884D8" 
                          fill="#8884D8"
                          name="Sound (dB)"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {activeTab === 2 && (
              <Card>
                <CardHeader title="Current Sensor Readings" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={Object.keys(selectedSensors)
                      .filter(sensor => selectedSensors[sensor])
                      .map(sensor => ({
                        name: sensor.charAt(0).toUpperCase() + sensor.slice(1),
                        value: currentReadings[sensor]
                      }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884D8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {activeTab === 3 && (
              <Card>
                <CardHeader title="Sensor Data Distribution" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default RechartsDemo;
