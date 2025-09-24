import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });
  const [loginType, setLoginType] = useState("email");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setFormData(prev => ({ ...prev, emailOrPhone: "" }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.emailOrPhone.trim() || !formData.password.trim()) {
      return setError("Please fill in all fields");
    }

    // Dummy user check (localStorage)
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      return setError("No account found. Please sign up first.");
    }

    if (
      storedUser.emailOrPhone === formData.emailOrPhone &&
      storedUser.password === formData.password
    ) {
      // Successful login → navigate to Chat page
      navigate("/");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Sign in with</label>
            <div className="login-type-tabs">
              <button
                type="button"
                className={`tab-btn ${loginType === "email" ? "active" : ""}`}
                onClick={() => handleLoginTypeChange("email")}
              >
                Email
              </button>
              <button
                type="button"
                className={`tab-btn ${loginType === "phone" ? "active" : ""}`}
                onClick={() => handleLoginTypeChange("phone")}
              >
                Phone
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>{loginType === "email" ? "Email Address" : "Phone Number"}</label>
            <input
              type={loginType === "email" ? "email" : "tel"}
              name="emailOrPhone"
              value={formData.emailOrPhone}
              onChange={handleInputChange}
              placeholder={loginType === "email" ? "Enter your email" : "Enter your phone"}
              className="auth-input"
              required
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
              className="auth-input"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-btn primary">
            Sign In
          </button>

          <div className="auth-footer">
            <Link to="/signup" className="auth-link">
              Don’t have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
