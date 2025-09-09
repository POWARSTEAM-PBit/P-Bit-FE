import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import { Login, School, Group } from "@mui/icons-material";
import { useAuth } from "../../../hooks/useAuth";
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

  const isStudent = mode === "student";

  return (
    <Box className={styles.container}>
      <Paper elevation={0} className={styles.paper}>
        <Card className={styles.card}>
          <CardContent className={styles.cardContent}>
            <Box className={styles.header}>
              {isStudent ? (
                <Group className={styles.icon} />
              ) : (
                <School className={styles.icon} />
              )}
              <Typography variant="h5" component="h1" className={styles.title}>
                {isStudent ? "Student" : "Teacher"} Login
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
                size="small"
                margin="dense"
                label={isStudent ? "Username" : "Email Address"}
                type={isStudent ? "text" : "email"}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={styles.textField}
                placeholder={isStudent ? "Enter your username" : "you@example.com"}
                autoComplete={isStudent ? "username" : "email"}
                required
              />

              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.textField}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                className={styles.submitButton}
                startIcon={!loading ? <Login /> : null}
              >
                {loading ? <CircularProgress size={20} /> : "Log in"}
              </Button>
            </form>

            <Box className={styles.registerPrompt}>
              <Typography variant="body2" color="text.secondary">
                {isStudent ? "Are you a teacher?" : "Are you a student?"}
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(isStudent ? "/login-teacher" : "/login-student")}
                className={styles.link}
              >
                Login here
              </Button>
            </Box>

            <Box className={styles.registerPrompt}>
              <Typography variant="body2" color="text.secondary">
                Don’t have an account?
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate("/register")}
                className={styles.link}
              >
                Create one
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
}
