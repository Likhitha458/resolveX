import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Zap, LogIn, Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
            <div className="auth-brand-logo-mark">
              <Zap size={24} color="white" strokeWidth={2.5} />
            </div>
            <span className="auth-brand-logo-text">ResolveX</span>
          </div>

          <h2>
            IT Support,<br />
            <span>Resolved by AI.</span>
          </h2>

          <p>
            Instantly match issues to solutions. Auto-classify, assign, and resolve tickets — powered by Gemini AI.
          </p>

          <div className="auth-features">
            {[
              'AI-powered ticket classification',
              'Semantic similarity matching',
              'Auto-assign by department',
              'Real-time priority detection',
            ].map((f) => (
              <div className="auth-feature-item" key={f}>
                <span className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
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
            <label>Email</label>
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
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="login-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="login-submit" style={{ marginTop: '0.5rem' }}>
            {loading ? <span className="spinner" /> : <><LogIn size={15} /> Sign In</>}
          </button>
        </form>

        <div className="auth-link" style={{ marginTop: '1.25rem' }}>
          No account? <Link to="/signup">Create one</Link>
        </div>

        <div className="demo-accounts" style={{ marginTop: '1.5rem' }}>
          <strong><Shield size={10} style={{ display: 'inline', marginRight: 4 }} />Demo accounts</strong>
          user@resolvex.com / user123{'\n'}
          admin@resolvex.com / admin123{'\n'}
          dev@resolvex.com / dev123
        </div>
      </div>
    </div>
  );
}
