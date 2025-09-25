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
  Tooltip
} from '@mui/material';
import { 
  Edit, 
  Refresh, 
  Person, 
  Lock,
  School
} from '@mui/icons-material';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';

const AnonymousStudentManager = ({ classroomId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const fetchingRef = useRef(false);

  const { getAnonymousStudents, updateStudentPin } = useClassroom();
  const { user } = useAuth();

  console.log('AnonymousStudentManager render:', { classroomId, user: user?.user_type });

  // Check if current user is a teacher
  const isTeacher = user?.user_type === 'teacher' || user?.role === 'teacher';

  const fetchStudents = useCallback(async () => {
    if (fetchingRef.current) return; // Prevent multiple simultaneous requests
    
    fetchingRef.current = true;
    setLoading(true);
    setError('');
    try {
      console.log('AnonymousStudentManager: Making API call for classroom:', classroomId);
      const result = await getAnonymousStudents(classroomId);
      if (result.success) {
        setStudents(result.students || []);
      } else {
        setError(result.message || 'Failed to fetch students');
      }
    } catch (err) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [classroomId, getAnonymousStudents]);

  useEffect(() => {
    if (isTeacher && classroomId) {
      console.log('AnonymousStudentManager: Fetching students for classroom:', classroomId);
      fetchStudents();
    }
  }, [isTeacher, classroomId, fetchStudents]);

  const handleEditPin = (student) => {
    setSelectedStudent(student);
    setNewPin(''); // Don't show current PIN for security
    setPinError('');
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
      const result = await updateStudentPin(classroomId, selectedStudent.student_id, newPin);
      if (result.success) {
        // Update the local state
        setStudents(prev => prev.map(student => 
          student.student_id === selectedStudent.student_id 
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

  if (!isTeacher) {
    return null;
  }

  return (
    <Paper elevation={2} className="classroomContent" style={{ marginTop: 24 }}>
      <Box className="contentHeader" display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <School color="primary" />
          <Typography variant="h5" component="h2" className="contentTitle">
            Anonymous Student Management
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchStudents}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Manage PIN codes for anonymous students. Students can rejoin using their name and PIN combination.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" alignItems="center" gap={2} justifyContent="center" py={4}>
          <CircularProgress size={24} />
          <Typography>Loading students...</Typography>
        </Box>
      ) : students.length === 0 ? (
        <Alert severity="info">
          No anonymous students have joined this classroom yet.
        </Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>PIN Status</TableCell>
                <TableCell>First Joined</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.student_id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Person color="action" />
                      <Typography variant="body2" fontWeight="medium">
                        {student.first_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Lock color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {student.pin_code ? '••••' : 'Not set'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {student.joined_at ? new Date(student.joined_at).toLocaleDateString() : 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {student.last_active ? new Date(student.last_active).toLocaleDateString() : 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Set New PIN">
                      <IconButton
                        size="small"
                        onClick={() => handleEditPin(student)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit PIN Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Edit color="primary" />
            Set New PIN for {selectedStudent?.first_name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="New PIN Code"
              value={newPin}
              onChange={handlePinChange}
              error={!!pinError}
              helperText={pinError || "Enter a new 4-digit PIN code for the student"}
              placeholder="1234"
              inputProps={{ 
                maxLength: 4,
                pattern: "[0-9]*"
              }}
            />
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> The student will need to use this new PIN to rejoin the classroom.
                Make sure to communicate the new PIN to the student securely.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSavePin} 
            variant="contained"
            disabled={!!pinError || !newPin}
          >
            Update PIN
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AnonymousStudentManager;
