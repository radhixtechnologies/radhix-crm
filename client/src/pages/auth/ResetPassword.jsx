import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import '../../styles/forms.css';
import '../../styles/globals.css';

const ResetPassword = () => {
  const { resettoken: rawToken } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resettoken, setResettoken] = useState(null);

  useEffect(() => {
    // Decode the token from URL (handle URL encoding)
    if (rawToken) {
      try {
        // Decode URI component to handle any encoding
        const decodedToken = decodeURIComponent(rawToken);
        setResettoken(decodedToken);
        
        // Log for debugging (remove in production)
        console.log('Reset token received:', decodedToken ? 'Token present' : 'No token');
      } catch (err) {
        console.error('Error decoding reset token:', err);
        setError('Invalid reset token format');
      }
    } else {
      setError('No reset token provided. Please use the link from your email.');
    }
  }, [rawToken]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!resettoken) {
      setError('Invalid reset token. Please use the link from your email.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(resettoken, formData.password);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      setError(errorMessage);
      
      // If token is invalid/expired, provide helpful message
      if (errorMessage.includes('Invalid') || errorMessage.includes('expired') || errorMessage.includes('token')) {
        setError(`${errorMessage} Please request a new password reset link.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '400px',
          width: '100%',
          animation: 'slideInUp 0.5s ease-in-out',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
            Reset Password
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Enter your new password below
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--error)',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
            }}
          >
            {error}
            {(error.includes('Invalid') || error.includes('expired') || error.includes('token')) && (
              <div style={{ marginTop: '12px' }}>
                <Link
                  to="/forgot-password"
                  style={{
                    color: 'var(--primary)',
                    textDecoration: 'underline',
                    fontSize: '13px',
                  }}
                >
                  Request a new password reset link
                </Link>
              </div>
            )}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
            }}
          >
            Password reset successfully! Redirecting to login page...
          </div>
        )}

        {!success && resettoken && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter new password"
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm new password"
                disabled={loading}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {!success && !resettoken && !error && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            <p>Loading reset token...</p>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          <Link
            to="/login"
            style={{
              color: 'var(--primary)',
              textDecoration: 'none',
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


