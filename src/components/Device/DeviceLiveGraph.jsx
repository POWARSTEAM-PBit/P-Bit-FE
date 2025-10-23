// src/components/Device/DeviceLiveGraph.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
} from '@mui/material';
import {
  ShowChart as ShowChartIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';

import { subscribe } from '../../ble';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Live graph section fed by BLE readings directly (no backend required).
 * - Keeps a sliding window of N points (default ~60 seconds if 1Hz updates).
 * - You can adjust WINDOW_SIZE to match your FW notify rate.
 * - Toggle which series to display (temperature/humidity/light/sound/battery).
 */

const WINDOW_SIZE = 300; // keep last 300 points (e.g., ~5 mins @ 1 Hz, or adjust as needed)

const makeEmptyPoint = (t) => ({
  t,
  temperature: null,
  thermometer: null,
  humidity: null,
  moisture: null,
  light: null,
  sound: null,
});

export default function DeviceLiveGraph({ activeTab, bleConnected }) {
  const [paused, setPaused] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState('temperature'); // default selected sensor
  const bufferRef = useRef([]); // in-memory ring buffer
  const [data, setData] = useState([]);

  useEffect(() => {
    // Only subscribe to BLE readings when on Live Data tab (activeTab === 0)
    if (activeTab !== 0) return;

    // subscription to BLE readings
    const off = subscribe((r) => {
      if (paused) return;

      // Debug: log the raw BLE reading to help identify sound sensor issue
      console.log('BLE Reading (Graph):', r);

      const point = makeEmptyPoint(r.ts || Date.now());
      point.temperature = r.temp ?? r.air_temp ?? null;
      point.thermometer = r.soil_temp ?? null; // Only use soil_temp if available, otherwise null
      point.humidity    = r.hum ?? r.air_hum ?? null;
      point.moisture    = r.soil_hum ?? null; // Only use soil_hum if available, otherwise null
      point.light       = r.ldr ?? null;
      point.sound       = r.mic ?? null;

      // push to ring buffer
      const buf = bufferRef.current.slice(0); // shallow copy to avoid mutating same array
      buf.push(point);
      if (buf.length > WINDOW_SIZE) buf.splice(0, buf.length - WINDOW_SIZE);
      bufferRef.current = buf;
      setData(buf);
    });
    return off;
  }, [paused, activeTab]);

  const handleSensorSelect = (sensor) => {
    setSelectedSensor(sensor);
  };

  const clearData = () => {
    bufferRef.current = [];
    setData([]);
  };

  // X-axis formatter
  const timeFmt = (t) => {
    if (!t) return '';
    const d = new Date(t);
    return d.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
  };

  // Define sensor options
  const sensorOptions = [
    { key: 'temperature', label: 'Temperature', color: '#8884d8' },
    { key: 'thermometer', label: 'Thermometer', color: '#82ca9d' },
    { key: 'humidity', label: 'Humidity', color: '#ffc658' },
    { key: 'moisture', label: 'Moisture', color: '#ff7300' },
    { key: 'light', label: 'Light', color: '#00ff00' },
    { key: 'sound', label: 'Sound', color: '#ff00ff' },
  ];

  // Only render when on Live Data tab and BLE is connected
  if (activeTab !== 0 || !bleConnected) return null;

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ minWidth: 0 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <ShowChartIcon />
          <Typography variant="h6">Live Graph</Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" sx={{ flex: 1, minWidth: 0 }}>
          {sensorOptions.map((sensor) => (
            <Button
              key={sensor.key}
              variant={selectedSensor === sensor.key ? "contained" : "outlined"}
              size="small"
              onClick={() => handleSensorSelect(sensor.key)}
              sx={{
                minWidth: 'auto',
                px: 1.5,
                fontSize: '0.75rem',
                backgroundColor: selectedSensor === sensor.key ? sensor.color : 'transparent',
                borderColor: sensor.color,
                color: selectedSensor === sensor.key ? 'white' : sensor.color,
                '&:hover': {
                  backgroundColor: selectedSensor === sensor.key ? sensor.color : `${sensor.color}20`,
                  borderColor: sensor.color,
                }
              }}
            >
              {sensor.label}
            </Button>
          ))}
        </Box>

        <Box display="flex" alignItems="center" gap={1} flexWrap="nowrap">
          <Button
            variant="outlined"
            startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
            onClick={() => setPaused(p => !p)}
            sx={{ minWidth: '80px', flexShrink: 0 }}
          >
            {paused ? 'Resume' : 'Pause'}
          </Button>

          <Button 
            variant="text" 
            startIcon={<RestartAltIcon />} 
            onClick={clearData}
            sx={{ flexShrink: 0 }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              tickFormatter={timeFmt}
              minTickGap={24}
            />
            <YAxis
              yAxisId="left"
              domain={['auto', 'auto']}
            />
            <RTooltip
              labelFormatter={(label) => timeFmt(label)}
            />
            <Legend />

            {/* Only show the selected sensor */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={selectedSensor}
              stroke={sensorOptions.find(s => s.key === selectedSensor)?.color || '#8884d8'}
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
              name={sensorOptions.find(s => s.key === selectedSensor)?.label || selectedSensor}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
