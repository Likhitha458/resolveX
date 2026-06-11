import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { PlayCircle, CheckCircle, RefreshCw, MessageSquare, Inbox } from 'lucide-react';

export default function DeveloperPanel() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');

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

  const openTickets = tickets.filter(t => t.status === 'open');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  const TicketCard = ({ t }) => (
    <div className="kanban-card">
      <div className="kanban-card-top">
        <span className="kanban-card-id">#{t.id}</span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <span className={`badge badge-${t.priority}`}>{t.priority}</span>
          {t.sentiment && <span className={`badge badge-${t.sentiment}`}>{t.sentiment}</span>}
        </div>
      </div>

      <div className="kanban-card-title">{t.title}</div>
      <div className="kanban-card-desc">{t.description}</div>

      {t.resolution && (
        <div style={{
          padding: '0.6rem 0.75rem',
          background: 'rgba(16,217,160,0.06)',
          border: '1px solid rgba(16,217,160,0.15)',
          borderRadius: '8px',
          marginBottom: '0.75rem',
          fontSize: '0.75rem',
          color: 'var(--emerald)',
          lineHeight: 1.5,
        }}>
          ✓ {t.resolution}
        </div>
      )}

      <div className="kanban-card-footer">
        <div className="kanban-card-meta">
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.creator_name}</span>
          {t.created_at && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              · {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="kanban-card-actions">
          {t.status === 'open' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => updateStatus(t.id, 'in_progress')}
              disabled={updating}
              id={`start-btn-${t.id}`}
            >
              <PlayCircle size={12} /> Start
            </button>
          )}
          {t.status === 'in_progress' && (
            <button
              className="btn btn-success btn-sm"
              onClick={() => { setResolveModal(t.id); setResolution(''); }}
              id={`resolve-btn-${t.id}`}
            >
              <CheckCircle size={12} /> Resolve
            </button>
          )}
          {!t.resolution && t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'open' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setResolveModal(t.id); setResolution(''); }}
              id={`add-resolution-btn-${t.id}`}
            >
              <MessageSquare size={12} /> Note
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container fade-in">
        <div className="page-header">
          <div>
            <h1>My Assignments</h1>
            <p>Tickets assigned to you — drag-free Kanban view</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchTickets} disabled={loading}>
            <RefreshCw size={13} /> Refresh
          </button>
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
          <div className="kanban-board">
            {/* Open */}
            <div className="kanban-col col-open">
              <div className="kanban-col-header">
                Open
                <span className="kanban-col-count">{openTickets.length}</span>
              </div>
              <div className="kanban-col-body">
                {openTickets.length === 0
                  ? <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>No open tickets</div>
                  : openTickets.map(t => <TicketCard key={t.id} t={t} />)
                }
              </div>
            </div>

            {/* In Progress */}
            <div className="kanban-col col-progress">
              <div className="kanban-col-header">
                In Progress
                <span className="kanban-col-count">{inProgressTickets.length}</span>
              </div>
              <div className="kanban-col-body">
                {inProgressTickets.length === 0
                  ? <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nothing in progress</div>
                  : inProgressTickets.map(t => <TicketCard key={t.id} t={t} />)
                }
              </div>
            </div>

            {/* Resolved */}
            <div className="kanban-col col-resolved">
              <div className="kanban-col-header">
                Resolved
                <span className="kanban-col-count">{resolvedTickets.length}</span>
              </div>
              <div className="kanban-col-body">
                {resolvedTickets.length === 0
                  ? <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>No resolved tickets yet</div>
                  : resolvedTickets.map(t => <TicketCard key={t.id} t={t} />)
                }
              </div>
            </div>
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
                  placeholder="Briefly describe the fix applied…"
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
