import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Plus, Ticket, Clock, CheckCircle, AlertCircle, Inbox } from 'lucide-react';

export default function UserDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/api/tickets/my');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  const statusIcon = (status) => {
    if (status === 'open') return <AlertCircle size={13} />;
    if (status === 'in_progress') return <Clock size={13} />;
    if (status === 'resolved') return <CheckCircle size={13} />;
    return <Ticket size={13} />;
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container fade-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>My Tickets</h1>
            <p>Track the status of your support requests</p>
          </div>
          <Link to="/submit" className="btn btn-primary" id="new-ticket-btn">
            <Plus size={15} /> New Ticket
          </Link>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="stats-grid">
            <div className="stat-card cyan">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Tickets</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-value">{stats.open}</div>
              <div className="stat-label">Open</div>
            </div>
            <div className="stat-card violet">
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card emerald">
              <div className="stat-value">{stats.resolved}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
        )}

        {/* Ticket list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <Inbox size={48} />
            <h3>No tickets yet</h3>
            <p>Submit your first ticket to get started</p>
            <Link to="/submit" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              <Plus size={15} /> Submit a Ticket
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {tickets.map((t) => (
              <div key={t.id} className={`ticket-card priority-${t.priority}`}>
                <span className="ticket-card-id">#{t.id}</span>
                <div className="ticket-card-body">
                  <div className="ticket-card-title">{t.title}</div>
                  <div className="ticket-card-meta">
                    <span>{t.category}</span>
                    <span>·</span>
                    <span>{formatDate(t.created_at)}</span>
                  </div>
                </div>
                <div className="ticket-card-badges">
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                  <span className={`badge badge-${t.status}`}>
                    <span className={`status-dot ${t.status}`} />
                    {statusIcon(t.status)}
                    {t.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
