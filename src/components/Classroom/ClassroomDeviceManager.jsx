// src/components/Classroom/ClassroomDeviceManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Alert, Grid, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Chip, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Remove as RemoveIcon, Edit as EditIcon, Visibility as ViewIcon,
  Wifi as WifiIcon, Battery20 as BatteryLowIcon, Battery50 as BatteryMediumIcon, Battery90 as BatteryHighIcon,
  CheckCircle as ActiveIcon, Cancel as InactiveIcon, Group as GroupIcon, Person as PersonIcon,
  Bluetooth as BluetoothIcon, Link as LinkIcon, LinkOff as LinkOffIcon
} from '@mui/icons-material';

import { useDevice } from '../../contexts/DeviceContext';
import { useGroup } from '../../contexts/GroupContext';

import {
  connectBLEFiltered, connectBLECompatible, stop as stopBLE,
  isConnected as isBLEConnected, subscribe as subscribeBLE
} from '../../ble';

const ClassroomDeviceManager = ({ classroomId }) => {
  const navigate = useNavigate();

  // backend-driven
  const {
    devices, classroomDevices, loading, error,
    getUserDevices, getClassroomDevices, assignDeviceToClassroom,
    unassignDeviceFromClassroom, updateDeviceAssignment, clearError
  } = useDevice();
  const { groups, classroomStudents, getClassroomGroups, getClassroomStudents } = useGroup();

  // assign/edit dialogs
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [assignmentType, setAssignmentType] = useState('unassigned');
  const [assignmentTarget, setAssignmentTarget] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editAssignmentType, setEditAssignmentType] = useState('unassigned');
  const [editAssignmentTarget, setEditAssignmentTarget] = useState('');

  // BLE state
  const [bleConnected, setBleConnected] = useState(isBLEConnected());
  const [bleName, setBleName] = useState(sessionStorage.getItem('pbit.deviceName') || 'P-BIT');
  const [bleReading, setBleReading] = useState({ temp: null, hum: null, ldr: null, mic: null, batt: null });

  // session devices (frontend-only list)
  const [sessionDevices, setSessionDevices] = useState([]);

  useEffect(() => {
    if (!classroomId) return;
    getUserDevices();
    getClassroomDevices(classroomId);
    getClassroomGroups(classroomId);
    getClassroomStudents(classroomId);
  }, [classroomId, getUserDevices, getClassroomDevices, getClassroomGroups, getClassroomStudents]);

  useEffect(() => {
    const off = subscribeBLE((r) => {
      setBleReading({
        temp: r.temp ?? r.air_temp ?? r.soil_temp ?? null,
        hum:  r.hum  ?? r.air_hum  ?? r.soil_hum  ?? null,
        ldr:  r.ldr ?? null,
        mic:  r.mic ?? null,
        batt: r.batt ?? null,
      });
      setBleConnected(true);
    });
    const t = setInterval(() => setBleConnected(isBLEConnected()), 1000);
    return () => { off && off(); clearInterval(t); };
  }, []);

  // helpers
  const getBatteryIcon = (batteryLevel) =>
    batteryLevel >= 80 ? <BatteryHighIcon color="success" /> :
    batteryLevel >= 30 ? <BatteryMediumIcon color="warning" /> :
                         <BatteryLowIcon color="error" />;
  const getStatusIcon = (isActive) => (isActive ? <ActiveIcon color="success" /> : <InactiveIcon color="error" />);
  const formatMacAddress = (mac) => (mac ? mac.toUpperCase() : '--');

  // actions (backend)
  const handleViewDevice = (deviceId, extraState = {}) => {
    navigate(`/classroom/${classroomId}/device/${deviceId}`, { state: { fromClassroom: true, ...extraState } });
  };
  const handleAssignDevice = async () => {
    if (!selectedDevice) return;
    const assignmentId = assignmentType === 'unassigned' ? null : assignmentTarget;
    const result = await assignDeviceToClassroom(selectedDevice, classroomId, assignmentType, assignmentId);
    if (result?.success) {
      setShowAssignDialog(false);
      setSelectedDevice(''); setAssignmentType('unassigned'); setAssignmentTarget('');
    }
  };
  const handleUnassignDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to unassign this device from the classroom?')) {
      await unassignDeviceFromClassroom(deviceId, classroomId);
    }
  };
  const handleEditAssignment = (device) => {
    setEditingDevice(device);
    setEditAssignmentType(device.assignment_type || 'unassigned');
    setEditAssignmentTarget(device.assignment_id || '');
    setShowEditDialog(true);
  };
  const handleUpdateAssignment = async () => {
    if (!editingDevice) return;
    const assignmentId = editAssignmentType === 'unassigned' ? null : editAssignmentTarget;
    const result = await updateDeviceAssignment(editingDevice.device_id, classroomId, editAssignmentType, assignmentId);
    if (result?.success) {
      setShowEditDialog(false);
      setEditingDevice(null); setEditAssignmentType('unassigned'); setEditAssignmentTarget('');
    }
  };

  // BLE actions + add session device
  const connectRecommended = async () => {
    try { const n = await connectBLEFiltered(); setBleName(n || 'P-BIT'); setBleConnected(isBLEConnected()); }
    catch (e) { console.error(e); setBleConnected(false); }
  };
  const connectCompatible = async () => {
    try { const n = await connectBLECompatible(); setBleName(n || 'P-BIT'); setBleConnected(isBLEConnected()); }
    catch (e) { console.error(e); setBleConnected(false); }
  };
  const disconnectBLE = () => { try { stopBLE(); } finally { setBleConnected(false); } };
  const addBleSessionDevice = () => {
    if (!bleConnected) return;
    const id = `ble:${Date.now()}`;
    setSessionDevices(prev => [...prev, {
      id,
      nickname: bleName || 'P-BIT',
      mac_address: '',
      is_active: true,
      battery_level: bleReading.batt ?? 0,
    }]);
  };

  const getAssignmentInfo = (device) => {
    if (device.assignment_type === 'student') {
      const s = classroomStudents.find(x => x.id === device.assignment_id);
      return { type: 'student', name: s ? (s.first_name || s.name) : 'Unknown Student', icon: <PersonIcon /> };
    }
    if (device.assignment_type === 'group') {
      const g = groups.find(x => x.id === device.assignment_id);
      return { type: 'group', name: g ? g.name : 'Unknown Group', icon: <GroupIcon /> };
    }
    return { type: 'unassigned', name: 'Unassigned', icon: <WifiIcon /> };
  };

  const availableDevices = devices.filter(d => !classroomDevices.some(cd => cd.device_id === d.id));

  return (
    <Box>

      {/* === Classroom Devices card (BLE panel is INSIDE) === */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">📱 Classroom Devices</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAssignDialog(true)}
            disabled={loading || availableDevices.length === 0}
          >
            Add Device to Classroom
          </Button>
        </Box>

        {/* --- BLE inline panel --- */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <BluetoothIcon color={bleConnected ? 'primary' : 'disabled'} />
              <Typography variant="subtitle1">Connect a P-BIT via Bluetooth</Typography>
              <Chip
                size="small"
                label={bleConnected ? `Connected: ${bleName}` : 'Not connected'}
                color={bleConnected ? 'success' : 'default'}
                variant={bleConnected ? 'filled' : 'outlined'}
                sx={{ ml: 1 }}
              />
            </Box>
            <Box display="flex" gap={1}>
              {!bleConnected ? (
                <>
                  <Button variant="contained" startIcon={<LinkIcon />} onClick={connectRecommended}>
                    Connect (P-BIT)
                  </Button>
                  <Button variant="outlined" onClick={connectCompatible}>Compatible</Button>
                </>
              ) : (
                <>
                  <Button variant="contained" onClick={addBleSessionDevice}>
                    Add as Classroom Device (Session)
                  </Button>
                  <Button variant="outlined" color="error" startIcon={<LinkOffIcon />} onClick={disconnectBLE}>
                    Disconnect
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Grid container spacing={2}>
            {[
              { k:'temp', label:'Temperature (°C)' },
              { k:'hum',  label:'Humidity (%)' },
              { k:'ldr',  label:'Light' },
              { k:'mic',  label:'Noise' },
              { k:'batt', label:'Battery (%)' },
            ].map(s => (
              <Grid item xs={12} sm={6} md={4} key={s.k}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h6" sx={{ mt: .5 }}>{bleReading[s.k] ?? '—'}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Typography variant="caption" sx={{ opacity:.7, display:'block', mt:1 }}>
            Open any device page — live charts will use this BLE stream automatically.
          </Typography>
        </Paper>
        {/* --- end BLE panel --- */}

        {error && (<Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>{error}</Alert>)}

        {/* unified list: session devices + backend devices */}
        <Grid container spacing={3}>
          {/* session devices (frontend-only) */}
          {sessionDevices.map(sd => (
            <Grid item xs={12} sm={6} md={4} key={sd.id}>
              <Card
                sx={{ cursor:'pointer', transition:'all .2s', '&:hover':{ transform:'translateY(-2px)', boxShadow:4 } }}
                onClick={() => handleViewDevice(sd.id, { liveOnly: true, name: sd.nickname })}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6">{sd.nickname}</Typography>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Active (session)"><ActiveIcon color="success" /></Tooltip>
                      <Tooltip title={`Battery: ${bleReading.batt ?? 0}%`}>
                        {getBatteryIcon(bleReading.batt ?? 0)}
                      </Tooltip>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Session Device (BLE) • MAC unavailable
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip label="Active" color="success" size="small" />
                    <Chip label={`${bleReading.batt ?? 0}%`} color={(bleReading.batt ?? 0) > 30 ? 'success' : 'error'} size="small" />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<ViewIcon />} onClick={(e) => {
                    e.stopPropagation();
                    handleViewDevice(sd.id, { liveOnly: true, name: sd.nickname });
                  }}>View Live</Button>
                  <Button size="small" startIcon={<RemoveIcon />} color="error" onClick={(e) => {
                    e.stopPropagation();
                    setSessionDevices(prev => prev.filter(x => x.id !== sd.id));
                  }}>Remove</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {/* backend devices (original) */}
          {classroomDevices.map((cd) => {
            const d = devices.find(x => x.id === cd.device_id);
            if (!d) return null;
            const assign = getAssignmentInfo(cd);
            return (
              <Grid item xs={12} sm={6} md={4} key={cd.id}>
                <Card
                  sx={{ cursor:'pointer', transition:'all .2s', '&:hover':{ transform:'translateY(-2px)', boxShadow:4 } }}
                  onClick={() => handleViewDevice(d.id)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6">{d.nickname}</Typography>
                      <Box display="flex" gap={1}>
                        <Tooltip title={d.is_active ? 'Active' : 'Inactive'}>{getStatusIcon(d.is_active)}</Tooltip>
                        <Tooltip title={`Battery: ${d.battery_level}%`}>{getBatteryIcon(d.battery_level)}</Tooltip>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      MAC: {formatMacAddress(d.mac_address)}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      {assign.icon}
                      <Typography variant="body2">{assign.name}</Typography>
                      <Chip label={assign.type} size="small" color={assign.type === 'unassigned' ? 'default' : 'primary'} />
                    </Box>
                    <Box display="flex" gap={1}>
                      <Chip label={d.is_active ? 'Active' : 'Inactive'} color={d.is_active ? 'success' : 'error'} size="small" />
                      <Chip label={`${d.battery_level}%`} color={d.battery_level > 30 ? 'success' : 'error'} size="small" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<ViewIcon />} onClick={(e) => { e.stopPropagation(); handleViewDevice(d.id); }}>
                      View Device
                    </Button>
                    <Button size="small" startIcon={<EditIcon />} onClick={(e) => { e.stopPropagation(); handleEditAssignment(cd); }} disabled={loading}>
                      Edit Assignment
                    </Button>
                    <Button size="small" startIcon={<RemoveIcon />} color="error" onClick={(e) => { e.stopPropagation(); handleUnassignDevice(cd.device_id); }} disabled={loading}>
                      Remove from Classroom
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* dialogs (unchanged) */}
      <Dialog open={showAssignDialog} onClose={() => setShowAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Device to Classroom</DialogTitle>
        <DialogContent>
          <Box sx={{ pt:2 }}>
            <FormControl fullWidth sx={{ mb:3 }}>
              <InputLabel>Select Device</InputLabel>
              <Select value={selectedDevice} onChange={(e)=>setSelectedDevice(e.target.value)} label="Select Device">
                {devices.filter(d => !classroomDevices.some(cd => cd.device_id === d.id)).map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.nickname} ({formatMacAddress(d.mac_address)})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb:3 }}>
              <InputLabel>Assignment Type</InputLabel>
              <Select value={assignmentType} onChange={(e)=>{ setAssignmentType(e.target.value); setAssignmentTarget(''); }} label="Assignment Type">
                <MenuItem value="unassigned">Unassigned (Available to all students)</MenuItem>
                <MenuItem value="student">Assign to Specific Student</MenuItem>
                <MenuItem value="group">Assign to Group</MenuItem>
              </Select>
            </FormControl>

            {assignmentType === 'student' && (
              <FormControl fullWidth sx={{ mb:3 }}>
                <InputLabel>Select Student</InputLabel>
                <Select value={assignmentTarget} onChange={(e)=>setAssignmentTarget(e.target.value)} label="Select Student">
                  {classroomStudents.map(s => <MenuItem key={s.id} value={s.id}>{s.first_name || s.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {assignmentType === 'group' && (
              <FormControl fullWidth sx={{ mb:3 }}>
                <InputLabel>Select Group</InputLabel>
                <Select value={assignmentTarget} onChange={(e)=>setAssignmentTarget(e.target.value)} label="Select Group">
                  {groups.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignDevice} variant="contained" disabled={loading || !selectedDevice}>
            {loading ? 'Adding...' : 'Add Device'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Device Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt:2 }}>
            {editingDevice && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb:2 }}>
                Device: {editingDevice.device?.nickname} ({formatMacAddress(editingDevice.device?.mac_address)})
              </Typography>
            )}

            <FormControl fullWidth sx={{ mb:3 }}>
              <InputLabel>Assignment Type</InputLabel>
              <Select value={editAssignmentType} onChange={(e)=>{ setEditAssignmentType(e.target.value); setEditAssignmentTarget(''); }} label="Assignment Type">
                <MenuItem value="unassigned">Unassigned (Available to all students)</MenuItem>
                <MenuItem value="student">Assign to Specific Student</MenuItem>
                <MenuItem value="group">Assign to Group</MenuItem>
              </Select>
            </FormControl>

            {editAssignmentType === 'student' && (
              <FormControl fullWidth sx={{ mb:3 }}>
                <InputLabel>Select Student</InputLabel>
                <Select value={editAssignmentTarget} onChange={(e)=>setEditAssignmentTarget(e.target.value)} label="Select Student">
                  {classroomStudents.map(s => <MenuItem key={s.id} value={s.id}>{s.first_name || s.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {editAssignmentType === 'group' && (
              <FormControl fullWidth sx={{ mb:3 }}>
                <InputLabel>Select Group</InputLabel>
                <Select value={editAssignmentTarget} onChange={(e)=>setEditAssignmentTarget(e.target.value)} label="Select Group">
                  {groups.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateAssignment} variant="contained"
                  disabled={loading || (editAssignmentType !== 'unassigned' && !editAssignmentTarget)}>
            {loading ? 'Updating...' : 'Update Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassroomDeviceManager;
