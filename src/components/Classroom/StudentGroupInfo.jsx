import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Button
} from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Wifi as WifiIcon,
  Battery20 as BatteryLowIcon,
  Battery50 as BatteryMediumIcon,
  Battery90 as BatteryHighIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';

const StudentGroupInfo = ({ classroomId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getStudentData, loading } = useClassroom();
  
  console.log('StudentGroupInfo render:', { classroomId, isTeacher: user?.user_type === 'teacher' || user?.role === 'teacher' });

  const [studentData, setStudentData] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  // Check if current user is a teacher
  const isTeacher = useMemo(() => {
    return user?.user_type === 'teacher' || user?.role === 'teacher';
  }, [user?.user_type, user?.role]);

  // Reset fetch state when classroomId changes
  useEffect(() => {
    hasFetched.current = false;
    setStudentData(null);
  }, [classroomId]);

  // Fetch student data only once when component mounts or classroomId changes
  useEffect(() => {
    if (classroomId && !isTeacher && !hasFetched.current) {
      console.log('Fetching student data for classroom:', classroomId);
      hasFetched.current = true;
      
      // Fetch student-specific data
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await getStudentData(classroomId);
          if (result.success) {
            setStudentData(result.data);
          } else {
            setError(result.message);
          }
        } catch (error) {
          console.error('Error fetching student data:', error);
          setError('Failed to fetch student data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [classroomId, isTeacher]); // Include isTeacher in dependencies

  const getBatteryIcon = (batteryLevel) => {
    if (batteryLevel >= 80) return <BatteryHighIcon color="success" />;
    if (batteryLevel >= 30) return <BatteryMediumIcon color="warning" />;
    return <BatteryLowIcon color="error" />;
  };

  const formatMacAddress = (macAddress) => {
    if (!macAddress) return '';
    return macAddress.replace(/(.{2})/g, '$1:').slice(0, -1);
  };

  const handleViewDevice = (deviceId) => {
    navigate(`/classroom/${classroomId}/device/${deviceId}`, {
      state: { fromClassroom: true }
    });
  };

  const handleGroupToggle = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleRefresh = async () => {
    if (classroomId && !isTeacher) {
      hasFetched.current = false;
      setIsLoading(true);
      setError(null);
      try {
        const result = await getStudentData(classroomId);
        if (result.success) {
          setStudentData(result.data);
          hasFetched.current = true;
        } else {
          setError(result.message);
        }
      } catch (error) {
        console.error('Error refreshing student data:', error);
        setError('Failed to refresh student data');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // For teachers, show a simple message
  if (isTeacher) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="h5" component="h2">
            👥 Student View
          </Typography>
        </Box>
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <PersonIcon color="action" />
            <Typography variant="h6">
              Teacher Mode
            </Typography>
            <Chip 
              label="Teacher" 
              color="primary" 
              size="small"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            This view is designed for students. As a teacher, you can manage groups and devices in the sections above.
          </Typography>
        </Box>
      </Paper>
    );
  }

  // For students, show their groups and devices
  if (isLoading) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
          <CircularProgress size={24} />
          <Typography>Loading your groups and devices...</Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (!studentData) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Alert severity="info">No data available for this classroom.</Alert>
      </Paper>
    );
  }

  return (
    <Box>
      {/* My Groups Section */}
      {studentData.groups && studentData.groups.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <GroupIcon color="primary" />
            <Typography variant="h5" component="h2">
              My Groups
            </Typography>
            <Chip 
              label={`${studentData.groups.length} group${studentData.groups.length !== 1 ? 's' : ''}`} 
              color="primary" 
              size="small"
            />
          </Box>
          
          {studentData.groups.map((group) => (
            <Accordion 
              key={group.id} 
              expanded={expandedGroups[group.id] || false}
              onChange={() => handleGroupToggle(group.id)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Typography variant="h6">{group.icon} {group.name}</Typography>
                  {group.devices && group.devices.length > 0 && (
                    <Chip 
                      label={`${group.devices.length} device${group.devices.length !== 1 ? 's' : ''}`} 
                      size="small" 
                      color="secondary"
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {group.devices && group.devices.length > 0 ? (
                  <Grid container spacing={2}>
                    {group.devices.map((device) => (
                      <Grid item xs={12} sm={6} md={4} key={device.id}>
                        <Card 
                          variant="outlined"
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 2
                            }
                          }}
                          onClick={() => handleViewDevice(device.id)}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <WifiIcon color="action" />
                              <Typography variant="h6" noWrap>
                                {device.nickname}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                              {formatMacAddress(device.mac_address)}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              {getBatteryIcon(device.battery_level)}
                              <Typography variant="body2">
                                {device.battery_level}%
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              {device.is_active ? (
                                <ActiveIcon color="success" fontSize="small" />
                              ) : (
                                <InactiveIcon color="error" fontSize="small" />
                              )}
                              <Typography variant="body2" color={device.is_active ? 'success.main' : 'error.main'}>
                                {device.is_active ? 'Active' : 'Inactive'}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              startIcon={<ViewIcon />}
                              color="primary"
                              variant="outlined"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDevice(device.id);
                              }}
                            >
                              View Device
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No devices assigned to this group.
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      )}

      {/* My Assigned Devices Section */}
      {studentData.assigned_devices && studentData.assigned_devices.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <PersonIcon color="primary" />
            <Typography variant="h5" component="h2">
              My Assigned Devices
            </Typography>
            <Chip 
              label={`${studentData.assigned_devices.length} device${studentData.assigned_devices.length !== 1 ? 's' : ''}`} 
              color="primary" 
              size="small"
            />
          </Box>
          
          <Grid container spacing={2}>
            {studentData.assigned_devices.map((device) => (
              <Grid item xs={12} sm={6} md={4} key={device.id}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                  onClick={() => handleViewDevice(device.id)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <WifiIcon color="action" />
                      <Typography variant="h6" noWrap>
                        {device.nickname}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {formatMacAddress(device.mac_address)}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {getBatteryIcon(device.battery_level)}
                      <Typography variant="body2">
                        {device.battery_level}%
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      {device.is_active ? (
                        <ActiveIcon color="success" fontSize="small" />
                      ) : (
                        <InactiveIcon color="error" fontSize="small" />
                      )}
                      <Typography variant="body2" color={device.is_active ? 'success.main' : 'error.main'}>
                        {device.is_active ? 'Active' : 'Inactive'}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      color="primary"
                      variant="outlined"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDevice(device.id);
                      }}
                    >
                      View Device
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Public Devices Section */}
      {studentData.public_devices && studentData.public_devices.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <WifiIcon color="primary" />
            <Typography variant="h5" component="h2">
              Public Devices
            </Typography>
            <Chip 
              label={`${studentData.public_devices.length} device${studentData.public_devices.length !== 1 ? 's' : ''}`} 
              color="secondary" 
              size="small"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            These devices are available to all students in the classroom.
          </Typography>
          
          <Grid container spacing={2}>
            {studentData.public_devices.map((device) => (
              <Grid item xs={12} sm={6} md={4} key={device.id}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                  onClick={() => handleViewDevice(device.id)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <WifiIcon color="action" />
                      <Typography variant="h6" noWrap>
                        {device.nickname}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {formatMacAddress(device.mac_address)}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {getBatteryIcon(device.battery_level)}
                      <Typography variant="body2">
                        {device.battery_level}%
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      {device.is_active ? (
                        <ActiveIcon color="success" fontSize="small" />
                      ) : (
                        <InactiveIcon color="error" fontSize="small" />
                      )}
                      <Typography variant="body2" color={device.is_active ? 'success.main' : 'error.main'}>
                        {device.is_active ? 'Active' : 'Inactive'}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      color="primary"
                      variant="outlined"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDevice(device.id);
                      }}
                    >
                      View Device
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* No Data Message */}
      {(!studentData.groups || studentData.groups.length === 0) && 
       (!studentData.assigned_devices || studentData.assigned_devices.length === 0) && 
       (!studentData.public_devices || studentData.public_devices.length === 0) && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="h5" component="h2">
              👥 My Groups & Devices
            </Typography>
          </Box>
          <Alert severity="info">
            You are not assigned to any groups and there are no devices available in this classroom yet.
          </Alert>
        </Paper>
      )}
    </Box>
  );
};

export default StudentGroupInfo;