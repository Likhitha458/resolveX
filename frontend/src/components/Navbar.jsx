import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Zap, LayoutDashboard, PlusSquare, Shield, Code2 } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path ? 'active' : '';
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <Zap size={18} strokeWidth={2.5} style={{ color: 'var(--cyan)', filter: 'drop-shadow(0 0 5px var(--cyan))' }} />
          ResolveX
        </Link>

        <div className="navbar-links">
          {user?.role === 'user' && (
            <>
              <Link to="/dashboard" className={isActive('/dashboard')}>
                <LayoutDashboard size={14} /> Dashboard
              </Link>
              <Link to="/submit" className={isActive('/submit')}>
                <PlusSquare size={14} /> New Ticket
              </Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={isActive('/admin')}>
              <Shield size={14} /> Admin Panel
            </Link>
          )}
          {user?.role === 'developer' && (
            <Link to="/developer" className={isActive('/developer')}>
              <Code2 size={14} /> Assignments
            </Link>
          )}

          <div className="nav-user-info">
            <div className="nav-avatar">{getInitials(user?.name)}</div>
            <div>
              <div className="nav-user-name">{user?.name}</div>
              <span className="nav-role-badge">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{ padding: '0.35rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
