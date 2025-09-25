import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
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
  Person as PersonIcon
} from '@mui/icons-material';
import { useDevice } from '../../contexts/DeviceContext';
import { useGroup } from '../../contexts/GroupContext';

const ClassroomDeviceManager = ({ classroomId }) => {
  const navigate = useNavigate();
  
  const { 
    devices, 
    classroomDevices, 
    loading, 
    error, 
    getUserDevices, 
    getClassroomDevices, 
    assignDeviceToClassroom, 
    unassignDeviceFromClassroom, 
    updateDeviceAssignment,
    clearError 
  } = useDevice();

  const { 
    groups, 
    classroomStudents, 
    getClassroomGroups, 
    getClassroomStudents 
  } = useGroup();

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [assignmentType, setAssignmentType] = useState('unassigned');
  const [assignmentTarget, setAssignmentTarget] = useState('');
  
  // Edit assignment dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editAssignmentType, setEditAssignmentType] = useState('unassigned');
  const [editAssignmentTarget, setEditAssignmentTarget] = useState('');

  useEffect(() => {
    if (classroomId) {
      getUserDevices();
      getClassroomDevices(classroomId);
      getClassroomGroups(classroomId);
      getClassroomStudents(classroomId);
    }
  }, [classroomId, getUserDevices, getClassroomDevices, getClassroomGroups, getClassroomStudents]);

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

  const formatMacAddress = (mac) => {
    return mac.toUpperCase().replace(/:/g, ':');
  };

  const handleViewDevice = (deviceId) => {
    navigate(`/classroom/${classroomId}/device/${deviceId}`, {
      state: { fromClassroom: true }
    });
  };

  const handleAssignDevice = async () => {
    if (!selectedDevice) return;

    const assignmentId = assignmentType === 'unassigned' ? null : assignmentTarget;
    const result = await assignDeviceToClassroom(selectedDevice, classroomId, assignmentType, assignmentId);
    
    if (result.success) {
      setShowAssignDialog(false);
      setSelectedDevice('');
      setAssignmentType('unassigned');
      setAssignmentTarget('');
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
    const result = await updateDeviceAssignment(
      editingDevice.device_id, 
      classroomId, 
      editAssignmentType, 
      assignmentId
    );
    
    if (result.success) {
      setShowEditDialog(false);
      setEditingDevice(null);
      setEditAssignmentType('unassigned');
      setEditAssignmentTarget('');
    }
  };

  const getAssignmentInfo = (device) => {
    if (device.assignment_type === 'student') {
      const student = classroomStudents.find(s => s.id === device.assignment_id);
      return {
        type: 'student',
        name: student ? student.first_name || student.name : 'Unknown Student',
        icon: <PersonIcon />
      };
    } else if (device.assignment_type === 'group') {
      const group = groups.find(g => g.id === device.assignment_id);
      return {
        type: 'group',
        name: group ? group.name : 'Unknown Group',
        icon: <GroupIcon />
      };
    }
    return {
      type: 'unassigned',
      name: 'Unassigned',
      icon: <WifiIcon />
    };
  };

  const availableDevices = devices.filter(device => 
    !classroomDevices.some(cd => cd.device_id === device.id)
  );

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            📱 Classroom Devices
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAssignDialog(true)}
            disabled={loading || availableDevices.length === 0}
          >
            Add Device to Classroom
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {availableDevices.length === 0 && classroomDevices.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No devices available. Register devices in your device management page first.
          </Alert>
        )}

        {classroomDevices.length === 0 ? (
          <Box textAlign="center" py={4}>
            <WifiIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No devices assigned to this classroom
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add devices from your registered devices to get started
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {classroomDevices.map((classroomDevice) => {
              const device = devices.find(d => d.id === classroomDevice.device_id);
              if (!device) return null;

              const assignment = getAssignmentInfo(classroomDevice);

              return (
                <Grid item xs={12} sm={6} md={4} key={classroomDevice.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => handleViewDevice(device.id)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" component="h3">
                          {device.nickname}
                        </Typography>
                        <Box display="flex" gap={1}>
                          <Tooltip title={device.is_active ? 'Active' : 'Inactive'}>
                            {getStatusIcon(device.is_active)}
                          </Tooltip>
                          <Tooltip title={`Battery: ${device.battery_level}%`}>
                            {getBatteryIcon(device.battery_level)}
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        MAC: {formatMacAddress(device.mac_address)}
                      </Typography>

                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        {assignment.icon}
                        <Typography variant="body2">
                          {assignment.name}
                        </Typography>
                        <Chip 
                          label={assignment.type} 
                          size="small" 
                          color={assignment.type === 'unassigned' ? 'default' : 'primary'}
                        />
                      </Box>
                      
                      <Box display="flex" gap={1}>
                        <Chip 
                          label={device.is_active ? 'Active' : 'Inactive'} 
                          color={device.is_active ? 'success' : 'error'}
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
                          handleViewDevice(device.id);
                        }}
                      >
                        View Device
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAssignment(classroomDevice);
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
                          handleUnassignDevice(classroomDevice.device_id);
                        }}
                        disabled={loading}
                      >
                        Remove from Classroom
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      {/* Assign Device Dialog */}
      <Dialog 
        open={showAssignDialog} 
        onClose={() => setShowAssignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Device to Classroom</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Device</InputLabel>
              <Select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                label="Select Device"
              >
                {availableDevices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.nickname} ({formatMacAddress(device.mac_address)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
                <MenuItem value="unassigned">Unassigned (Available to all students)</MenuItem>
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
                      {group.icon} {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignDevice} 
            variant="contained"
            disabled={loading || !selectedDevice}
          >
            {loading ? 'Adding...' : 'Add Device'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog 
        open={showEditDialog} 
        onClose={() => setShowEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Device Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {editingDevice && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Device: {editingDevice.device?.nickname} ({formatMacAddress(editingDevice.device?.mac_address)})
                </Typography>
              </Box>
            )}

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Assignment Type</InputLabel>
              <Select
                value={editAssignmentType}
                onChange={(e) => {
                  setEditAssignmentType(e.target.value);
                  setEditAssignmentTarget('');
                }}
                label="Assignment Type"
              >
                <MenuItem value="unassigned">Unassigned (Available to all students)</MenuItem>
                <MenuItem value="student">Assign to Specific Student</MenuItem>
                <MenuItem value="group">Assign to Group</MenuItem>
              </Select>
            </FormControl>

            {editAssignmentType === 'student' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={editAssignmentTarget}
                  onChange={(e) => setEditAssignmentTarget(e.target.value)}
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

            {editAssignmentType === 'group' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Group</InputLabel>
                <Select
                  value={editAssignmentTarget}
                  onChange={(e) => setEditAssignmentTarget(e.target.value)}
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
          <Button onClick={() => setShowEditDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateAssignment}
            variant="contained"
            disabled={loading || (editAssignmentType !== 'unassigned' && !editAssignmentTarget)}
          >
            {loading ? 'Updating...' : 'Update Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassroomDeviceManager;
