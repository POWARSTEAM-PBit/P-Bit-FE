import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./LoginForm.css";

export default function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login({
        user_id: username,
        password,
        user_type: "student",
      });
      // Redirect after successful login
      navigate("/dashboard");
    } catch (err) {
      alert("Login failed. Please check your credentials.");
      console.error(err);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="form">
        <h2 className="title">POWARSTEAM P-Bit Login</h2>

        <label className="label" htmlFor="username">Username:</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="input"
          placeholder="Enter your username"
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

        <p className="login-link">
          Are you a teacher?{" "}
          <Link to="/teacher" className="link">Login here</Link>
        </p>
        <p className="register-link">
          Don't have an account?{" "}
          <Link to="/register" className="link">Register here</Link>
        </p>
      </form>
    </div>
  );
}
