import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api';
import './Login.css';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      const token = response.data.data?.token;
      
      if (response.data.success && token) {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
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
        <h2 className="login-title">Sign In</h2>
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <div className="auth-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
