import { useMemo, useState } from "react";
import { Box, Card, CardContent, TextField, Typography, Button, Switch, FormControlLabel, Alert, CircularProgress} from "@mui/material";
import { useAuth } from "../../../hooks/useAuth";

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
export default function RegisterForm() {
  // false = student, true = teacher (right side ON = teacher)
  const [isTeacher, setIsTeacher] = useState(false);
  const { register } = useAuth();

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
    const user_id = userName;

    if (userType == "teacher") {
      user_id = email;
    }

    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        password: password,
        user_id: user_id
      })
    } catch (err)
    {
      alter("Register Failed");
      console.error(err);
    }
    //setMsg(null);
  

  //   try {
  //     setLoading(true);
  //     const res = await fetch(`${API_BASE}/user/register`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     });

  //     const data = await res.json().catch(() => ({}));

  //     if (res.ok) {
  //       setMsg({ type: "success", text: "Registered successfully." });
  //       // Clear inputs (or navigate to /login if you add routing)
  //       setFirstName("");
  //       setLastName("");
  //       setPassword("");
  //       setEmail("");
  //       setUserName("");
  //     } else {
  //       setMsg({
  //         type: "error",
  //         text: data?.msg || `Registration failed (${res.status}).`,
  //       });
  //     }
  //   } catch (err) {
  //     setMsg({ type: "error", text: `Network error: ${err.message}` });
  //   } finally {
  //     setLoading(false);
  //   }
  // }
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
