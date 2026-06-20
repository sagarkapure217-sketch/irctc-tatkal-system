import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api';
import './Login.css';

const Signup = ({ setIsAuthenticated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/signup', { name, email, password });
      
      if (response.data.success) {
        setSuccess('Signup successful! Redirecting...');
        
        // Some backends return the token on signup, others require a separate login step.
        // If a token is provided, log them in automatically.
        const token = response.data.data?.token;
        if (token) {
          localStorage.setItem('token', token);
          setIsAuthenticated(true);
          setTimeout(() => navigate('/dashboard'), 1000);
        } else {
          // No token provided, redirect to login page
          setTimeout(() => navigate('/login'), 1500);
        }
      } else {
        setError(response.data.message || 'Signup failed');
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Sign Up</h2>
        <form onSubmit={handleSignup} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
          
          <div className="auth-link">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
