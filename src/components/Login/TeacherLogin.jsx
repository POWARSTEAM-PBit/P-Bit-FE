import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./LoginForm.css";

export default function TeacherLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
        await login({
            user_id: email,
            password,
            user_type: "teacher",
        });
        navigate("/dashboard");
    } catch (err) {
        alert("Login Failed");
        console.error(err);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="form">
        <h2 className="title">POWARSTEAM P-Bit Login</h2>

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

        <p className="register-link">
          Don't have an account?{" "}
          <Link to="/register" className="link"> Register here</Link>
        </p>
      </form>
    </div>
  );
}
