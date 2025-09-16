import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Avatar,
  Divider,
  Chip,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack,
  School,
  Group,
  Person,
  Email,
  Badge,
  AccountCircle,
  Devices
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import DeviceRegistration from '../Device/DeviceRegistration';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!isLoggedIn || !user) {
    return (
      <Container maxWidth="md" className={styles.container}>
        <Paper elevation={2} className={styles.errorPaper}>
          <Typography variant="h5" className={styles.errorTitle}>
            Access Denied
          </Typography>
          <Typography variant="body1" className={styles.errorText}>
            You must be logged in to view your profile.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login-student')}
            className={styles.loginButton}
          >
            Login
          </Button>
        </Paper>
      </Container>
    );
  }

  const getUserRole = () => {
    return user?.role || user?.user_type || 'student';
  };

  const getUserName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.name || 'User';
  };

  const getRoleIcon = () => {
    return getUserRole() === 'teacher' ? <School /> : <Group />;
  };

  const getRoleColor = () => {
    return getUserRole() === 'teacher' ? 'primary' : 'secondary';
  };

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
          
          <Typography variant="h3" component="h1" className={styles.title}>
            My Profile
          </Typography>
        </Box>

        {/* Tabs for Teachers */}
        {getUserRole() === 'teacher' && (
          <Box sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Profile Information" icon={<AccountCircle />} />
              <Tab label="Device Management" icon={<Devices />} />
            </Tabs>
          </Box>
        )}

        {activeTab === 0 && (
          <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} className={styles.profileCard}>
              <Box className={styles.profileHeader}>
                <Avatar className={styles.avatar}>
                  <Person />
                </Avatar>
                <Typography variant="h5" className={styles.userName}>
                  {getUserName()}
                </Typography>
                <Chip
                  icon={getRoleIcon()}
                  label={getUserRole().charAt(0).toUpperCase() + getUserRole().slice(1)}
                  color={getRoleColor()}
                  className={styles.roleChip}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Details Card */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} className={styles.detailsCard}>
              <Typography variant="h5" component="h2" className={styles.sectionTitle}>
                Account Information
              </Typography>
              
              <Divider className={styles.divider} />

              <Box className={styles.infoGrid}>
                <Box className={styles.infoItem}>
                  <Box className={styles.infoLabel}>
                    <Person className={styles.infoIcon} />
                    <Typography variant="subtitle2">First Name</Typography>
                  </Box>
                  <Typography variant="body1" className={styles.infoValue}>
                    {user.first_name || 'Not provided'}
                  </Typography>
                </Box>

                <Box className={styles.infoItem}>
                  <Box className={styles.infoLabel}>
                    <Person className={styles.infoIcon} />
                    <Typography variant="subtitle2">Last Name</Typography>
                  </Box>
                  <Typography variant="body1" className={styles.infoValue}>
                    {user.last_name || 'Not provided'}
                  </Typography>
                </Box>

                <Box className={styles.infoItem}>
                  <Box className={styles.infoLabel}>
                    {getUserRole() === 'teacher' ? <Email className={styles.infoIcon} /> : <AccountCircle className={styles.infoIcon} />}
                    <Typography variant="subtitle2">
                      {getUserRole() === 'teacher' ? 'Email' : 'Username'}
                    </Typography>
                  </Box>
                  <Typography variant="body1" className={styles.infoValue}>
                    {user.user_id}
                  </Typography>
                </Box>

                <Box className={styles.infoItem}>
                  <Box className={styles.infoLabel}>
                    <Badge className={styles.infoIcon} />
                    <Typography variant="subtitle2">Account Type</Typography>
                  </Box>
                  <Typography variant="body1" className={styles.infoValue}>
                    {getUserRole().charAt(0).toUpperCase() + getUserRole().slice(1)}
                  </Typography>
                </Box>
              </Box>

              <Divider className={styles.divider} />

              <Box className={styles.actions}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={logout}
                  className={styles.logoutButton}
                >
                  Logout
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        )}

        {/* Device Management Tab for Teachers */}
        {getUserRole() === 'teacher' && activeTab === 1 && (
          <DeviceRegistration />
        )}

        {/* For Students, show profile without tabs */}
        {getUserRole() !== 'teacher' && (
          <Grid container spacing={3}>
            {/* Profile Card */}
            <Grid item xs={12} md={4}>
              <Paper elevation={2} className={styles.profileCard}>
                <Box className={styles.profileHeader}>
                  <Avatar className={styles.avatar}>
                    <Person />
                  </Avatar>
                  <Typography variant="h5" className={styles.userName}>
                    {getUserName()}
                  </Typography>
                  <Chip
                    icon={getRoleIcon()}
                    label={getUserRole().charAt(0).toUpperCase() + getUserRole().slice(1)}
                    color={getRoleColor()}
                    className={styles.roleChip}
                  />
                </Box>

                <Divider className={styles.divider} />

                <Box className={styles.profileDetails}>
                  <Box className={styles.detailItem}>
                    <Email className={styles.detailIcon} />
                    <Typography variant="body2" className={styles.detailText}>
                      {user.email}
                    </Typography>
                  </Box>

                  <Box className={styles.detailItem}>
                    <Badge className={styles.detailIcon} />
                    <Typography variant="body2" className={styles.detailText}>
                      ID: {user.id}
                    </Typography>
                  </Box>
                </Box>

                <Divider className={styles.divider} />

                <Box className={styles.actions}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={logout}
                    className={styles.logoutButton}
                  >
                    Logout
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}
