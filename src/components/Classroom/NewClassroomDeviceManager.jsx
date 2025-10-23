import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isConnected, startRecordingAfterDeviceAdded } from '../../ble';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Wifi as WifiIcon,
  Battery20 as BatteryLowIcon,
  Battery50 as BatteryMediumIcon,
  Battery90 as BatteryHighIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Bluetooth as BluetoothIcon,
  BluetoothConnected as BluetoothConnectedIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useGroup } from '../../contexts/GroupContext';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';

// Import BLE functionality
import {
  connectBLEFiltered, connectBLECompatible, stop as stopBLE,
  isConnected as isBLEConnected, subscribe as subscribeBLE
} from '../../ble';

const NewClassroomDeviceManager = ({ classroomId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getAnonymousSession } = useClassroom();
  const { 
    groups, 
    classroomStudents, 
    getClassroomGroups, 
    getClassroomStudents 
  } = useGroup();

  // State
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // BLE state
  const [bleConnected, setBleConnected] = useState(isConnected());
  const [bleName, setBleName] = useState(sessionStorage.getItem('pbit.deviceName') || 'P-BIT');
  const [bleReading, setBleReading] = useState({ temp: null, hum: null, ldr: null, mic: null, batt: null });

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [assignmentType, setAssignmentType] = useState('public');
  const [assignmentTarget, setAssignmentTarget] = useState('');

  // Monitor BLE connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = isConnected();
      setBleConnected(connected);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // BLE connection monitoring and data subscription
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

  // Load classroom data
  useEffect(() => {
    if (classroomId) {
      getClassroomDevices();
      getClassroomGroups(classroomId);
      getClassroomStudents(classroomId);
    }
  }, [classroomId, getClassroomGroups, getClassroomStudents]);

  // API calls
  const getClassroomDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(`/classroom-device/classroom/${classroomId}/devices`);
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch classroom devices';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addDeviceToClassroom = async (deviceName, assignmentType, assignmentId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.post(`/classroom-device/classroom/${classroomId}/add`, {
        device_name: deviceName,
        assignment_type: assignmentType,
        assignment_id: assignmentId
      });

      if (response.data.success) {
        await getClassroomDevices();
        // Start recording BLE data now that device is added to classroom
        startRecordingAfterDeviceAdded();
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateDeviceAssignment = async (deviceId, assignmentType, assignmentId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.put(`/classroom-device/${deviceId}/assignment`, {
        assignment_type: assignmentType,
        assignment_id: assignmentId
      });
      
      if (response.data.success) {
        await getClassroomDevices();
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update device assignment';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const removeDeviceFromClassroom = async (deviceId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.delete(`/classroom-device/${deviceId}`);
      
      if (response.data.success) {
        await getClassroomDevices();
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to remove device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // BLE connection methods
  const connectRecommended = async () => {
    try { 
      const n = await connectBLEFiltered(); 
      setBleName(n || 'P-BIT'); 
      setBleConnected(isBLEConnected()); 
    }
    catch (e) { 
      console.error(e); 
      setBleConnected(false); 
    }
  };

  const connectCompatible = async () => {
    try { 
      const n = await connectBLECompatible(); 
      setBleName(n || 'P-BIT'); 
      setBleConnected(isBLEConnected()); 
    }
    catch (e) { 
      console.error(e); 
      setBleConnected(false); 
    }
  };

  const disconnectBLE = () => {
    try {
      stopBLE(); 
    } finally { 
      setBleConnected(false); 
    } 
  };

  // Device management methods
  const handleAddDevice = async () => {
    if (!bleConnected) {
      setError('Please connect to a BLE device first');
      return;
    }

    // Check if device already exists
    const existingDevice = devices.find(device => 
      device.device_name === bleName
    );

    if (existingDevice) {
      setError(`Device '${bleName}' is already connected to this classroom. Please talk to your teacher or choose a different device.`);
      return;
    }

    // Determine assignment type based on user and groups
    let assignmentType = 'public';
    let assignmentId = null;

    if (user?.user_type === 'teacher') {
      // Teacher can choose assignment type
      setSelectedDevice({ device_name: bleName });
      setAssignmentType('public');
      setShowAssignmentDialog(true);
      return;
    } else {
      // Student - check if they're in a group
      const userGroups = groups.filter(group => 
        group.memberships?.some(membership => 
          membership.student_id === user?.user_id && 
          membership.student_type === 'registered'
        )
      );

      if (userGroups.length > 0) {
        // Auto-assign to first group
        assignmentType = 'group';
        assignmentId = userGroups[0].id;
      } else {
        // Ask student to choose
        setSelectedDevice({ device_name: bleName });
        setAssignmentType('public');
        setShowAssignmentDialog(true);
        return;
      }
    }

    // Add device with determined assignment
    const result = await addDeviceToClassroom(bleName, assignmentType, assignmentId);
    if (result.success) {
      setShowAddDialog(false);
    }
  };

  const handleViewDevice = (deviceId, deviceName) => {
    navigate(`/classroom/${classroomId}/device/${deviceId}`, { 
      state: { 
        fromClassroom: true, 
        deviceName: deviceName,
        isConnected: bleConnected && bleName === deviceName
      } 
    });
  };

  const handleEditAssignment = (device) => {
    setSelectedDevice(device);
    setAssignmentType(device.assignment.type);
    setAssignmentTarget(device.assignment.id || '');
    setShowAssignmentDialog(true);
  };

  const handleUpdateAssignment = async () => {
    if (!selectedDevice) return;

    const assignmentId = assignmentType === 'public' ? null : assignmentTarget;
    const result = await updateDeviceAssignment(
      selectedDevice.id, 
      assignmentType, 
      assignmentId
    );
    
    if (result.success) {
      setShowAssignmentDialog(false);
      setSelectedDevice(null);
      setAssignmentType('public');
      setAssignmentTarget('');
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to remove this device from the classroom? This will delete all recorded data.')) {
      await removeDeviceFromClassroom(deviceId);
    }
  };

  // Helper functions
  const getBatteryIcon = (batteryLevel) => {
    if (batteryLevel >= 80) return <BatteryHighIcon color="success" />;
    if (batteryLevel >= 30) return <BatteryMediumIcon color="warning" />;
    return <BatteryLowIcon color="error" />;
  };

  const getStatusIcon = (isActive) => {
    return isActive ? 
      <ActiveIcon color="success" /> : 
      <InactiveIcon color="error" />;
  };

  const getAssignmentInfo = (device) => {
    if (device.assignment.type === 'student') {
      const student = classroomStudents.find(s => s.id === device.assignment.id);
      return {
        type: 'student',
        name: student ? student.first_name || student.name : 'Unknown Student',
        icon: <PersonIcon />
      };
    } else if (device.assignment.type === 'group') {
      const group = groups.find(g => g.id === device.assignment.id);
      return {
        type: 'group',
        name: group ? group.name : 'Unknown Group',
        icon: <GroupIcon />
      };
    }
    return {
      type: 'public',
      name: 'Public',
      icon: <WifiIcon />
    };
  };

  const isTeacher = user?.user_type === 'teacher';

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            📱 Classroom Devices
          </Typography>
          {isTeacher && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddDialog(true)}
              disabled={loading}
            >
              Add Device
            </Button>
          )}
        </Box>

        {/* BLE Connection Panel */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
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
                  <Button 
                    variant="contained" 
                    onClick={handleAddDevice}
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add to Classroom'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewDevice('live', bleName)}
                  >
                    View Live
                  </Button>
                  <Button variant="outlined" color="error" startIcon={<LinkOffIcon />} onClick={disconnectBLE}>
                    Disconnect
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Devices List */}
        {devices.length === 0 ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            py={6}
            minHeight="200px"
            width="100%"
          >
            <WifiIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom textAlign="center">
              No devices connected to this classroom
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} textAlign="center">
              Connect via Bluetooth to add devices to this classroom
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {devices.map((device) => {
              const assignment = getAssignmentInfo(device);
              const isCurrentlyConnected = bleConnected && bleName === device.device_name;

              return (
                <Grid item xs={12} sm={6} md={4} key={device.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => handleViewDevice(device.id, device.device_name)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" component="h3">
                          {device.device_name}
                        </Typography>
                        <Box display="flex" gap={1}>
                          <Tooltip title={isCurrentlyConnected ? 'Currently Connected' : (device.is_active ? 'Active' : 'Inactive')}>
                            {getStatusIcon(isCurrentlyConnected || device.is_active)}
                          </Tooltip>
                          <Tooltip title={`Battery: ${device.battery_level}%`}>
                            {getBatteryIcon(device.battery_level)}
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      {/* Added By Info */}
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Added by: {device.added_by.name}
                        </Typography>
                      </Box>

                      {/* Assignment Info */}
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        {assignment.icon}
                        <Typography variant="body2">
                          {assignment.name}
                        </Typography>
                        {assignment.type !== 'public' && (
                          <Chip 
                            label={assignment.type} 
                            size="small" 
                            color="primary"
                          />
                        )}
                      </Box>
                      
                      <Box display="flex" gap={1}>
                        <Chip 
                          label={isCurrentlyConnected ? 'Connected' : (device.is_active ? 'Active' : 'Inactive')} 
                          color={isCurrentlyConnected ? 'success' : (device.is_active ? 'success' : 'error')}
                          size="small"
                        />
                        <Chip 
                          label={`${device.battery_level}%`} 
                          color={device.battery_level > 30 ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDevice(device.id, device.device_name);
                        }}
                      >
                        {isCurrentlyConnected ? 'View Live' : 'View Data'}
                      </Button>
                      {isTeacher && (
                        <>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAssignment(device);
                            }}
                            disabled={loading}
                          >
                            Edit Assignment
                          </Button>
                          <Button
                            size="small"
                            startIcon={<RemoveIcon />}
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDevice(device.id);
                            }}
                            disabled={loading}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      {/* Add Device Dialog */}
      <Dialog 
        open={showAddDialog} 
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Device to Classroom</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Connect to a BLE device first, then click "Add to Classroom" to add it to this classroom.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              The device will be available to all students in this classroom.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddDevice} 
            variant="contained"
            disabled={!bleConnected || loading}
          >
            {loading ? 'Adding...' : 'Add Device'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog 
        open={showAssignmentDialog} 
        onClose={() => setShowAssignmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Device Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedDevice && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Device: {selectedDevice.device_name}
                </Typography>
              </Box>
            )}

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Assignment Type</InputLabel>
              <Select
                value={assignmentType}
                onChange={(e) => {
                  setAssignmentType(e.target.value);
                  setAssignmentTarget('');
                }}
                label="Assignment Type"
              >
                <MenuItem value="public">Public (Available to all students)</MenuItem>
                <MenuItem value="student">Assign to Specific Student</MenuItem>
                <MenuItem value="group">Assign to Group</MenuItem>
              </Select>
            </FormControl>

            {assignmentType === 'student' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={assignmentTarget}
                  onChange={(e) => setAssignmentTarget(e.target.value)}
                  label="Select Student"
                >
                  {classroomStudents.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.first_name || student.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {assignmentType === 'group' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Group</InputLabel>
                <Select
                  value={assignmentTarget}
                  onChange={(e) => setAssignmentTarget(e.target.value)}
                  label="Select Group"
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignmentDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateAssignment}
            variant="contained"
            disabled={loading || (assignmentType !== 'public' && !assignmentTarget)}
          >
            {loading ? 'Updating...' : 'Update Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewClassroomDeviceManager;
