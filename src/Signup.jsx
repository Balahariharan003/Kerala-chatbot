import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailOrPhone: "",
    password: "",
    confirmPassword: "",
  });
  const [signupType, setSignupType] = useState("email");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSignupTypeChange = (type) => {
    setSignupType(type);
    setFormData(prev => ({ ...prev, emailOrPhone: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return setError("Please enter your full name");
    }
    if (!formData.emailOrPhone.trim()) {
      return setError("Please enter your email or phone number");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    // Save dummy user locally (for manual login check)
    const newUser = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      emailOrPhone: formData.emailOrPhone.trim(),
      password: formData.password,
    };

    localStorage.setItem("user", JSON.stringify(newUser));

    setSuccess("Account created successfully!");
    setTimeout(() => navigate("/login"), 1000); // Redirect to login
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join us and start chatting</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter first name"
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter last name"
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <label>Sign up with</label>
            <div className="login-type-tabs">
              <button
                type="button"
                className={`tab-btn ${signupType === "email" ? "active" : ""}`}
                onClick={() => handleSignupTypeChange("email")}
              >
                Email
              </button>
              <button
                type="button"
                className={`tab-btn ${signupType === "phone" ? "active" : ""}`}
                onClick={() => handleSignupTypeChange("phone")}
              >
                Phone
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>{signupType === "email" ? "Email Address" : "Phone Number"}</label>
            <input
              type={signupType === "email" ? "email" : "tel"}
              name="emailOrPhone"
              value={formData.emailOrPhone}
              onChange={handleInputChange}
              placeholder={signupType === "email" ? "Enter your email" : "Enter your phone"}
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm password"
              required
              className="auth-input"
            />
          </div>

          {(error || success) && (
            <div className={`message ${error ? "error-message" : "success-message"}`}>
              {error || success}
            </div>
          )}

          <button type="submit" className="auth-btn primary">
            Sign Up
          </button>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
