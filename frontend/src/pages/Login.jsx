import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data.access_token, res.data.user);
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'developer') navigate('/developer');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <div className="auth-brand-logo-mark">R</div>
            <span className="auth-brand-logo-text">ResolveX</span>
          </div>

          <h2>
            Raise, manage,<br />
            and resolve<br />
            IT tickets <span>easily.</span>
          </h2>

          <p>
            A simple and efficient way to streamline IT support and keep everything on track.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-header">
          <h1>Welcome back</h1>
          <p>Sign in to your ResolveX account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="login-email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="login-password"
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                style={{ pointerEvents: 'auto' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <div className="form-row">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot" className="forgot-link">Forgot password?</Link>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="login-submit">
            {loading ? <span className="spinner" /> : <>Sign In</>}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-link">
          No account? <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
