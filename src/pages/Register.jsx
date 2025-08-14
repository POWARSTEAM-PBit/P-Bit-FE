// src/pages/Register.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
} from "@mui/material";

/**
 * API base URL
 * - Prefer reading from .env (Vite style: VITE_*)
 * - Fallback to localhost:8000 so local dev still works if .env is missing
 */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_BASE ??
  "http://127.0.0.1:8000";

/**
 * Small iOS-like switch using MUI Switch with light styling tweaks.
 */
function IOSSwitch(props) {
  return (
    <Switch
      {...props}
      sx={{
        width: 52,
        height: 32,
        padding: 0,
        "& .MuiSwitch-switchBase": {
          padding: 0.5,
          "&.Mui-checked": {
            transform: "translateX(20px)",
          },
        },
        "& .MuiSwitch-thumb": {
          width: 28,
          height: 28,
        },
        "& .MuiSwitch-track": {
          borderRadius: 999,
        },
      }}
    />
  );
}

/**
 * Register page.
 * - Toggle between Student and Teacher via the iOS-style switch.
 * - Validates inputs on the client side before sending to the backend.
 * - Calls POST /user/register on the FastAPI backend.
 */
export default function Register() {
  // false = student, true = teacher (right side ON = teacher)
  const [isTeacher, setIsTeacher] = useState(false);

  // shared fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  // teacher-only and student-only fields
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success' | 'error', text: string }

  const userType = useMemo(
    () => (isTeacher ? "teacher" : "student"),
    [isTeacher]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    // Basic front-end validation
    if (!firstName.trim() || !lastName.trim() || !password.trim()) {
      setMsg({
        type: "error",
        text: "First name, Last name, and Password are required.",
      });
      return;
    }
    if (password.length < 8) {
      setMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }

    if (userType === "teacher") {
      if (!email.trim()) {
        setMsg({ type: "error", text: "Email is required for teacher registration." });
        return;
      }
      // Optional: light email format check (backend still does strict validation)
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        setMsg({ type: "error", text: "Please enter a valid email address." });
        return;
      }
    } else {
      if (!userName.trim()) {
        setMsg({ type: "error", text: "Username is required for student registration." });
        return;
      }
      // Must match backend rule: letters/numbers/underscore, 3-32 chars
      const re = /^[a-zA-Z0-9_]{3,32}$/;
      if (!re.test(userName.trim())) {
        setMsg({
          type: "error",
          text:
            "Username must be 3–32 characters and contain only letters, numbers, and underscores.",
        });
        return;
      }
    }

    // Build request payload to match backend schema
    const payload = {
      user_type: userType,
      first_name: firstName,
      last_name: lastName,
      password,
      ...(userType === "teacher"
        ? { email: email.trim() }
        : { user_name: userName.trim() }),
    };

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMsg({ type: "success", text: "Registered successfully." });
        // Clear inputs (or navigate to /login if you add routing)
        setFirstName("");
        setLastName("");
        setPassword("");
        setEmail("");
        setUserName("");
      } else {
        setMsg({
          type: "error",
          text: data?.msg || `Registration failed (${res.status}).`,
        });
      }
    } catch (err) {
      setMsg({ type: "error", text: `Network error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 64px)", p: 2 }}>
      <Card sx={{ width: "100%", maxWidth: 520, borderRadius: 3, boxShadow: 6 }}>
        <CardContent>
          {/* Header row: title + switch */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h5" fontWeight={700}>
              Register
            </Typography>

            <FormControlLabel
              control={
                <IOSSwitch
                  checked={isTeacher}
                  onChange={(e) => setIsTeacher(e.target.checked)}
                />
              }
              label={isTeacher ? "Teacher" : "Student"}
            />
          </Box>

          {/* Message box */}
          {msg && (
            <Alert severity={msg.type} sx={{ mb: 2 }}>
              {msg.text}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <TextField
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              inputProps={{ minLength: 8 }}
              required
            />

            {isTeacher ? (
              <TextField
                label="Email (Teacher)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            ) : (
              <TextField
                label="Username (Student)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                helperText="Only letters, numbers, and underscores; 3–32 characters."
                required
              />
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? <CircularProgress size={22} /> : "Sign up"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
