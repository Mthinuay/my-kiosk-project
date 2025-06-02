import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Images/logo.jfif";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import "./AuthCard.css";

const AuthCard = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const resetFields = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  };

  const validateSignup = () => {
    if (!name || name.length < 2 || name.length > 100) {
      return "Name must be between 2 and 100 characters.";
    }

    const emailRegex = /^[^@\s]+@singular\.co\.za$/;
    if (!email || email.length < 8 || email.length > 100 || !emailRegex.test(email)) {
      return "Email must be valid and end with @singular.co.za.";
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!password || password.length < 8 || password.length > 100 || !passwordRegex.test(password)) {
      return "Password must contain uppercase, lowercase, number, and special character.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill in all required fields");
      return;
    }

    if (!isLogin) {
      const validationError = validateSignup();
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    try {
      const url = isLogin
        ? "https://localhost:7030/api/auth/login"
        : "https://localhost:7030/api/user/register";

      const payload = isLogin ? { email, password } : { name, email, password };
      console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      const response = await axios.post(url, payload);

      console.log("Response from server:", response.data);

      if (isLogin) {
        console.log("Login successful. Token received:", response.data.token);
        localStorage.setItem("token", response.data.token);
        navigate("/");
      } else {
        console.log("User registered successfully:", response.data);
        resetFields();
        setIsLogin(true);
        setError("Registration successful! Please log in.");
      }
    } catch (err) {
      console.error("Error during login/signup:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.join(", ") || 
                          "Something went wrong. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={logo} alt="Kiosk Logo" className="auth-logo" />
        <h2 className="auth-title">{isLogin ? "Welcome Back" : "Create Account"}</h2>
        {error && (
          <p className="auth-error">{error}</p>
        )}
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input with-icon"
              />
            </div>
          )}
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input with-icon"
            />
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input with-icon"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button type="submit" className="auth-button">
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              resetFields();
              setIsLogin(!isLogin);
            }}
            className="auth-switch-link"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthCard;