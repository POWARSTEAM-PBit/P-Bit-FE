import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import "./LoginForm.css";

export default function LoginForm({ mode }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useAuth();
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
        // ✅ Display backend-provided message
        setErrorMessage(`❌ ${res.message || "Login failed. Please try again."}`);
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMessage("❌ An unexpected error occurred during login.");
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="form">
        <h2 className="title">POWARSTEAM P-Bit Login</h2>

        {/* ✅ Error Message Display */}
        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}

        <label className="label" htmlFor="userId">
          {mode === "student" ? "Username:" : "Email:"}
        </label>
        <input
          id="userId"
          type={mode === "student" ? "text" : "email"}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          className="input"
          placeholder={mode === "student" ? "Enter your username" : "you@example.com"}
        />

        <label className="label" htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input"
          placeholder="Enter your password"
        />

        <button type="submit" className="button">Login</button>

        {mode === "student" ? (
          <p className="login-link">
            Are you a teacher? <Link to="/login-teacher" className="link">Login here</Link>
          </p>
        ) : (
          <p className="login-link">
            Are you a student? <Link to="/login-student" className="link">Login here</Link>
          </p>
        )}

        <p className="register-link">
          Don't have an account? <Link to="/register" className="link">Register here</Link>
        </p>
      </form>
    </div>
  );
}
