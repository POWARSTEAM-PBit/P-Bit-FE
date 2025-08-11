import { useState } from "react";
import { Link } from "react-router-dom";
import "./LoginForm.css";

export default function TeacherLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Logging in as Teacher\nEmail: ${email}\nPassword: ${password}`);
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="form">
        <h2 className="title">Teacher Login</h2>

        <label className="label" htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input"
          placeholder="you@example.com"
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
          Are you a student?{" "}
          <Link to="/" className="link">Login here</Link>
        </p>
      </form>
    </div>
  );
}
