import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import { useClassroom } from '../../contexts/ClassroomContext';
import client from '../../api/client';
import styles from "./DeviceGraphingSection.module.css";

const DeviceGraphingSection = ({ deviceId, classroomId }) => {
  const { isLoggedIn } = useAuth();
  const { getAnonymousSession } = useClassroom();
  
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [graphs, setGraphs] = useState([
    {
      id: 1,
      type: 'line',
      title: 'Sensor Data Over Time',
      selectedSensors: {
        temperature: true,
        humidity: true,
        light: false,
        sound: false
      },
      colors: {
        temperature: '#ff6b6b',
        humidity: '#4ecdc4',
        light: '#ffe66d',
        sound: '#a8e6cf'
      }
    }
  ]);
  const [nextGraphId, setNextGraphId] = useState(2);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingGraph, setEditingGraph] = useState(null);

  const timeRanges = [
    { value: '5m', label: 'Last 5 minutes' },
    { value: '30m', label: 'Last 30 minutes' },
    { value: '1h', label: 'Last hour' },
    { value: '6h', label: 'Last 6 hours' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last week' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const chartTypes = [
    { value: 'line', label: 'Line Chart', description: 'Shows trends over time' },
    { value: 'bar', label: 'Bar Chart', description: 'Compares values at different times' },
    { value: 'area', label: 'Area Chart', description: 'Shows cumulative data' },
    { value: 'scatter', label: 'Scatter Plot', description: 'Shows correlation between sensors' },
    { value: 'composed', label: 'Composed Chart', description: 'Combines line and bar charts' },
    { value: 'pie', label: 'Pie Chart', description: 'Shows data distribution' },
    { value: 'radar', label: 'Radar Chart', description: 'Multi-dimensional comparison' }
  ];

  const sensors = [
    { key: 'temperature', label: 'Temperature (°C)', color: '#ff6b6b' },
    { key: 'humidity', label: 'Humidity (%)', color: '#4ecdc4' },
    { key: 'light', label: 'Light (lux)', color: '#ffe66d' },
    { key: 'sound', label: 'Sound (dB)', color: '#a8e6cf' }
  ];

  const getTimeRangeDates = (range) => {
    const now = new Date();
    
    if (range === 'custom' && useCustomRange && customStartDate && customEndDate) {
      return {
        start: customStartDate.toISOString(),
        end: customEndDate.toISOString()
      };
    }
    
    const ranges = {
      '5m': 5 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    const startTime = new Date(now.getTime() - ranges[range]);
    return {
      start: startTime.toISOString(),
      end: now.toISOString()
    };
  };

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const timeRangeDates = getTimeRangeDates(timeRange);
      let response;

      if (isLoggedIn) {
        response = await client.get(`/device/${deviceId}/data`, {
          params: {
            start_time: timeRangeDates.start,
            end_time: timeRangeDates.end,
            limit: 500
          }
        });
      } else {
        const anonymousSession = getAnonymousSession();
        if (anonymousSession && classroomId) {
          response = await client.get(`/device/${deviceId}/data/anonymous`, {
            params: {
              class_id: classroomId,
              first_name: anonymousSession.first_name,
              pin_code: anonymousSession.pin_code,
              start_time: timeRangeDates.start,
              end_time: timeRangeDates.end,
              limit: 500
            }
          });
        } else {
          throw new Error('Authentication required');
        }
      }

      if (response.data.success) {
        const transformedData = response.data.data.data.map(item => ({
          timestamp: new Date(item.timestamp).getTime(),
          time: new Date(item.timestamp).toLocaleTimeString(),
          date: new Date(item.timestamp).toLocaleDateString(),
          temperature: item.temperature,
          humidity: item.humidity,
          light: item.light,
          sound: item.sound
        })).reverse();

        setChartData(transformedData);
      } else {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err.response?.data?.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [deviceId, classroomId, timeRange, useCustomRange, customStartDate, customEndDate, isLoggedIn, getAnonymousSession]);

  useEffect(() => {
    if (deviceId) {
      fetchChartData();
    }
  }, [fetchChartData]);

  const addGraph = () => {
    const newGraph = {
      id: nextGraphId,
      type: 'line',
      title: `Graph ${nextGraphId}`,
      selectedSensors: {
        temperature: true,
        humidity: false,
        light: false,
        sound: false
      },
      colors: {
        temperature: '#ff6b6b',
        humidity: '#4ecdc4',
        light: '#ffe66d',
        sound: '#a8e6cf'
      }
    };
    setGraphs(prev => [...prev, newGraph]);
    setNextGraphId(prev => prev + 1);
  };

  const removeGraph = (graphId) => {
    if (graphs.length > 1) {
      setGraphs(prev => prev.filter(graph => graph.id !== graphId));
    }
  };

  const updateGraph = (graphId, updates) => {
    setGraphs(prev => prev.map(graph => 
      graph.id === graphId ? { ...graph, ...updates } : graph
    ));
  };

  const openConfigDialog = (graph) => {
    setEditingGraph(graph);
    setConfigDialogOpen(true);
  };

  const closeConfigDialog = () => {
    setConfigDialogOpen(false);
    setEditingGraph(null);
  };

  const saveGraphConfig = () => {
    if (editingGraph) {
      updateGraph(editingGraph.id, editingGraph);
      closeConfigDialog();
    }
  };

  const renderChart = (graph) => {
    if (chartData.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No data available for the selected time range
          </Typography>
        </Box>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    const getSensorLines = () => {
      return Object.entries(graph.selectedSensors)
        .filter(([sensor, selected]) => selected)
        .map(([sensor, selected]) => {
          const sensorInfo = sensors.find(s => s.key === sensor);
          return (
            <Line
              key={sensor}
              type="monotone"
              dataKey={sensor}
              stroke={graph.colors[sensor]}
              strokeWidth={2}
              name={sensorInfo.label}
              dot={false}
            />
          );
        });
    };

    const getSensorBars = () => {
      return Object.entries(graph.selectedSensors)
        .filter(([sensor, selected]) => selected)
        .map(([sensor, selected]) => {
          const sensorInfo = sensors.find(s => s.key === sensor);
          return (
            <Bar
              key={sensor}
              dataKey={sensor}
              fill={graph.colors[sensor]}
              name={sensorInfo.label}
            />
          );
        });
    };

    const getSensorAreas = () => {
      return Object.entries(graph.selectedSensors)
        .filter(([sensor, selected]) => selected)
        .map(([sensor, selected]) => {
          const sensorInfo = sensors.find(s => s.key === sensor);
          return (
            <Area
              key={sensor}
              type="monotone"
              dataKey={sensor}
              stackId="1"
              stroke={graph.colors[sensor]}
              fill={graph.colors[sensor]}
              name={sensorInfo.label}
            />
          );
        });
    };

    const getSensorScatters = () => {
      return Object.entries(graph.selectedSensors)
        .filter(([sensor, selected]) => selected)
        .map(([sensor, selected]) => {
          const sensorInfo = sensors.find(s => s.key === sensor);
          return (
            <Scatter
              key={sensor}
              dataKey={sensor}
              fill={graph.colors[sensor]}
              name={sensorInfo.label}
            />
          );
        });
    };

    switch (graph.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(value, payload) => {
                if (payload && payload[0]) {
                  return new Date(payload[0].payload.timestamp).toLocaleString();
                }
                return value;
              }} />
              <Legend />
              {getSensorLines()}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(value, payload) => {
                if (payload && payload[0]) {
                  return new Date(payload[0].payload.timestamp).toLocaleString();
                }
                return value;
              }} />
              <Legend />
              {getSensorBars()}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(value, payload) => {
                if (payload && payload[0]) {
                  return new Date(payload[0].payload.timestamp).toLocaleString();
                }
                return value;
              }} />
              <Legend />
              {getSensorAreas()}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(value, payload) => {
                if (payload && payload[0]) {
                  return new Date(payload[0].payload.timestamp).toLocaleString();
                }
                return value;
              }} />
              <Legend />
              {getSensorScatters()}
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(value, payload) => {
                if (payload && payload[0]) {
                  return new Date(payload[0].payload.timestamp).toLocaleString();
                }
                return value;
              }} />
              <Legend />
              {getSensorBars()}
              {getSensorLines()}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = Object.entries(graph.selectedSensors)
          .filter(([sensor, selected]) => selected)
          .map(([sensor, selected]) => {
            const sensorInfo = sensors.find(s => s.key === sensor);
            const avgValue = chartData.reduce((sum, item) => sum + (item[sensor] || 0), 0) / chartData.length;
            return {
              name: sensorInfo.label,
              value: avgValue,
              color: graph.colors[sensor]
            };
          });

        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radar':
        const radarData = Object.entries(graph.selectedSensors)
          .filter(([sensor, selected]) => selected)
          .map(([sensor, selected]) => {
            const sensorInfo = sensors.find(s => s.key === sensor);
            const avgValue = chartData.reduce((sum, item) => sum + (item[sensor] || 0), 0) / chartData.length;
            return {
              subject: sensorInfo.label,
              A: avgValue,
              fullMark: 100
            };
          });

        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar name="Average" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Visualization
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => {
                  setTimeRange(e.target.value);
                  if (e.target.value === 'custom') {
                    setUseCustomRange(true);
                  } else {
                    setUseCustomRange(false);
                  }
                }}
              >
                {timeRanges.map((range) => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {timeRange === 'custom' && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={customStartDate}
                  onChange={setCustomStartDate}
                  renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={customEndDate}
                  onChange={setCustomEndDate}
                  renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              onClick={fetchChartData}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              onClick={addGraph}
              startIcon={<AddIcon />}
              fullWidth
            >
              Add Graph
            </Button>
          </Grid>
        </Grid>

        {/* Graphs */}
        {graphs.map((graph, index) => (
          <Accordion key={graph.id} defaultExpanded={index === 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {graph.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfigDialog(graph);
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                  {graphs.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGraph(graph.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ minHeight: 300 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  renderChart(graph)
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        {chartData.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Showing {chartData.length} data points for {timeRanges.find(r => r.value === timeRange)?.label}
          </Typography>
        )}

        {/* Configuration Dialog */}
        <Dialog open={configDialogOpen} onClose={closeConfigDialog} maxWidth="md" fullWidth>
          <DialogTitle>Configure Graph</DialogTitle>
          <DialogContent>
            {editingGraph && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Graph Title"
                    value={editingGraph.title}
                    onChange={(e) => setEditingGraph({ ...editingGraph, title: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Chart Type</InputLabel>
                    <Select
                      value={editingGraph.type}
                      label="Chart Type"
                      onChange={(e) => setEditingGraph({ ...editingGraph, type: e.target.value })}
                    >
                      {chartTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box>
                            <Typography variant="body2">{type.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {type.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Select Sensors
                  </Typography>
                  <Grid container spacing={1}>
                    {sensors.map((sensor) => (
                      <Grid item key={sensor.key}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingGraph.selectedSensors[sensor.key]}
                              onChange={(e) => {
                                const newSelectedSensors = {
                                  ...editingGraph.selectedSensors,
                                  [sensor.key]: e.target.checked
                                };
                                setEditingGraph({ ...editingGraph, selectedSensors: newSelectedSensors });
                              }}
                            />
                          }
                          label={sensor.label}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeConfigDialog}>Cancel</Button>
            <Button onClick={saveGraphConfig} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </LocalizationProvider>
  );
};

export default DeviceGraphingSection;