import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import "./RegisterForm.css";

export default function RegisterForm() {
  const [isTeacher, setIsTeacher] = useState(false);
  const [userId, setUserId] = useState(""); // username or email
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const { register } = useAuth();

  const userType = isTeacher ? "teacher" : "student";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register({
        user_id: userId,
        password,
        user_type: userType,
        first_name: firstName,
        last_name: lastName,
      });
      alert("Registration successful!");
      // Reset form
      setUserId("");
      setPassword("");
      setFirstName("");
      setLastName("");
    } catch (err) {
      alert(err);
      console.error(err);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="form">
        <h2 className="title">POWARSTEAM P-Bit Register</h2>

        {/* Toggle between teacher and student */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <label style={{ fontWeight: "600", color: "#5c5470" }}>
            <input
              type="checkbox"
              checked={isTeacher}
              onChange={(e) => setIsTeacher(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            Registering as a {isTeacher ? "Teacher" : "Student"}
          </label>
        </div>

        <label className="label" htmlFor="firstName">First Name:</label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="input"
          placeholder="Enter your first name"
        />

        <label className="label" htmlFor="lastName">Last Name:</label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="input"
          placeholder="Enter your last name"
        />

        <label className="label" htmlFor="userId">
          {isTeacher ? "Email:" : "Username:"}
        </label>
        <input
          id="userId"
          type={isTeacher ? "email" : "text"}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          className="input"
          placeholder={isTeacher ? "you@example.com" : "Enter your username"}
        />

        <label className="label" htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input"
          placeholder="Create a password"
        />

        <button type="submit" className="button">Register</button>

        <p className="login-link">
          Already have an account?{" "}
          <Link to={isTeacher ? "/login-teacher" : "/login-student"} className="link">
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
}
