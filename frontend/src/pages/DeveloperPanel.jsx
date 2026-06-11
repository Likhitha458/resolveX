import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { PlayCircle, CheckCircle, RefreshCw, MessageSquare, Inbox, ChevronDown } from 'lucide-react';

export default function DeveloperPanel() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/developer/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (ticketId, status) => {
    setUpdating(true);
    try {
      await api.put(`/api/developer/tickets/${ticketId}/status`, { status });
      setSuccess(`Ticket #${ticketId} moved to ${status.replace('_', ' ')}`);
      setTimeout(() => setSuccess(''), 3000);
      fetchTickets();
    } catch (err) { console.error(err); }
    finally { setUpdating(false); }
  };

  const handleResolve = async () => {
    if (!resolution.trim() || !resolveModal) return;
    setUpdating(true);
    try {
      await api.put(`/api/developer/tickets/${resolveModal}/resolve`, { resolution, status: 'resolved' });
      setResolveModal(null);
      setResolution('');
      setSuccess(`Ticket #${resolveModal} resolved!`);
      setTimeout(() => setSuccess(''), 3000);
      fetchTickets();
    } catch (err) { console.error(err); }
    finally { setUpdating(false); }
  };

  // Filter tickets by status
  const applyStatusFilter = (ticketList) => {
    if (filterStatus === 'all') return ticketList;
    if (filterStatus === 'pending') return ticketList.filter(t => t.status === 'open');
    if (filterStatus === 'in_progress') return ticketList.filter(t => t.status === 'in_progress');
    if (filterStatus === 'resolved') return ticketList.filter(t => t.status === 'resolved' || t.status === 'closed');
    return ticketList;
  };

  // Organize by category
  const ticketsByCategory = {
    'developer': applyStatusFilter(tickets.filter(t => t.category?.toLowerCase() === 'developer')),
    'support': applyStatusFilter(tickets.filter(t => t.category?.toLowerCase() === 'support')),
    'network': applyStatusFilter(tickets.filter(t => t.category?.toLowerCase() === 'network')),
  };

  const TicketCard = ({ t }) => (
    <div className="dev-ticket-item">
      <div className="dev-ticket-top-row">
        <span className="dev-ticket-id">#{t.id}</span>
        <span className="dev-ticket-title">{t.title}</span>
      </div>
      
      <div className="dev-ticket-desc">{t.description}</div>

      {t.resolution && (
        <div className="dev-ticket-resolution">
          {t.resolution}
        </div>
      )}

      <div className="dev-ticket-meta-row">
        <span className={`badge badge-${t.priority}`}>{t.priority}</span>
        {t.sentiment && <span className={`badge badge-${t.sentiment}`}>{t.sentiment}</span>}
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {t.creator_name} · {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="dev-ticket-actions-row">
        <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
        {t.status === 'open' && (
          <button
            className="btn btn-secondary btn-xs"
            onClick={() => updateStatus(t.id, 'in_progress')}
            disabled={updating}
          >
            <PlayCircle size={11} /> Start
          </button>
        )}
        {t.status === 'in_progress' && (
          <button
            className="btn btn-success btn-xs"
            onClick={() => { setResolveModal(t.id); setResolution(''); }}
          >
            <CheckCircle size={11} /> Resolve
          </button>
        )}
        {!t.resolution && t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'open' && (
          <button
            className="btn btn-secondary btn-xs"
            onClick={() => { setResolveModal(t.id); setResolution(''); }}
          >
            <MessageSquare size={11} /> Add Note
          </button>
        )}
      </div>
    </div>
  );

  const CategorySection = ({ title, categoryKey }) => {
    const categoryTickets = ticketsByCategory[categoryKey];
    if (categoryTickets.length === 0) return null;

    return (
      <div className="dev-category-section">
        <div className="dev-category-header">
          <h3>{title}</h3>
          <span className="dev-category-count">{categoryTickets.length}</span>
        </div>
        <div className="dev-category-tickets">
          {categoryTickets.map(t => <TicketCard key={t.id} t={t} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container fade-in">
        <div className="page-header">
          <div>
            <h1>My Assignments</h1>
            <p>Tickets assigned to you organized by category</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="dev-filter-wrapper">
              <select
                className="form-select dev-status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Tickets</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <ChevronDown size={14} className="dev-dropdown-icon" />
            </div>
            <button className="btn btn-secondary" onClick={fetchTickets} disabled={loading}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {success && <div className="success-message">{success}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <Inbox size={48} />
            <h3>No tickets assigned</h3>
            <p>You're all caught up — nothing pending right now</p>
          </div>
        ) : (
          <div className="dev-tickets-container">
            <CategorySection title="Developer" categoryKey="developer" />
            <CategorySection title="Support" categoryKey="support" />
            <CategorySection title="Network" categoryKey="network" />
            {Object.values(ticketsByCategory).every(arr => arr.length === 0) && (
              <div className="empty-state">
                <Inbox size={48} />
                <h3>No tickets match this filter</h3>
                <p>Try selecting a different status filter</p>
              </div>
            )}
          </div>
        )}

        {/* Resolve Modal */}
        {resolveModal && (
          <div className="modal-overlay" onClick={() => setResolveModal(null)}>
            <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
              <h2>Resolve Ticket #{resolveModal}</h2>
              <div className="form-group">
                <label>Resolution Notes</label>
                <textarea
                  className="form-textarea"
                  placeholder="Provide troubleshooting steps and resolution details…"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  required
                  id="resolution-text"
                  style={{ minHeight: 130 }}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setResolveModal(null)}>Cancel</button>
                <button
                  className="btn btn-success"
                  onClick={handleResolve}
                  disabled={!resolution.trim() || updating}
                  id="resolve-confirm"
                >
                  <CheckCircle size={14} /> Mark Resolved
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
