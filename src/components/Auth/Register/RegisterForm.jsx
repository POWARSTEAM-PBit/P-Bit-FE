import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import "./RegisterForm.css";

/**
 * @brief User register form.
 * @returns 
 */
export default function RegisterForm() {
  const [isTeacher, setIsTeacher] = useState(false);
  const [userId, setUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // ✅ NEW

  const { register } = useAuth();
  const navigate = useNavigate();

  const userType = isTeacher ? "teacher" : "student";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage(""); // ✅ clear any previous error

    try {
      const res = await register({
        user_id: userId,
        password,
        user_type: userType,
        first_name: firstName,
        last_name: lastName,
      });

      if (!res.success) {
        setErrorMessage(`❌ ${res.message || "Registration failed. Please try again."}`);
        return;
      }

      setSuccessMessage("🎉 Registration successful! Redirecting to login...");

      // Clear form fields
      setUserId("");
      setPassword("");
      setFirstName("");
      setLastName("");

      // Redirect after short delay
      setTimeout(() => {
        navigate(userType === "teacher" ? "/login-teacher" : "/login-student");
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMessage("❌ An unexpected error occurred during registration.");
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="form">
        <h2 className="title">POWARSTEAM P-Bit Register</h2>

        {/* ✅ Error Message */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {/* ✅ Success Message */}
        {successMessage && <p className="success-message">{successMessage}</p>}

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
