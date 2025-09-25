import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Edit, 
  Refresh, 
  Person, 
  Lock,
  School,
  MoreVert,
  Delete
} from '@mui/icons-material';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchClassMembers } from '../../api/classMembers';
import client from '../../api/client';
import styles from './ClassroomView.module.css';

const CombinedStudentManager = ({ classroomId }) => {
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [anonymousStudents, setAnonymousStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState({ el: null, student: null });
  const fetchingRef = useRef(false);

  const { getAnonymousStudents, updateStudentPin, removeStudentFromClassroom } = useClassroom();
  const { user } = useAuth();

  // Check if current user is a teacher
  const isTeacher = user?.user_type === 'teacher' || user?.role === 'teacher';

  const fetchAllStudents = useCallback(async () => {
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    setError('');
    try {
      // Use the classroom students endpoint that returns both registered and anonymous students
      const response = await client.get(`/classroom/${classroomId}/students`);
      
      if (response.data.success) {
        const allStudents = response.data.data || [];
        
        // Separate registered and anonymous students
        const registered = allStudents
          .filter(student => student.student_type === 'registered')
          .map(student => ({
            id: student.id,
            full_name: student.name || student.first_name,
            username: student.id,
            join_date: student.joined_at,
            student_type: 'registered'
          }));
          
        const anonymous = allStudents
          .filter(student => student.student_type === 'anonymous')
          .map(student => ({
            id: student.id,
            full_name: student.name || student.first_name,
            username: student.id,
            join_date: student.joined_at,
            pin_code: student.pin_code, // This might not be in the response
            student_type: 'anonymous'
          }));
          
        setRegisteredStudents(registered);
        setAnonymousStudents(anonymous);
      } else {
        setError(response.data.message || 'Failed to fetch students');
        setRegisteredStudents([]);
        setAnonymousStudents([]);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load students');
      setRegisteredStudents([]);
      setAnonymousStudents([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [classroomId]);

  useEffect(() => {
    if (isTeacher && classroomId) {
      fetchAllStudents();
    }
  }, [isTeacher, classroomId, fetchAllStudents]);

  const handleEditPin = async (student) => {
    setSelectedStudent(student);
    setNewPin(''); // Don't show current PIN for security
    setPinError('');
    
    // If we don't have the PIN code, fetch it from the anonymous students endpoint
    if (!student.pin_code) {
      try {
        const result = await getAnonymousStudents(classroomId);
        if (result.success) {
          const anonymousStudent = result.students.find(s => s.student_id === student.id);
          if (anonymousStudent) {
            setSelectedStudent({ ...student, pin_code: anonymousStudent.pin_code });
          }
        }
      } catch (err) {
        // PIN fetch failed, continue without it
      }
    }
    
    setEditDialogOpen(true);
  };

  const validatePin = (pin) => {
    if (!pin.trim()) {
      return 'PIN is required';
    }
    if (!/^\d{4}$/.test(pin)) {
      return 'PIN must be exactly 4 digits';
    }
    return '';
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setNewPin(value);
    setPinError(validatePin(value));
  };

  const handleSavePin = async () => {
    const validationError = validatePin(newPin);
    if (validationError) {
      setPinError(validationError);
      return;
    }

    try {
      const result = await updateStudentPin(classroomId, selectedStudent.id, newPin);
      if (result.success) {
        // Update the local state
        setAnonymousStudents(prev => prev.map(student => 
          student.id === selectedStudent.id 
            ? { ...student, pin_code: newPin }
            : student
        ));
        setEditDialogOpen(false);
        setSelectedStudent(null);
        setNewPin('');
      } else {
        setPinError(result.message || 'Failed to update PIN');
      }
    } catch (err) {
      setPinError('Failed to update PIN');
    }
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setSelectedStudent(null);
    setNewPin('');
    setPinError('');
  };

  const handleMenuOpen = (event, student) => {
    setMenuAnchor({ el: event.currentTarget, student });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ el: null, student: null });
  };

  const handleRemoveStudent = async (student) => {
    handleMenuClose();
    
    if (window.confirm(`Are you sure you want to remove ${student.full_name} from this classroom?`)) {
      try {
        const result = await removeStudentFromClassroom(classroomId, student.id, student.student_type);
        if (result.success) {
          // Remove from local state
          if (student.student_type === 'registered') {
            setRegisteredStudents(prev => prev.filter(s => s.id !== student.id));
          } else {
            setAnonymousStudents(prev => prev.filter(s => s.id !== student.id));
          }
        } else {
          setError(result.message || 'Failed to remove student');
        }
      } catch (err) {
        setError('Failed to remove student');
      }
    }
  };

  const handleRefresh = () => {
    fetchAllStudents();
  };

  if (!isTeacher) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Paper elevation={2} className={styles.classroomContent} style={{ marginTop: 24 }}>
      <Box className={styles.contentHeader} display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2}>
          <School color="primary" />
          <Typography variant="h5" component="h2" className={styles.contentTitle}>
            Student Management
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab 
          label={`Registered Students (${registeredStudents.length})`} 
          icon={<Person />}
        />
        <Tab 
          label={`Anonymous Students (${anonymousStudents.length})`} 
          icon={<Lock />}
        />
      </Tabs>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {/* Registered Students Tab */}
          {tabValue === 0 && (
            <Box>
              {registeredStudents.length === 0 ? (
                <Alert severity="info">No registered students enrolled yet.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Full Name</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Join Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {registeredStudents.map((student) => (
                        <TableRow key={student.id} hover>
                          <TableCell>{student.full_name}</TableCell>
                          <TableCell>{student.username}</TableCell>
                          <TableCell>{formatDate(student.join_date)}</TableCell>
                          <TableCell>
                            <Chip label="Registered" color="primary" size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="More options">
                              <IconButton
                                onClick={(e) => handleMenuOpen(e, student)}
                                size="small"
                              >
                                <MoreVert />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Anonymous Students Tab */}
          {tabValue === 1 && (
            <Box>
              {anonymousStudents.length === 0 ? (
                <Alert severity="info">No anonymous students enrolled yet.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>PIN Code</TableCell>
                        <TableCell>Join Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {anonymousStudents.map((student) => (
                        <TableRow key={student.id} hover>
                          <TableCell>{student.full_name}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontFamily="monospace">
                                {student.pin_code}
                              </Typography>
                              <Tooltip title="Edit PIN">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditPin(student)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell>{formatDate(student.join_date)}</TableCell>
                          <TableCell>
                            <Chip label="Anonymous" color="secondary" size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="More options">
                              <IconButton
                                onClick={(e) => handleMenuOpen(e, student)}
                                size="small"
                              >
                                <MoreVert />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </>
      )}

      {/* More Options Menu */}
      <Menu
        anchorEl={menuAnchor.el}
        open={Boolean(menuAnchor.el)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => handleRemoveStudent(menuAnchor.student)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete color="error" />
          </ListItemIcon>
          <ListItemText>Remove Student</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit PIN Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit PIN for {selectedStudent?.full_name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New PIN"
            type="text"
            fullWidth
            variant="outlined"
            value={newPin}
            onChange={handlePinChange}
            error={!!pinError}
            helperText={pinError || "Enter a 4-digit PIN"}
            inputProps={{ maxLength: 4 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSavePin} variant="contained" disabled={!!pinError || !newPin}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CombinedStudentManager;
