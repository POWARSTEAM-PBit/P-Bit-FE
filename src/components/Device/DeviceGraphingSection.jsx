// src/components/Device/DeviceGraphingSection.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
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
  humidity: null,
  light: null,
  sound: null,
  battery: null,
});

export default function DeviceGraphingSection() {
  const [paused, setPaused] = useState(false);
  const [seriesShown, setSeriesShown] = useState({
    temperature: true,
    humidity: true,
    light: true,
    sound: true,
    battery: false,
  });

  const [metric, setMetric] = useState('temperature'); // default primary y-axis choice
  const bufferRef = useRef([]); // in-memory ring buffer
  const [data, setData] = useState([]);

  useEffect(() => {
    // subscription to BLE readings
    const off = subscribe((r) => {
      if (paused) return;

      const point = makeEmptyPoint(r.ts || Date.now());
      point.temperature = r.temp ?? r.air_temp ?? r.soil_temp ?? null;
      point.humidity    = r.hum ?? r.air_hum ?? r.soil_hum ?? null;
      point.light       = r.ldr ?? null;
      point.sound       = r.mic ?? null;
      point.battery     = r.batt ?? null;

      // push to ring buffer
      const buf = bufferRef.current.slice(0); // shallow copy to avoid mutating same array
      buf.push(point);
      if (buf.length > WINDOW_SIZE) buf.splice(0, buf.length - WINDOW_SIZE);
      bufferRef.current = buf;
      setData(buf);
    });
    return off;
  }, [paused]);

  const handleToggle = (key) => {
    setSeriesShown((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMetricChange = (_, val) => {
    if (val) setMetric(val);
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

  // Choose visible keys
  const visibleKeys = useMemo(() => (
    Object.entries(seriesShown).filter(([k, v]) => v).map(([k]) => k)
  ), [seriesShown]);

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <ShowChartIcon />
          <Typography variant="h6">Live Graph (BLE)</Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={seriesShown.temperature}
                onChange={() => handleToggle('temperature')}
              />
            }
            label="Temp"
          />
          <FormControlLabel
            control={
              <Switch
                checked={seriesShown.humidity}
                onChange={() => handleToggle('humidity')}
              />
            }
            label="Hum"
          />
          <FormControlLabel
            control={
              <Switch
                checked={seriesShown.light}
                onChange={() => handleToggle('light')}
              />
            }
            label="Light"
          />
          <FormControlLabel
            control={
              <Switch
                checked={seriesShown.sound}
                onChange={() => handleToggle('sound')}
              />
            }
            label="Sound"
          />
          <FormControlLabel
            control={
              <Switch
                checked={seriesShown.battery}
                onChange={() => handleToggle('battery')}
              />
            }
            label="Battery"
          />
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            exclusive
            value={metric}
            onChange={handleMetricChange}
          >
            <ToggleButton value="temperature">Temp</ToggleButton>
            <ToggleButton value="humidity">Hum</ToggleButton>
            <ToggleButton value="light">Light</ToggleButton>
            <ToggleButton value="sound">Sound</ToggleButton>
            <ToggleButton value="battery">Batt</ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="outlined"
            startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
            onClick={() => setPaused(p => !p)}
          >
            {paused ? 'Resume' : 'Pause'}
          </Button>

          <Button variant="text" startIcon={<RestartAltIcon />} onClick={clearData}>
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

            {/* Primary metric drawn thicker */}
            {seriesShown[metric] && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={metric}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Other visible series */}
            {visibleKeys.filter(k => k !== metric).map((k) => (
              <Line
                key={k}
                yAxisId="left"
                type="monotone"
                dataKey={k}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
