import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  Analytics, 
  ShowChart, 
  Science,
  DeviceHub,
  WifiTethering,
  Sensors
} from '@mui/icons-material';

// Import the demo components
import ChartJSDemo from './ChartJSDemo';
import RechartsDemo from './RechartsDemo';
import PlotlyDemo from './PlotlyDemo';

const IoTDataVisualization = () => {
  const [activeDemo, setActiveDemo] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveDemo(newValue);
  };

  const demos = [
    {
      label: 'Chart.js',
      component: <ChartJSDemo />,
      icon: <ShowChart />,
      description: 'Lightweight & Interactive',
      color: 'primary'
    },
    {
      label: 'Recharts',
      component: <RechartsDemo />,
      icon: <Analytics />,
      description: 'React Native Ready',
      color: 'secondary'
    },
    {
      label: 'Plotly.js',
      component: <PlotlyDemo />,
      icon: <Science />,
      description: 'Scientific & 3D',
      color: 'error'
    }
  ];

  return (
    <Paper elevation={2} className="classroomContent" style={{ marginTop: 24 }}>
      <Box className="contentHeader" display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <DeviceHub color="primary" />
          <Typography variant="h5" component="h2" className="contentTitle">
            IoT Device Data Visualization
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip 
            icon={<Sensors />} 
            label="Live Data" 
            color="success" 
            size="small" 
          />
          <Chip 
            icon={<WifiTethering />} 
            label="Connected" 
            color="primary" 
            size="small" 
          />
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Demo Mode:</strong> These are three different graphing library demonstrations for IoT sensor data. 
          In production, students would see real-time data from their assigned IoT devices measuring temperature, 
          thermometer, humidity, moisture, light, and sound levels.
        </Typography>
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <DeviceHub color="primary" />
                <Box>
                  <Typography variant="h6">Device Status</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connected & Active
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Sensors color="secondary" />
                <Box>
                  <Typography variant="h6">Sensors Active</Typography>
                  <Typography variant="body2" color="text.secondary">
                    6/6 sensors online
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <WifiTethering color="success" />
                <Box>
                  <Typography variant="h6">Data Points</Typography>
                  <Typography variant="body2" color="text.secondary">
                    1,200+ readings today
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs 
        value={activeDemo} 
        onChange={handleTabChange} 
        variant="fullWidth"
        sx={{ mb: 3 }}
      >
        {demos.map((demo, index) => (
          <Tab
            key={index}
            icon={demo.icon}
            label={
              <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                <Typography variant="body2">{demo.label}</Typography>
                <Chip 
                  label={demo.description} 
                  size="small" 
                  color={demo.color}
                  variant="outlined"
                />
              </Box>
            }
            iconPosition="top"
          />
        ))}
      </Tabs>

      <Box>
        {demos[activeDemo].component}
      </Box>

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Ready for Production:</strong> Each demo shows different capabilities for visualizing IoT sensor data. 
          Choose the library that best fits your needs for the final implementation.
        </Typography>
      </Alert>
    </Paper>
  );
};

export default IoTDataVisualization;
