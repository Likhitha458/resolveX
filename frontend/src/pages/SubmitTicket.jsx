import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Search, Send, ThumbsUp, ThumbsDown, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

const STEPS = ['Describe Issue', 'Review Solutions', 'Ticket Created'];

export default function SubmitTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState('form'); // form | checking | recommendation | creating | done
  const [recommendation, setRecommendation] = useState(null);
  const [activeRecIndex, setActiveRecIndex] = useState(0);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCheckSimilar = async (e) => {
    e.preventDefault();
    setError('');
    setStep('checking');
    try {
      const res = await api.post('/api/tickets/check-similar', { title, description });
      if (res.data.found && res.data.recommendations?.length > 0) {
        setRecommendation(res.data);
        setActiveRecIndex(0);
        setStep('recommendation');
      } else {
        await createTicket();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to check for similar issues');
      setStep('form');
    }
  };

  const createTicket = async () => {
    setStep('creating');
    try {
      const res = await api.post('/api/tickets', { title, description });
      setCreatedTicket(res.data);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create ticket');
      setStep('form');
    }
  };

  const stepIndex = step === 'form' || step === 'checking' ? 0
    : step === 'recommendation' ? 1
    : 2;

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container fade-in">
        <div className="submit-flow">

          {/* Header */}
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h1>Submit an Issue</h1>
              <p>Describe your problem — AI will find solutions first</p>
            </div>
          </div>

          {/* Wizard steps indicator */}
          {step !== 'creating' && (
            <div className="wizard-steps" style={{ marginBottom: '1.75rem' }}>
              {STEPS.map((label, i) => (
                <div
                  key={i}
                  className={`wizard-step ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}
                >
                  <div className="wizard-step-num">
                    {i < stepIndex ? <CheckCircle2 size={12} /> : i + 1}
                  </div>
                  {label}
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < stepIndex ? 'rgba(16,217,160,0.3)' : 'var(--border)', margin: '0 0.5rem' }} />}
                </div>
              ))}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {/* ── Step 1: Form ── */}
          {step === 'form' && (
            <form onSubmit={handleCheckSimilar}>
              <div className="card">
                <div className="form-group">
                  <label>Issue Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., WiFi keeps disconnecting"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    id="ticket-title"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe the issue in detail — include any error messages, when it started, and what you've already tried."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    id="ticket-description"
                    style={{ minHeight: 140 }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full" id="submit-check-btn">
                  <Search size={15} /> Search for Solutions
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: Checking ── */}
          {step === 'checking' && (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
              <div className="spinner spinner-lg" style={{ margin: '0 auto 1.25rem' }} />
              <h3 style={{ marginBottom: '0.4rem', fontWeight: 700 }}>Searching knowledge base…</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                AI is matching your issue against resolved tickets
              </p>
            </div>
          )}

          {/* ── Step 3: Recommendations ── */}
          {step === 'recommendation' && recommendation?.recommendations?.length > 0 && (
            <div className="fade-in">
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Similar issues found
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                  Select a match to view the recommended fix
                </p>
              </div>

              {/* Recommendation selector cards */}
              <div className="rec-grid">
                {recommendation.recommendations.map((rec, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`rec-card ${activeRecIndex === i ? 'active' : ''}`}
                    onClick={() => setActiveRecIndex(i)}
                  >
                    <span className="rec-match-pill">
                      {Math.round((rec.similarity_score || 0) * 100)}%
                    </span>
                    <div className="rec-card-body">
                      <div className="rec-card-title">{rec.similar_ticket?.title}</div>
                      <div className="rec-card-cat">{rec.similar_ticket?.category}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Active recommendation AI response */}
              {recommendation.recommendations[activeRecIndex] && (
                <div className="card fade-in" key={activeRecIndex} style={{ marginBottom: '1.25rem' }}>
                  <div className="ai-callout">
                    <div className="ai-callout-header">
                      <Sparkles size={14} /> AI Recommendation
                    </div>
                    <div className="ai-response-text">
                      {recommendation.recommendations[activeRecIndex].ai_response}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', margin: '1rem 0 0.75rem' }}>
                    Did this solve your issue?
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-success" onClick={() => navigate('/dashboard')} id="solved-yes-btn">
                      <ThumbsUp size={15} /> Yes, resolved
                    </button>
                    <button className="btn btn-secondary" onClick={() => createTicket()} id="solved-no-btn">
                      <ThumbsDown size={15} /> No, file a ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Creating ── */}
          {step === 'creating' && (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
              <div className="spinner spinner-lg" style={{ margin: '0 auto 1.25rem' }} />
              <h3 style={{ marginBottom: '0.4rem', fontWeight: 700 }}>Creating ticket…</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                Auto-classifying and assigning to the right team
              </p>
            </div>
          )}

          {/* ── Step 5: Done ── */}
          {step === 'done' && createdTicket && (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <div className="done-icon">
                <Send size={22} style={{ color: 'var(--emerald)' }} />
              </div>
              <h2 style={{ marginBottom: '0.4rem', fontSize: '1.3rem', fontWeight: 700 }}>Ticket Created</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0' }}>
                #{createdTicket.id} has been submitted and assigned.
              </p>

              <div className="done-meta-grid">
                <div className="done-meta-item">
                  <div className="done-meta-label">Category</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{createdTicket.category}</div>
                </div>
                <div className="done-meta-item">
                  <div className="done-meta-label">Priority</div>
                  <span className={`badge badge-${createdTicket.priority}`}>{createdTicket.priority}</span>
                </div>
                <div className="done-meta-item">
                  <div className="done-meta-label">Sentiment</div>
                  <span className={`badge badge-${createdTicket.sentiment}`}>{createdTicket.sentiment}</span>
                </div>
                <div className="done-meta-item">
                  <div className="done-meta-label">Department</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{createdTicket.department}</div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={() => navigate('/dashboard')} id="go-dashboard-btn">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
