import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { Code2, PlayCircle, CheckCircle, MessageSquare, RefreshCw } from 'lucide-react';

export default function DeveloperPanel() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

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
      setSuccess(`Ticket #${ticketId} updated to ${status}`);
      setTimeout(() => setSuccess(''), 3000);
      fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim() || !resolveModal) return;
    setUpdating(true);
    try {
      await api.put(`/api/developer/tickets/${resolveModal}/resolve`, {
        resolution,
        status: 'resolved',
      });
      setResolveModal(null);
      setResolution('');
      setSuccess(`Ticket #${resolveModal} resolved!`);
      setTimeout(() => setSuccess(''), 3000);
      fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container fade-in">
        <div className="page-header">
          <div>
            <h1><Code2 size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />My Assignments</h1>
            <p>View and resolve tickets assigned to you</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchTickets}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {success && <div className="success-message">{success}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <Code2 size={48} />
            <h3>No tickets assigned</h3>
            <p>You don't have any tickets assigned to you right now</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tickets.map((t) => (
              <div className="card" key={t.id}>
                <div className="card-header">
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{t.id}</span>
                    <h3 className="card-title" style={{ marginTop: '0.25rem' }}>{t.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    <span className={`badge badge-${t.status}`}>{t.status?.replace('_', ' ')}</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>{t.description}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Category: <strong style={{ color: 'var(--text-secondary)' }}>{t.category}</strong></span>
                  <span>·</span>
                  <span>Sentiment: <span className={`badge badge-${t.sentiment}`}>{t.sentiment}</span></span>
                  <span>·</span>
                  <span>Submitted by: <strong style={{ color: 'var(--text-secondary)' }}>{t.creator_name}</strong></span>
                  <span>·</span>
                  <span>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</span>
                </div>

                {t.resolution && (
                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--success)', fontWeight: 600, marginBottom: '0.25rem' }}>Resolution</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.resolution}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {t.status === 'open' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(t.id, 'in_progress')} disabled={updating} id={`start-btn-${t.id}`}>
                      <PlayCircle size={14} /> Start Working
                    </button>
                  )}
                  {t.status === 'in_progress' && (
                    <button className="btn btn-success btn-sm" onClick={() => { setResolveModal(t.id); setResolution(''); }} id={`resolve-btn-${t.id}`}>
                      <CheckCircle size={14} /> Resolve
                    </button>
                  )}
                  {!t.resolution && t.status !== 'resolved' && t.status !== 'closed' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setResolveModal(t.id); setResolution(''); }} id={`add-resolution-btn-${t.id}`}>
                      <MessageSquare size={14} /> Add Resolution
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resolve Modal */}
        {resolveModal && (
          <div className="modal-overlay" onClick={() => setResolveModal(null)}>
            <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
              <h2>Resolve Ticket #{resolveModal}</h2>
              <div className="form-group">
                <label>Resolution / Solution</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the solution or steps taken to resolve this issue..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  required
                  id="resolution-text"
                  style={{ minHeight: 150 }}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setResolveModal(null)}>Cancel</button>
                <button className="btn btn-success" onClick={handleResolve} disabled={!resolution.trim() || updating} id="resolve-confirm">
                  <CheckCircle size={14} /> Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
