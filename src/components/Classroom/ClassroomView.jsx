import { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import {
  ArrowBack,
  School,
  Group,
  AccessTime
} from '@mui/icons-material';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../hooks/useAuth';
import styles from './ClassroomView.module.css';

export default function ClassroomView() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { currentClassroom, setCurrentClassroom, loading, error } = useClassroom();
  const { user, isLoggedIn } = useAuth();
  const [classroomData, setClassroomData] = useState(null);

  useEffect(() => {
    // For now, we'll use the current classroom from context
    // In a real app, you'd fetch the specific classroom data
    if (currentClassroom && currentClassroom.id === classroomId) {
      setClassroomData(currentClassroom);
    } else {
      // If not in current classroom, you'd fetch it here
      setClassroomData(null);
    }
  }, [classroomId, currentClassroom]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
              <Chip
                icon={<School />}
                label={classroomData.subject}
                color="primary"
                className={styles.subjectChip}
              />
              <Chip
                icon={<Group />}
                label={classroomData.user_role}
                color="secondary"
                className={styles.roleChip}
              />
            </Box>
          </Box>
        </Box>

        <Divider className={styles.divider} />

        {/* Classroom Content */}
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
                Joined
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

        {/* Placeholder for future classroom features */}
        <Paper elevation={2} className={styles.featuresPlaceholder}>
          <Typography variant="h5" component="h2" className={styles.placeholderTitle}>
            Classroom Features Coming Soon
          </Typography>
          <Typography variant="body1" className={styles.placeholderText}>
            This classroom will soon include features like assignments, discussions, 
            and interactive learning tools. Stay tuned for updates!
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
