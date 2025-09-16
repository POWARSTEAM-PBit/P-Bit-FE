import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { Group, Login, PersonAdd, Lock, School } from '@mui/icons-material';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './JoinClassroom.module.css';

export default function JoinClassroom() {
  const [classroomCode, setClassroomCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [joinMethod, setJoinMethod] = useState(''); // 'logged-in' or 'anonymous'
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [pendingClassroomCode, setPendingClassroomCode] = useState('');
  const [errors, setErrors] = useState({});
  
  const { joinClassroom, joinClassroomAnonymous, loading, error, clearError } = useClassroom();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { value } = e.target;
    setClassroomCode(value.toUpperCase());
    
    // Clear error when user starts typing
    if (errors.classroomCode) {
      setErrors(prev => ({
        ...prev,
        classroomCode: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!classroomCode.trim()) {
      newErrors.classroomCode = 'Passphrase is required';
    } else if (classroomCode.length < 8) {
      newErrors.classroomCode = 'Passphrase must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJoinAttempt = async () => {
    clearError();
    
    if (!validateForm()) {
      return;
    }

    if (!isLoggedIn) {
      // If not logged in, show join method selection
      setPendingClassroomCode(classroomCode);
      setShowJoinDialog(true);
      return;
    }

    // If logged in, join directly
    await joinClassroomDirectly(classroomCode);
  };

  const joinClassroomDirectly = async (code) => {
    const result = await joinClassroom(code);
    
    if (result.success) {
      // Navigate to the joined classroom
      navigate(`/classroom/${result.classroom.id}`);
    }
  };

  const joinClassroomAnonymousDirectly = async (code, firstName, pin) => {
    const result = await joinClassroomAnonymous(code, firstName, pin);
    
    if (result.success) {
      // Show a message if user is returning
      if (result.isReturning) {
        // You could show a toast notification here
        console.log(`Welcome back, ${firstName}!`);
      }
      // Navigate to the joined classroom
      navigate(`/classroom/${result.classroom.id}`);
      return result; // Return the result for success checking
    } else {
      // Handle specific error cases
      if (result.errorType === 'name_exists') {
        setErrors({
          pinCode: 'Incorrect PIN. Please check your PIN or contact your teacher for assistance.'
        });
      } else {
        setErrors({
          general: result.message
        });
      }
      return result; // Return the result for error checking
    }
  };

  const handleJoinMethodSelect = (method) => {
    setJoinMethod(method);
    setErrors({});
  };

  const validateAnonymousForm = () => {
    const newErrors = {};
    
    if (!studentName.trim()) {
      newErrors.studentName = 'First name is required';
    } else if (studentName.length > 50) {
      newErrors.studentName = 'First name must be 50 characters or less';
    } else if (studentName.length < 2) {
      newErrors.studentName = 'First name must be at least 2 characters';
    }
    
    if (!pinCode.trim()) {
      newErrors.pinCode = 'PIN code is required';
    } else if (!/^\d{4}$/.test(pinCode)) {
      newErrors.pinCode = 'PIN code must be exactly 4 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAnonymousJoin = async () => {
    if (!validateAnonymousForm()) {
      return;
    }

    const result = await joinClassroomAnonymousDirectly(pendingClassroomCode, studentName, pinCode);
    
    // Only close the dialog if the join was successful
    if (result && result.success) {
      setShowJoinDialog(false);
    }
  };

  const handleJoinDialogClose = () => {
    setShowJoinDialog(false);
    setStudentName('');
    setPinCode('');
    setJoinMethod('');
    setPendingClassroomCode('');
    setErrors({});
  };

  return (
    <Box className={styles.container}>
      <Paper elevation={3} className={styles.paper}>
        <Card className={styles.card}>
          <CardContent className={styles.cardContent}>
            <Box className={styles.header}>
              <Group className={styles.icon} />
              <Typography variant="h4" component="h1" className={styles.title}>
                Join Classroom
              </Typography>
            </Box>

                          <Typography variant="body1" className={styles.subtitle}>
                Enter the passphrase provided by your teacher
              </Typography>

            {error && (
              <Alert severity="error" className={styles.alert}>
                {error}
              </Alert>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleJoinAttempt(); }} className={styles.form}>
              <TextField
                fullWidth
                label="Passphrase"
                value={classroomCode}
                onChange={handleInputChange}
                error={!!errors.classroomCode}
                helperText={errors.classroomCode}
                className={styles.textField}
                placeholder="e.g., ABC12345"
                inputProps={{
                  maxLength: 12,
                  style: { textTransform: 'uppercase' }
                }}
                required
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                className={styles.submitButton}
                startIcon={loading ? <CircularProgress size={20} /> : (isLoggedIn ? <Group /> : <PersonAdd />)}
              >
                {loading ? 'Joining Classroom...' : (isLoggedIn ? 'Join Classroom' : 'Continue')}
              </Button>
            </form>

            {!isLoggedIn && (
              <Box className={styles.loginPrompt}>
                <Typography variant="body2" color="textSecondary">
                  Have an account? 
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<Login />}
                  onClick={() => navigate('/login-student')}
                  className={styles.loginLink}
                >
                  Login to join
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Paper>

      {/* Join Method Selection Dialog */}
      <Dialog 
        open={showJoinDialog} 
        onClose={handleJoinDialogClose}
        maxWidth="md"
        fullWidth
        className={styles.dialog}
      >
        <DialogTitle className={styles.dialogTitle}>
          <School className={styles.dialogIcon} />
          Choose How to Join
        </DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <Typography variant="body1" className={styles.dialogText}>
            Select how you'd like to join the classroom:
          </Typography>
          
          <Box className={styles.joinMethods}>
            {/* Logged-in Option */}
            <Card 
              className={`${styles.joinMethodCard} ${joinMethod === 'logged-in' ? styles.selectedCard : ''}`}
              onClick={() => handleJoinMethodSelect('logged-in')}
            >
              <CardContent className={styles.joinMethodContent}>
                <Box className={styles.joinMethodHeader}>
                  <Login className={styles.joinMethodIcon} />
                  <Typography variant="h6">Join with Account</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Use your existing account to join. You'll need to log in first.
                </Typography>
                <Chip 
                  label="Passphrase Only" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  className={styles.methodChip}
                />
              </CardContent>
            </Card>

            {/* Anonymous Option */}
            <Card 
              className={`${styles.joinMethodCard} ${joinMethod === 'anonymous' ? styles.selectedCard : ''}`}
              onClick={() => handleJoinMethodSelect('anonymous')}
            >
              <CardContent className={styles.joinMethodContent}>
                <Box className={styles.joinMethodHeader}>
                  <PersonAdd className={styles.joinMethodIcon} />
                  <Typography variant="h6">Join Anonymously</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Join without creating an account. You can return anytime using the same name and PIN.
                </Typography>
                <Chip 
                  label="Passphrase + PIN" 
                  size="small" 
                  color="secondary" 
                  variant="outlined"
                  className={styles.methodChip}
                />
              </CardContent>
            </Card>
          </Box>

          {/* Anonymous Join Form */}
          {joinMethod === 'anonymous' && (
            <Box className={styles.anonymousForm}>
              <Typography variant="h6" className={styles.formTitle}>
                <Lock className={styles.formIcon} />
                Anonymous Join Details
              </Typography>
              
              {errors.general && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errors.general}
                </Alert>
              )}
              
              <TextField
                fullWidth
                label="First Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                error={!!errors.studentName}
                helperText={errors.studentName || "Your name must be unique in this classroom"}
                className={styles.formTextField}
                placeholder="Enter your first name"
                inputProps={{ maxLength: 50 }}
              />
              
              <TextField
                fullWidth
                label="PIN Code"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                error={!!errors.pinCode}
                helperText={errors.pinCode || "4-digit PIN provided by your teacher. Use the same PIN to return later."}
                className={styles.formTextField}
                placeholder="1234"
                inputProps={{ 
                  maxLength: 4,
                  pattern: "[0-9]*"
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button onClick={handleJoinDialogClose} color="inherit">
            Cancel
          </Button>
          
          {joinMethod === 'logged-in' && (
            <Button 
              onClick={() => {
                handleJoinDialogClose();
                navigate('/login-student');
              }} 
              variant="contained"
              startIcon={<Login />}
            >
              Go to Login
            </Button>
          )}
          
          {joinMethod === 'anonymous' && (
            <Button 
              onClick={handleAnonymousJoin} 
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
            >
              {loading ? 'Joining...' : 'Join Anonymously'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
