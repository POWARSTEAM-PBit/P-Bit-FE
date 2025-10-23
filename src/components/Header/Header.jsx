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
import styles from './Header.module.css';
import { useAuth } from "../../contexts/AuthContext";

const pages = [
  { name: 'Home', path: '/' },
  { name: 'Login', path: '/login-student' },
  { name: 'Register', path: '/register' },
  { name: 'Create Class', path: '/create-class' }
];

export default function Header() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElProfile, setAnchorElProfile] = React.useState(null);

  const { isLoggedIn, user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Force re-render when auth state changes
  const userRole = user?.role || user?.user_type;

  const pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Create Classroom', path: '/create-classroom', show: isLoggedIn && userRole === 'teacher' },
    { name: 'Join Classroom', path: '/join-classroom' },
    { name: 'Login', path: '/login-student', show: !isLoggedIn },
    { name: 'Register', path: '/register', show: !isLoggedIn }
  ].filter(page => page.show !== false);

  const handleOpenNavMenu = (e) => setAnchorElNav(e.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);

  const handleOpenProfileMenu = (e) => setAnchorElProfile(e.currentTarget);
  const handleCloseProfileMenu = () => setAnchorElProfile(null);

  return (
    <AppBar position="static" className={styles.appBar}>
      <Toolbar className={styles.toolbar}>

        {/* LEFT: Logo & Mobile Hamburger */}
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

        {/* RIGHT: Authenticated / Unauthenticated User Actions */}
        <Box className={styles.right}>
          {isLoggedIn ? (
            <>
              <IconButton onClick={handleOpenProfileMenu} color="inherit">
                <Avatar alt={user?.first_name || user?.name || 'User'} src="/static/images/avatar/1.jpg" />
              </IconButton>
              <Menu
                anchorEl={anchorElProfile}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorElProfile)}
                onClose={handleCloseProfileMenu}
              >
                <MenuItem onClick={() => { handleCloseProfileMenu(); navigate('/profile'); }}>Profile</MenuItem>
                <MenuItem onClick={() => { handleCloseProfileMenu(); logout(); navigate('/'); }}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Link to="/login-student" className={styles.navButton}>
                <Button color="inherit">Login</Button>
              </Link>
              <Link to="/register" className={styles.navButton}>
                <Button color="inherit">Register</Button>
              </Link>
            </>
          )}
        </Box>

      </Toolbar>
    </AppBar>
  );
}
