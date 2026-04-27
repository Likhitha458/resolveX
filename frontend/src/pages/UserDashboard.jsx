import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Plus, Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function UserDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

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

  const statusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle size={14} />;
      case 'in_progress': return <Clock size={14} />;
      case 'resolved': return <CheckCircle size={14} />;
      default: return <Ticket size={14} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container fade-in">
        <div className="page-header">
          <div>
            <h1>My Tickets</h1>
            <p>Track and manage your support requests</p>
          </div>
          <Link to="/submit" className="btn btn-primary" id="new-ticket-btn">
            <Plus size={16} /> New Ticket
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <Ticket size={48} />
            <h3>No tickets yet</h3>
            <p>Submit your first support ticket to get started</p>
            <Link to="/submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <Plus size={16} /> Submit a Ticket
            </Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td className="ticket-title-cell">{t.title}</td>
                    <td><span className="badge" style={{ background: 'var(--bg-card)' }}>{t.category}</span></td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td>
                      <span className={`badge badge-${t.status}`}>
                        {statusIcon(t.status)} {t.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
