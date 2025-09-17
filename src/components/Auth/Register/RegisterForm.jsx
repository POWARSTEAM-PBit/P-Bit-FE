import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { School, Group, PersonAdd } from '@mui/icons-material';
import { useAuth } from "../../../hooks/useAuth";
import styles from "./RegisterForm.module.css";
import loginBackground from '../../../../public/images/LoginBackground.jpg'; // update as per location

/**
 * @brief User register form.
 * @returns 
 */
export default function RegisterForm() {
  const [userType, setUserType] = useState("student");
  const [userId, setUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!userId.trim()) {
      newErrors.userId = `${userType === 'teacher' ? 'Email' : 'Username'} is required`;
    } else if (userType === 'teacher' && !userId.includes('@')) {
      newErrors.userId = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      const res = await register({
        user_id: userId,
        password,
        user_type: userType,
        first_name: firstName,
        last_name: lastName,
      });

      if (!res.success) {
        setErrorMessage(res.message || "Registration failed. Please try again.");
        return;
      }

      setSuccessMessage("🎉 Registration successful! Redirecting to login...");

      // Clear form fields
      setUserId("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");

      // Redirect after short delay
      setTimeout(() => {
        navigate(userType === "teacher" ? "/login-teacher" : "/login-student");
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred during registration.");
    }
  };

  return (
    <Box
  className={styles.container}
  style={{
    backgroundImage: `url(${loginBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }}
>

      <Paper elevation={3} className={styles.paper}>
        <Card className={styles.card}>
          <CardContent className={styles.cardContent}>
            <Box className={styles.header}>
              <PersonAdd className={styles.icon} />
              <Typography variant="h4" component="h1" className={styles.title}>
                Create Account
              </Typography>
            </Box>

            {errorMessage && (
              <Alert severity="error" className={styles.alert}>
                {errorMessage}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" className={styles.alert}>
                {successMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* User Type Toggle */}
              <Box className={styles.userTypeSection}>
                <ToggleButtonGroup
                  value={userType}
                  exclusive
                  onChange={(e, newValue) => {
                    if (newValue !== null) {
                      setUserType(newValue);
                      setUserId(""); // Clear user ID when switching types
                    }
                  }}
                  className={styles.toggleGroup}
                >
                  <ToggleButton value="student" className={styles.toggleButton}>
                    <Group className={styles.toggleIcon} />
                    <Typography>Student</Typography>
                  </ToggleButton>
                  <ToggleButton value="teacher" className={styles.toggleButton}>
                    <School className={styles.toggleIcon} />
                    <Typography>Teacher</Typography>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <TextField
                fullWidth
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                className={styles.textField}
                placeholder="Enter your first name"
                required
              />

              <TextField
                fullWidth
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                className={styles.textField}
                placeholder="Enter your last name"
                required
              />

              <TextField
                fullWidth
                label={userType === "teacher" ? "Email Address" : "Username"}
                type={userType === "teacher" ? "email" : "text"}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                error={!!errors.userId}
                helperText={errors.userId}
                className={styles.textField}
                placeholder={userType === "teacher" ? "you@example.com" : "Enter your username"}
                required
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                className={styles.textField}
                placeholder="Create a password (min 6 characters)"
                required
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                className={styles.textField}
                placeholder="Confirm your password"
                required
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                className={styles.submitButton}
                startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <Box className={styles.loginPrompt}>
              <Typography variant="body2" color="textSecondary">
                Already have an account?{" "}
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(userType === "teacher" ? "/login-teacher" : "/login-student")}
                className={styles.loginLink}
              >
                Login here
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
}
