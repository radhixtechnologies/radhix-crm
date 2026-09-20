import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import '../../styles/forms.css';
import '../../styles/globals.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong. Please try again.');
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
            Forgot Password
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Enter your email address and we'll send you a link to reset your password
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
            If an account with that email exists, a password reset link has been sent to your email.
            Please check your inbox and follow the instructions.
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
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

export default ForgotPassword;









