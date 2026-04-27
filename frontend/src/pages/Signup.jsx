import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { UserPlus } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const departments = [
    'Technical Support', 'Software Development', 'Network Operations',
    'Billing Department', 'Account Management', 'Hardware Support',
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (form.role === 'user') delete payload.department;
      const res = await api.post('/api/auth/signup', payload);
      login(res.data.access_token, res.data.user);
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'developer') navigate('/developer');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <h1>ResolveX</h1>
          <p>Create your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" className="form-input" placeholder="John Doe" value={form.name} onChange={handleChange} required id="signup-name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} required id="signup-email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} id="signup-password" />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" className="form-select" value={form.role} onChange={handleChange} id="signup-role">
              <option value="user">User</option>
              <option value="developer">Developer / Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {form.role === 'developer' && (
            <div className="form-group">
              <label>Department</label>
              <select name="department" className="form-select" value={form.department} onChange={handleChange} required id="signup-department">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="signup-submit">
            {loading ? <span className="spinner" /> : <><UserPlus size={16} /> Create Account</>}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
