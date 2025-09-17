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
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Avatar,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import {
  Dashboard,
  Settings,
  Person,
  Help,
  PlayArrow,
  Article,
  Code,
  Build,
  Notifications,
  ExpandMore,
  Launch,
  NewReleases,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import styles from './Landing.module.css';

export default function Landing() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState('features');

  const handleSpeedDialClose = () => setSpeedDialOpen(false);
  const handleSpeedDialOpen = () => setSpeedDialOpen(true);

  const handleSectionChange = (section) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? section : false);
  };

  const quickActions = [
    { icon: <Dashboard />, name: 'Dashboard', action: () => navigate('/dashboard'), show: isLoggedIn },
    { icon: <Settings />, name: 'Settings', action: () => navigate('/settings'), show: isLoggedIn },
    { icon: <Person />, name: 'Profile', action: () => navigate('/profile'), show: isLoggedIn },
    { icon: <Help />, name: 'Help', action: () => navigate('/help'), show: true },
  ].filter(action => action.show);

  const featuredItems = [
    {
      id: 1,
      title: 'Getting Started',
      description: 'Kickstart your journey with our step-by-step guide.',
      icon: <PlayArrow />,
      category: 'Tutorial',
      action: () => navigate('/getting-started'),
    },
    {
      id: 2,
      title: 'Documentation',
      description: 'Explore detailed guides and API references.',
      icon: <Article />,
      category: 'Docs',
      action: () => navigate('/docs'),
    },
    {
      id: 3,
      title: 'Code Examples',
      description: 'Practical examples to enhance your development.',
      icon: <Code />,
      category: 'Examples',
      action: () => navigate('/examples'),
    },
    {
      id: 4,
      title: 'Tools & Utilities',
      description: 'Boost productivity with our curated tools.',
      icon: <Build />,
      category: 'Tools',
      action: () => navigate('/tools'),
    },
  ];

  const recentUpdates = [
    {
      id: 1,
      title: 'New Features Added',
      description: 'Discover the latest tools and enhancements.',
      date: '3 days ago',
      type: 'feature',
      action: () => navigate('/updates/features'),
    },
    {
      id: 2,
      title: 'Performance Boost',
      description: 'Improved speed and efficiency across the platform.',
      date: '1 week ago',
      type: 'improvement',
      action: () => navigate('/updates/performance'),
    },
    {
      id: 3,
      title: 'Security Enhancements',
      description: 'New measures to keep your data safe.',
      date: '10 days ago',
      type: 'security',
      action: () => navigate('/updates/security'),
    },
  ];

  const getUpdateTypeColor = (type) => {
    switch (type) {
      case 'feature': return 'primary';
      case 'improvement': return 'success';
      case 'security': return 'warning';
      default: return 'default';
    }
  };

  const getUpdateTypeIcon = (type) => {
    switch (type) {
      case 'feature': return <NewReleases />;
      case 'improvement': return <TrendingUp />;
      case 'security': return <Settings />;
      default: return <Notifications />;
    }
  };

  return (
    <Box className={styles.container}>
      <Container maxWidth="xl">
        {/* Hero Section */}
        <Box className={styles.heroSection}>
          <Typography variant="h3" className={styles.heroTitle}>
            {isLoggedIn && user ? `Welcome back, ${user.first_name || user.name}!` : 'Explore Our Platform'}
          </Typography>
          <Typography variant="h6" className={styles.heroSubtitle}>
            {isLoggedIn ? 'Your dashboard awaits with all your tools.' : 'Join now to unlock powerful features.'}
          </Typography>
          <Box className={styles.heroActions}>
            {isLoggedIn ? (
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
                startIcon={<Dashboard />}
                className={styles.heroButton}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  startIcon={<Person />}
                  className={styles.heroButton}
                >
                  Sign Up
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login-student')}
                  className={styles.heroButton}
                >
                  Log In
                </Button>
              </>
            )}
          </Box>
          {isLoggedIn && user && (
            <Avatar className={styles.heroAvatar} sx={{ width: 60, height: 60 }}>
              {user.first_name?.[0] || user.name?.[0] || <Person />}
            </Avatar>
          )}
        </Box>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Featured Section */}
          <Grid item xs={12} md={8}>
            <Accordion
              expanded={expandedSection === 'features'}
              onChange={handleSectionChange('features')}
              className={styles.accordion}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h5">Featured Resources</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {featuredItems.map((item) => (
                    <Grid item xs={12} sm={6} key={item.id}>
                      <Card className={styles.featureCard}>
                        <CardContent>
                          <Box className={styles.cardHeader}>
                            {item.icon}
                            <Chip label={item.category} color="primary" size="small" />
                          </Box>
                          <Typography variant="h6">{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button
                            size="small"
                            variant="text"
                            onClick={item.action}
                            startIcon={<Launch />}
                          >
                            Explore
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Updates Section */}
          <Grid item xs={12} md={4}>
            <Paper className={styles.updatesSection}>
              <Typography variant="h5" className={styles.sectionTitle}>
                Recent Updates
              </Typography>
              {recentUpdates.map((update) => (
                <Box key={update.id} className={styles.updateItem}>
                  <Box className={styles.updateHeader}>
                    {getUpdateTypeIcon(update.type)}
                    <Typography variant="subtitle1">{update.title}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {update.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {update.date}
                  </Typography>
                  <Button
                    size="small"
                    onClick={update.action}
                    startIcon={<Launch />}
                    className={styles.updateButton}
                  >
                    Details
                  </Button>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>

        {/* Speed Dial */}
        <SpeedDial
          ariaLabel="Quick actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          onClose={handleSpeedDialClose}
          onOpen={handleSpeedDialOpen}
          open={speedDialOpen}
        >
          {quickActions.map((action) => (
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
      </Container>
    </Box>
  );
}