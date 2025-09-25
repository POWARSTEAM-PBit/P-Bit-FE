import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab
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
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Mock IoT sensor data
const generateMockData = () => {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const temperature = hours.map(() => Math.floor(Math.random() * 15) + 20); // 20-35°C
  const moisture = hours.map(() => Math.floor(Math.random() * 40) + 30); // 30-70%
  const light = hours.map(() => Math.floor(Math.random() * 800) + 200); // 200-1000 lux
  const sound = hours.map(() => Math.floor(Math.random() * 60) + 40); // 40-100 dB

  return { hours, temperature, moisture, light, sound };
};

const { hours, temperature, moisture, light, sound } = generateMockData();

const ChartJSDemo = () => {
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
    temperature: temperature[temperature.length - 1],
    moisture: moisture[moisture.length - 1],
    light: light[light.length - 1],
    sound: sound[sound.length - 1]
  };

  // Line chart data with selected sensors
  const lineChartData = {
    labels: hours,
    datasets: [
      selectedSensors.temperature && {
        label: 'Temperature (°C)',
        data: temperature,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
      },
      selectedSensors.moisture && {
        label: 'Moisture (%)',
        data: moisture,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      },
      selectedSensors.light && {
        label: 'Light (lux)',
        data: light,
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        tension: 0.4,
      },
      selectedSensors.sound && {
        label: 'Sound (dB)',
        data: sound,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      }
    ].filter(Boolean),
  };

  // Bar chart data with selected sensors
  const barChartData = {
    labels: Object.keys(selectedSensors).filter(sensor => selectedSensors[sensor]),
    datasets: [
      {
        label: 'Current Readings',
        data: Object.keys(selectedSensors)
          .filter(sensor => selectedSensors[sensor])
          .map(sensor => {
            const value = currentReadings[sensor];
            return sensor === 'light' ? value / 10 : value; // Scale light for better visualization
          }),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ].slice(0, Object.values(selectedSensors).filter(Boolean).length),
      },
    ],
  };

  // Doughnut chart for sensor distribution
  const doughnutData = {
    labels: Object.keys(selectedSensors).filter(sensor => selectedSensors[sensor]),
    datasets: [
      {
        data: Object.keys(selectedSensors)
          .filter(sensor => selectedSensors[sensor])
          .map(sensor => currentReadings[sensor]),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ].slice(0, Object.values(selectedSensors).filter(Boolean).length),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'IoT Sensor Data - Chart.js Demo',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="h5" component="h2">
            📊 Chart.js Demo
          </Typography>
          <Chip label="Interactive" color="primary" size="small" />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Explore IoT sensor data with interactive charts. Toggle sensors on/off to focus on specific data.
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
              <Tab label="Bar Chart" />
              <Tab label="Doughnut Chart" />
            </Tabs>

            {activeTab === 0 && (
              <Box height={400}>
                <Line data={lineChartData} options={chartOptions} />
              </Box>
            )}

            {activeTab === 1 && (
              <Box height={400}>
                <Bar data={barChartData} options={barOptions} />
              </Box>
            )}

            {activeTab === 2 && (
              <Box height={400}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ChartJSDemo;
