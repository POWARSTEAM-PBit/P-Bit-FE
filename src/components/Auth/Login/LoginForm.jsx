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
  Paper
} from '@mui/material';
import { Login, School, Group } from '@mui/icons-material';
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./LoginForm.module.css";

export default function LoginForm({ mode }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await login({
        user_id: userId,
        password,
        user_type: mode,
      });

      if (!res.success) {
        setErrorMessage(res.message || "Login failed. Please try again.");
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred during login.");
    }
  };

  return (
    <Box className={styles.container}>
      <Paper elevation={3} className={styles.paper}>
        <Card className={styles.card}>
          <CardContent className={styles.cardContent}>
            <Box className={styles.header}>
              {mode === "teacher" ? <School className={styles.icon} /> : <Group className={styles.icon} />}
              <Typography variant="h4" component="h1" className={styles.title}>
                {mode === "teacher" ? "Teacher" : "Student"} Login
              </Typography>
            </Box>

            {errorMessage && (
              <Alert severity="error" className={styles.alert}>
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <TextField
                fullWidth
                label={mode === "student" ? "Username" : "Email Address"}
                type={mode === "student" ? "text" : "email"}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={styles.textField}
                placeholder={mode === "student" ? "Enter your username" : "you@example.com"}
                required
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.textField}
                placeholder="Enter your password"
                required
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                className={styles.submitButton}
                startIcon={loading ? <CircularProgress size={20} /> : <Login />}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <Box className={styles.switchPrompt}>
              <Typography variant="body2" color="textSecondary">
                {mode === "student" ? "Are you a teacher?" : "Are you a student?"}{" "}
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(mode === "student" ? "/login-teacher" : "/login-student")}
                className={styles.switchLink}
              >
                Login here
              </Button>
            </Box>

            <Box className={styles.registerPrompt}>
              <Typography variant="body2" color="textSecondary">
                Don't have an account?{" "}
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate("/register")}
                className={styles.registerLink}
              >
                Register here
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
}
