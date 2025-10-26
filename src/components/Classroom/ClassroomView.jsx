import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
} from '@mui/material';
import { ArrowBack, School, Group } from '@mui/icons-material';

import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ClassroomView.module.css';

import CombinedStudentManager from './CombinedStudentManager';
import NewClassroomDeviceManager from './NewClassroomDeviceManager';
import GroupManager from './GroupManager';
import StudentGroupInfo from './StudentGroupInfo';

export default function ClassroomView() {
  const { classroomId } = useParams();
  const navigate = useNavigate();

  // Bring in classroom context pieces
  const { currentClassroom, classrooms, fetchClassrooms, loading, error } = useClassroom();
  const { isLoggedIn, user } = useAuth();

  const [classroomData, setClassroomData] = useState(null);
  const [showSessionRestored, setShowSessionRestored] = useState(false);


  // Normalize route id once
  const wantedId = useMemo(() => String(classroomId ?? ''), [classroomId]);

  // Determine if current user is a student or teacher
  // Check both AuthContext user and classroom user_role (for anonymous students)
  const isStudent = user?.user_type === 'student' || user?.role === 'student' || classroomData?.user_role === 'student';
  const isTeacher = user?.user_type === 'teacher' || user?.role === 'teacher' || classroomData?.user_role === 'teacher';

  // Show session restored notification when a cached session is detected
  useEffect(() => {
    if (classroomData?.is_cached) {
      setShowSessionRestored(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowSessionRestored(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [classroomData?.is_cached]);
  

  // Helper to normalize a classroom object's id field
  const normId = (c) =>
    c?.id != null ? String(c.id) : c?.class_id != null ? String(c.class_id) : '';

  // Make sure we only call fetchClassrooms() once as a fallback
  const hasFetchedRef = useRef(false);

  // Resolve classroom data:
  // 1) prefer currentClassroom (if matches)
  // 2) else find in classrooms list
  // 3) else fetch list once and try again
  useEffect(() => {
    if (!wantedId) {
      setClassroomData(null);
      return;
    }

    // 1) currentClassroom
    if (currentClassroom && normId(currentClassroom) === wantedId) {
      setClassroomData(currentClassroom);
      // Set classroom ID in session storage for BLE recording
      sessionStorage.setItem('currentClassroomId', wantedId);
      return;
    }

    // 2) search in classrooms list
    const found = (classrooms || []).find((c) => normId(c) === wantedId);
    if (found) {
      setClassroomData(found);
      // Set classroom ID in session storage for BLE recording
      sessionStorage.setItem('currentClassroomId', wantedId);
      return;
    }

    // 3) fetch once if possible
    let cancelled = false;
    (async () => {
      if (hasFetchedRef.current || typeof fetchClassrooms !== 'function') {
        if (!cancelled) setClassroomData(null);
        return;
      }
      try {
        hasFetchedRef.current = true;
        const list = (await fetchClassrooms()) || [];
        if (cancelled) return;
        const f2 = list.find((c) => normId(c) === wantedId);
        setClassroomData(f2 || null);
        // Set classroom ID in session storage for BLE recording
        if (f2) {
          sessionStorage.setItem('currentClassroomId', wantedId);
        }
      } catch {
        if (!cancelled) setClassroomData(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wantedId, currentClassroom, classrooms, fetchClassrooms]);


  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Global loading/errors from context
  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={60} />
        <Typography variant="h6" className={styles.loadingText}>
          Loading classroom...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" className={styles.container}>
        <Alert severity="error" className={styles.alert}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          className={styles.backButton}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!classroomData) {
    return (
      <Container maxWidth="md" className={styles.container}>
        <Alert severity="warning" className={styles.alert}>
          Classroom not found or you don't have access to it.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          className={styles.backButton}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Box className={styles.container}>
      <Container maxWidth="lg" className={styles.content}>
        {/* Header */}
        <Box className={styles.header}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            className={styles.backButton}
          >
            Back to Dashboard
          </Button>

          <Box className={styles.headerInfo}>
            <Typography variant="h4" component="h1" className={styles.title}>
              {classroomData.name}
            </Typography>
            <Box className={styles.headerMeta}>
              <Chip icon={<School />} label={classroomData.subject} color="primary" className={styles.subjectChip} />
              <Chip icon={<Group />} label={classroomData.user_role.charAt(0).toUpperCase() + classroomData.user_role.slice(1)} color="secondary" className={styles.roleChip} />
              {classroomData.is_cached && (
                <Chip 
                  label="Session Restored" 
                  color="success" 
                  variant="outlined" 
                  size="small"
                  className={styles.sessionChip}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Divider className={styles.divider} />

        {/* Session Restored Notification */}
        {showSessionRestored && (
          <Alert 
            severity="success" 
            onClose={() => setShowSessionRestored(false)}
            sx={{ mb: 2 }}
          >
            🎉 Welcome back, {classroomData.first_name}! Your session has been automatically restored.
          </Alert>
        )}

        {/* Classroom Info */}
        <Paper elevation={2} className={styles.classroomContent}>
          <Box className={styles.contentHeader}>
            <Typography variant="h5" component="h2" className={styles.contentTitle}>
              Classroom Information
            </Typography>
          </Box>

          <Box className={styles.infoGrid}>
            <Box className={styles.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Classroom Code
              </Typography>
              <Typography variant="h6" className={styles.infoValue}>
                {classroomData.code}
              </Typography>
            </Box>

            <Box className={styles.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Subject
              </Typography>
              <Typography variant="h6" className={styles.infoValue}>
                {classroomData.subject}
              </Typography>
            </Box>

            <Box className={styles.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Your Role
              </Typography>
              <Typography variant="h6" className={styles.infoValue}>
                {classroomData.user_role}
              </Typography>
            </Box>

            <Box className={styles.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Created
              </Typography>
              <Typography variant="h6" className={styles.infoValue}>
                {formatDate(classroomData.joined_at)}
              </Typography>
            </Box>
          </Box>

          {classroomData.description && (
            <Box className={styles.descriptionSection}>
              <Typography variant="h6" className={styles.descriptionTitle}>
                Description
              </Typography>
              <Typography variant="body1" className={styles.description}>
                {classroomData.description}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Conditional Content: Student Info for Students, Student Management for Teachers */}
        {isStudent ? (
          <StudentGroupInfo classroomId={wantedId} />
        ) : (
          /* Combined Student Management - Teachers Only */
          <CombinedStudentManager classroomId={wantedId} />
        )}

        {/* Group Management - Teachers Only */}
        {isTeacher && wantedId && (
          <GroupManager classroomId={wantedId} />
        )}

        {/* Device Management - Teachers Only */}
        {isTeacher && wantedId && (
          <NewClassroomDeviceManager classroomId={wantedId} />
        )}
      </Container>
    </Box>
  );
}
