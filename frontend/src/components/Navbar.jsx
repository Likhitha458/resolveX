import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Ticket, Shield, Code2, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <Ticket size={22} />
          ResolveX
        </Link>

        <div className="navbar-links">
          {user?.role === 'user' && (
            <>
              <Link to="/dashboard" className={isActive('/dashboard')}>
                <LayoutDashboard size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Dashboard
              </Link>
              <Link to="/submit" className={isActive('/submit')}>
                <Ticket size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Submit Ticket
              </Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={isActive('/admin')}>
              <Shield size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Admin Panel
            </Link>
          )}
          {user?.role === 'developer' && (
            <Link to="/developer" className={isActive('/developer')}>
              <Code2 size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              My Assignments
            </Link>
          )}

          <div className="nav-user-info">
            <div className="nav-avatar">{getInitials(user?.name)}</div>
            <div>
              <div className="nav-user-name">{user?.name}</div>
              <span className="nav-role-badge">{user?.role}</span>
            </div>
            <button onClick={handleLogout} title="Logout" style={{ padding: '0.4rem' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
