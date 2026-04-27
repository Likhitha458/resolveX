import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { Shield, Filter, Users, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [reassignModal, setReassignModal] = useState(null);
  const [selectedDev, setSelectedDev] = useState('');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;

      const [ticketsRes, statsRes, devsRes] = await Promise.all([
        api.get('/api/admin/tickets', { params }),
        api.get('/api/admin/stats'),
        api.get('/api/admin/developers'),
      ]);
      setTickets(ticketsRes.data);
      setStats(statsRes.data);
      setDevelopers(devsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedDev || !reassignModal) return;
    try {
      await api.put(`/api/admin/tickets/${reassignModal}/assign`, {
        assigned_to: parseInt(selectedDev),
      });
      setReassignModal(null);
      setSelectedDev('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container fade-in">
        <div className="page-header">
          <div>
            <h1><Shield size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />Admin Panel</h1>
            <p>Manage all tickets, filter, and reassign</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card"><span className="stat-value">{stats.total_tickets}</span><span className="stat-label">Total Tickets</span></div>
            <div className="stat-card"><span className="stat-value">{stats.open_tickets}</span><span className="stat-label">Open</span></div>
            <div className="stat-card"><span className="stat-value">{stats.in_progress_tickets}</span><span className="stat-label">In Progress</span></div>
            <div className="stat-card"><span className="stat-value">{stats.resolved_tickets}</span><span className="stat-label">Resolved</span></div>
            <div className="stat-card"><span className="stat-value">{stats.critical_tickets}</span><span className="stat-label">Critical</span></div>
            <div className="stat-card"><span className="stat-value">{stats.high_tickets}</span><span className="stat-label">High Priority</span></div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-bar">
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} id="filter-status">
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select className="form-select" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} id="filter-category">
            <option value="">All Categories</option>
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
            <option value="account">Account</option>
            <option value="network">Network</option>
            <option value="software">Software</option>
            <option value="hardware">Hardware</option>
          </select>
          <select className="form-select" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} id="filter-priority">
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Tickets Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Sentiment</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tickets found</td></tr>
                ) : tickets.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td className="ticket-title-cell" title={t.title}>{t.title}</td>
                    <td>{t.creator_name || '—'}</td>
                    <td><span className="badge" style={{ background: 'var(--bg-card)' }}>{t.category}</span></td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td><span className={`badge badge-${t.sentiment}`}>{t.sentiment}</span></td>
                    <td><span className={`badge badge-${t.status}`}>{t.status?.replace('_', ' ')}</span></td>
                    <td>{t.assignee_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setReassignModal(t.id); setSelectedDev(t.assigned_to || ''); }} id={`reassign-btn-${t.id}`}>
                        <Users size={12} /> Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reassign Modal */}
        {reassignModal && (
          <div className="modal-overlay" onClick={() => setReassignModal(null)}>
            <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
              <h2>Reassign Ticket #{reassignModal}</h2>
              <div className="form-group">
                <label>Assign to Developer</label>
                <select className="form-select" value={selectedDev} onChange={(e) => setSelectedDev(e.target.value)} id="reassign-select">
                  <option value="">Select a developer</option>
                  {developers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} — {d.department || 'No dept'}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setReassignModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleReassign} disabled={!selectedDev} id="reassign-confirm">Reassign</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
