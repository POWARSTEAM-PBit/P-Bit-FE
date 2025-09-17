import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import styles from './Header.module.css';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElProfile, setAnchorElProfile] = React.useState(null);
  const { isLoggedIn, user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Pages for navigation, filtered based on auth state and role
  const userRole = user?.role || user?.user_type;
  const pages = [
    { name: 'Dashboard', path: '/dashboard', show: isLoggedIn },
    { name: 'Create Classroom', path: '/create-classroom', show: isLoggedIn && userRole === 'teacher' },
    { name: 'Join Classroom', path: '/join-classroom', show: true },
    { name: 'Login', path: '/login-student', show: !isLoggedIn },
    { name: 'Register', path: '/register', show: !isLoggedIn },
  ].filter(page => page.show !== false);

  const handleOpenNavMenu = (e) => setAnchorElNav(e.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);

  const handleOpenProfileMenu = (e) => setAnchorElProfile(e.currentTarget);
  const handleCloseProfileMenu = () => setAnchorElProfile(null);

  const handleLogout = () => {
    handleCloseProfileMenu();
    logout();
    navigate('/login-student');
  };

  return (
    <AppBar position="static" className={styles.appBar}>
      <Toolbar className={styles.toolbar}>
        {/* Left: Logo & Mobile Hamburger */}
        <Box className={styles.left}>
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            className={styles.logoDesktop}
          >
            P-Bit Dashboard
          </Typography>

          <Box className={styles.menuButtonMobile}>
            <IconButton
              size="large"
              aria-label="navigation menu"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={handleCloseNavMenu}>
                  <Link to={page.path} className={styles.menuItem}>
                    {page.name}
                  </Link>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Typography
            variant="h5"
            noWrap
            component={Link}
            to="/"
            className={styles.logoMobile}
          >
            P-Bit Dashboard
          </Typography>
        </Box>

        {/* Right: Navigation & Profile */}
        <Box className={styles.right}>
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : isLoggedIn ? (
            <>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                {pages.map((page) => (
                  <Link key={page.name} to={page.path} className={styles.navButton}>
                    <Button color="inherit">{page.name}</Button>
                  </Link>
                ))}
              </Box>
              <IconButton onClick={handleOpenProfileMenu} color="inherit">
                <Avatar alt={user?.first_name || user?.name} src="/static/images/avatar/1.jpg" />
              </IconButton>
              <Menu
                anchorEl={anchorElProfile}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorElProfile)}
                onClose={handleCloseProfileMenu}
              >
                <MenuItem onClick={() => { handleCloseProfileMenu(); navigate('/profile'); }}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { handleCloseProfileMenu(); navigate('/settings'); }}>
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {pages.map((page) => (
                <Link key={page.name} to={page.path} className={styles.navButton}>
                  <Button color="inherit">{page.name}</Button>
                </Link>
              ))}
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}