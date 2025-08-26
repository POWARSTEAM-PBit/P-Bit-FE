import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  School,
  Group,
  Add,
  JoinFull,
  Person,
  Class,
  AccessTime,
  ContentCopy,
  Share,
  Visibility,
  ExpandMore,
  Create,
  Lock
} from '@mui/icons-material';
import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../hooks/useAuth';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { classrooms, loading, error } = useClassroom();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [shareDialog, setShareDialog] = useState({ open: false, classroom: null });
  const [expandedSection, setExpandedSection] = useState('created'); // 'created' or 'joined'

  const handleSpeedDialClose = () => {
    setSpeedDialOpen(false);
  };

  const handleSpeedDialOpen = () => {
    setSpeedDialOpen(true);
  };

  // Utility functions - define before usage
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (role) => {
    return role === 'teacher' ? 'primary' : 'secondary';
  };

  const getRoleIcon = (role) => {
    return role === 'teacher' ? <School /> : <Group />;
  };

  const getUserRole = (user) => {
    return user?.role || user?.user_type || 'student';
  };

  const actions = [
    {
      icon: <Add />,
      name: 'Create Classroom',
      action: () => navigate('/create-classroom'),
      show: isLoggedIn && getUserRole(user) === 'teacher'
    },
    {
      icon: <JoinFull />,
      name: 'Join Classroom',
      action: () => navigate('/join-classroom'),
      show: true
    }
  ].filter(action => action.show);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  const handleShareClassroom = (classroom) => {
    setShareDialog({ open: true, classroom });
  };

  const handleCloseShareDialog = () => {
    setShareDialog({ open: false, classroom: null });
  };

  const isTeacher = getUserRole(user) === 'teacher';

  // Separate classrooms by type
  const createdClassrooms = classrooms.filter(c => c.user_role === 'teacher');
  const joinedClassrooms = classrooms.filter(c => c.user_role === 'student');

  const handleSectionChange = (section) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? section : false);
  };

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={60} />
        <Typography variant="h6" className={styles.loadingText}>
          Loading your classrooms...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      <Container maxWidth="lg" className={styles.content}>
        {/* Header */}
        <Box className={styles.header}>
          <Box className={styles.headerContent}>
            <Typography variant="h3" component="h1" className={styles.title}>
              Welcome back{isLoggedIn && user ? `, ${user.first_name || user.name}` : ''}!
            </Typography>
            <Typography variant="h6" className={styles.subtitle}>
              {isLoggedIn ? 'Manage your classrooms and learning journey' : 'Join classrooms to start learning'}
            </Typography>
          </Box>
          {isLoggedIn && user && (
            <Avatar className={styles.userAvatar}>
              {getRoleIcon(getUserRole(user))}
            </Avatar>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" className={styles.alert}>
            {error}
          </Alert>
        )}

        {/* Classrooms Sections */}
        <Box className={styles.sectionsContainer}>
          {/* Created Classes Section (Teachers Only) */}
          {isTeacher && (
            <Accordion 
              expanded={expandedSection === 'created'} 
              onChange={handleSectionChange('created')}
              className={styles.section}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Create />
                  <Typography variant="h6">
                    Your Classes ({createdClassrooms.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {createdClassrooms.length > 0 ? (
                  <Grid container spacing={3}>
                    {createdClassrooms.map((classroom) => (
                      <Grid item xs={12} sm={6} md={4} key={classroom.id}>
                        <Card className={styles.classroomCard} elevation={2}>
                          <CardContent className={styles.cardContent}>
                            <Box className={styles.cardHeader}>
                              <Typography variant="h6" component="h2" className={styles.classroomName}>
                                {classroom.name}
                              </Typography>
                              <Chip
                                icon={getRoleIcon(classroom.user_role)}
                                label={classroom.user_role}
                                color={getRoleColor(classroom.user_role)}
                                size="small"
                                className={styles.roleChip}
                              />
                            </Box>
                            
                            <Typography variant="body2" color="textSecondary" className={styles.subject}>
                              {classroom.subject}
                            </Typography>
                            
                            {classroom.description && (
                              <Typography variant="body2" className={styles.description}>
                                {classroom.description}
                              </Typography>
                            )}
                            
                            <Box className={styles.classroomInfo}>
                              <Box className={styles.infoItem}>
                                <Class className={styles.infoIcon} />
                                <Typography variant="caption">
                                  Passphrase: {classroom.code}
                                </Typography>
                              </Box>
                              {classroom.pin_code && (
                                <Box className={styles.infoItem}>
                                  <Lock className={styles.infoIcon} />
                                  <Typography variant="caption">
                                    PIN: {classroom.pin_code}
                                  </Typography>
                                </Box>
                              )}
                              <Box className={styles.infoItem}>
                                <AccessTime className={styles.infoIcon} />
                                <Typography variant="caption">
                                  Created: {formatDate(classroom.joined_at)}
                                </Typography>
                              </Box>
                              {classroom.member_count && (
                                <Box className={styles.infoItem}>
                                  <Group className={styles.infoIcon} />
                                  <Typography variant="caption">
                                    {classroom.member_count} member{classroom.member_count !== 1 ? 's' : ''}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </CardContent>
                          
                          <CardActions className={styles.cardActions}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => navigate(`/classroom/${classroom.id}`)}
                              className={styles.enterButton}
                              startIcon={<Visibility />}
                              sx={{ flex: 1 }}
                            >
                              Enter
                            </Button>
                            
                            <Tooltip title="Share classroom passphrase">
                              <IconButton
                                onClick={() => handleShareClassroom(classroom)}
                                className={styles.shareButton}
                                color="primary"
                              >
                                <Share />
                              </IconButton>
                            </Tooltip>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Paper elevation={1} className={styles.emptySection}>
                    <Box className={styles.emptySectionContent}>
                      <Create className={styles.emptySectionIcon} />
                      <Typography variant="h6" className={styles.emptySectionTitle}>
                        No classes created yet
                      </Typography>
                      <Typography variant="body2" className={styles.emptySectionText}>
                        Create your first classroom to start teaching
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/create-classroom')}
                        className={styles.sectionButton}
                      >
                        Create Classroom
                      </Button>
                    </Box>
                  </Paper>
                )}
                
                {/* Always show create button in this section */}
                <Box className={styles.sectionActions}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => navigate('/create-classroom')}
                    className={styles.sectionButton}
                  >
                    Create New Classroom
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Joined Classes Section */}
          <Accordion 
            expanded={expandedSection === 'joined'} 
            onChange={handleSectionChange('joined')}
            className={styles.section}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={2}>
                <School />
                <Typography variant="h6">
                  {isTeacher ? 'Joined Classes' : 'Your Classes'} ({joinedClassrooms.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {joinedClassrooms.length > 0 ? (
                <Grid container spacing={3}>
                  {joinedClassrooms.map((classroom) => (
                    <Grid item xs={12} sm={6} md={4} key={classroom.id}>
                      <Card className={styles.classroomCard} elevation={2}>
                        <CardContent className={styles.cardContent}>
                          <Box className={styles.cardHeader}>
                            <Typography variant="h6" component="h2" className={styles.classroomName}>
                              {classroom.name}
                            </Typography>
                            <Chip
                              icon={getRoleIcon(classroom.user_role)}
                              label={classroom.user_role}
                              color={getRoleColor(classroom.user_role)}
                              size="small"
                              className={styles.roleChip}
                            />
                          </Box>
                          
                          <Typography variant="body2" color="textSecondary" className={styles.subject}>
                            {classroom.subject}
                          </Typography>
                          
                          {classroom.description && (
                            <Typography variant="body2" className={styles.description}>
                              {classroom.description}
                            </Typography>
                          )}
                          
                          <Box className={styles.classroomInfo}>
                            <Box className={styles.infoItem}>
                              <Class className={styles.infoIcon} />
                              <Typography variant="caption">
                                Passphrase: {classroom.code}
                              </Typography>
                            </Box>
                            <Box className={styles.infoItem}>
                              <AccessTime className={styles.infoIcon} />
                              <Typography variant="caption">
                                Joined: {formatDate(classroom.joined_at)}
                              </Typography>
                            </Box>
                            {classroom.owner_name && (
                              <Box className={styles.infoItem}>
                                <Person className={styles.infoIcon} />
                                <Typography variant="caption">
                                  Teacher: {classroom.owner_name}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                        
                        <CardActions className={styles.cardActions}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate(`/classroom/${classroom.id}`)}
                            className={styles.enterButton}
                            startIcon={<Visibility />}
                            sx={{ flex: 1 }}
                          >
                            Enter
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper elevation={1} className={styles.emptySection}>
                  <Box className={styles.emptySectionContent}>
                    <School className={styles.emptySectionIcon} />
                    <Typography variant="h6" className={styles.emptySectionTitle}>
                      {isTeacher ? 'No joined classes' : 'No classes yet'}
                    </Typography>
                    <Typography variant="body2" className={styles.emptySectionText}>
                      {isTeacher 
                        ? 'Join a classroom to start learning from other teachers'
                        : 'Join a classroom to start your learning journey'
                      }
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<JoinFull />}
                      onClick={() => navigate('/join-classroom')}
                      className={styles.sectionButton}
                    >
                      Join Classroom
                    </Button>
                  </Box>
                </Paper>
              )}
              
              {/* Always show join button in this section */}
              <Box className={styles.sectionActions}>
                <Button
                  variant="outlined"
                  startIcon={<JoinFull />}
                  onClick={() => navigate('/join-classroom')}
                  className={styles.sectionButton}
                >
                  Join New Classroom
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Empty State - Only show if no classrooms at all */}
        {classrooms.length === 0 && (
          /* Empty State */
          <Paper elevation={1} className={styles.emptyState}>
            <Box className={styles.emptyStateContent}>
              <School className={styles.emptyStateIcon} />
              <Typography variant="h5" className={styles.emptyStateTitle}>
                {isLoggedIn ? 'No classrooms yet' : 'Welcome to P-Bit Dashboard'}
              </Typography>
              <Typography variant="body1" className={styles.emptyStateText}>
                {isLoggedIn 
                  ? 'Get started by creating a new classroom or joining an existing one.'
                  : 'Join a classroom to start your learning journey.'
                }
              </Typography>
              <Box className={styles.emptyStateActions}>
                                 {isLoggedIn && getUserRole(user) === 'teacher' && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Add />}
                    onClick={() => navigate('/create-classroom')}
                    className={styles.emptyStateButton}
                  >
                    Create Classroom
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<JoinFull />}
                  onClick={() => navigate('/join-classroom')}
                  className={styles.emptyStateButton}
                >
                  Join Classroom
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Speed Dial for Quick Actions */}
        <SpeedDial
          ariaLabel="Quick actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          onClose={handleSpeedDialClose}
          onOpen={handleSpeedDialOpen}
          open={speedDialOpen}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                action.action();
                handleSpeedDialClose();
              }}
            />
          ))}
        </SpeedDial>

        {/* Share Classroom Dialog */}
        <Dialog 
          open={shareDialog.open} 
          onClose={handleCloseShareDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Share />
              Share Classroom
            </Box>
          </DialogTitle>
          <DialogContent>
            {shareDialog.classroom && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {shareDialog.classroom.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Share these details with students to let them join your classroom:
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        Passphrase:
                      </Typography>
                      <Typography 
                        variant="h4" 
                        component="span"
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 'bold',
                          color: '#667eea'
                        }}
                      >
                        {shareDialog.classroom.code}
                      </Typography>
                    </Box>
                    <Tooltip title="Copy passphrase to clipboard">
                      <IconButton 
                        onClick={() => copyToClipboard(shareDialog.classroom.code)}
                        color="primary"
                      >
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                  
                  {shareDialog.classroom.pin_code && (
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          PIN Code (for anonymous students):
                        </Typography>
                        <Typography 
                          variant="h4" 
                          component="span"
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 'bold',
                            color: '#e17055'
                          }}
                        >
                          {shareDialog.classroom.pin_code}
                        </Typography>
                      </Box>
                      <Tooltip title="Copy PIN to clipboard">
                        <IconButton 
                          onClick={() => copyToClipboard(shareDialog.classroom.pin_code)}
                          color="warning"
                        >
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  )}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Students can join at: {window.location.origin}/join-classroom
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseShareDialog}>Close</Button>
            <Button 
              onClick={() => {
                const text = shareDialog.classroom?.pin_code 
                  ? `Passphrase: ${shareDialog.classroom.code}\nPIN: ${shareDialog.classroom.pin_code}`
                  : shareDialog.classroom?.code || '';
                copyToClipboard(text);
              }}
              variant="contained"
              startIcon={<ContentCopy />}
            >
              Copy All Details
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
