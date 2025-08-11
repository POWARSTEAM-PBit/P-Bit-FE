import { useState } from "react";
import { Link } from "react-router-dom";
import "./LoginForm.css";

export default function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Logging in as Student\nUsername: ${username}\nPassword: ${password}`);
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="form">
        <h2 className="title">Student Login</h2>

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
          <Link to="/register" className="link"> Register here</Link>
        </p>
      </form>
    </div>
  );
}