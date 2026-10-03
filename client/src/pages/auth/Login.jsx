import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FiLogIn } from "react-icons/fi";
import { IoShieldCheckmark } from "react-icons/io5";
import "../../styles/forms.css";
import "../../styles/globals.css";
import "../../styles/login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);
      console.log("Login response in Login component:", response);

      if (response && response.success) {
        // Wait a moment for context to update
        setTimeout(() => {
          if (response.data.role === 'candidate') {
            navigate("/candidate/my-applications");
          } else {
            navigate("/dashboard");
          }
        }, 100);
      } else {
        setError(
          response?.message || "Login failed. Please check your credentials."
        );
      }
    } catch (err) {
      console.error("Login catch error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Dark Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.25)",
          zIndex: 1,
        }}
      />

      {/* Login Card - Overlaid on Image */}
      <div className="login-card-wrapper">
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "30px 24px",
              borderRadius: "12px 12px 0 0",
              textAlign: "center",
              marginBottom: 0,
            }}
          >
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Radhix CRM
            </h1>
            <p
              style={{
                fontSize: "14px",
                margin: 0,
                marginTop: "8px",
                opacity: 0.95,
              }}
            >
              Welcome back! Please sign in to your account.
            </p>
          </div>

          {/* Form Card */}
          <div
            style={{
              backgroundColor: "#fdfbf7",
              padding: "32px 24px",
              borderRadius: "0 0 12px 12px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
            }}
          >
            {error && (
              <div
                style={{
                  padding: "12px 14px",
                  marginBottom: "20px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#dc2626",
                  borderRadius: "6px",
                  fontSize: "13px",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Email Address
                </label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <MdEmail
                    style={{
                      position: "absolute",
                      left: "14px",
                      color: "#9ca3af",
                      fontSize: "18px",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Email here"
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 40px",
                      fontSize: "13px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      backgroundColor: "#fafaf9",
                      color: "#1f2937",
                      transition: "all 0.3s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.backgroundColor = "#fff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.backgroundColor = "#fafaf9";
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Password
                </label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <MdLock
                    style={{
                      position: "absolute",
                      left: "14px",
                      color: "#9ca3af",
                      fontSize: "18px",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Password here"
                    style={{
                      width: "100%",
                      padding: "11px 40px 11px 40px",
                      fontSize: "13px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      backgroundColor: "#fafaf9",
                      color: "#1f2937",
                      transition: "all 0.3s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.backgroundColor = "#fff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.backgroundColor = "#fafaf9";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6b7280",
                      fontSize: "18px",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showPassword ? (
                      <MdVisibility size={18} />
                    ) : (
                      <MdVisibilityOff size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "24px",
                  gap: "8px",
                }}
              >
                <input
                  type="checkbox"
                  name="rememberMe"
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                  }}
                />
                <label
                  htmlFor="rememberMe"
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    cursor: "pointer",
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: "13px",
                    color: "#3b82f6",
                    textDecoration: "none",
                    marginLeft: "auto",
                    fontWeight: 500,
                  }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  opacity: loading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.backgroundColor = "#2563eb";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#3b82f6";
                }}
              >
                {!loading && <FiLogIn size={16} />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Footer Text */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
                textAlign: "center",
                fontSize: "12px",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <IoShieldCheckmark size={14} color="#10b981" />
              <p style={{ margin: 0 }}>Your data is secure with us</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
