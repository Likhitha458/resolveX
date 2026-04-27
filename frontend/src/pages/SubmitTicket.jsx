import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Search, Send, ThumbsUp, ThumbsDown, Sparkles, Loader2 } from 'lucide-react';

export default function SubmitTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState('form'); // form, checking, recommendation, creating, done
  const [recommendation, setRecommendation] = useState(null);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCheckSimilar = async (e) => {
    e.preventDefault();
    setError('');
    setStep('checking');

    try {
      const res = await api.post('/api/tickets/check-similar', { title, description });

      if (res.data.found) {
        setRecommendation(res.data);
        setStep('recommendation');
      } else {
        // No similar ticket found — create automatically
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

  const handleSolved = () => {
    navigate('/dashboard');
  };

  const handleNotSolved = () => {
    createTicket();
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-container fade-in">
        <div className="submit-flow">
          <div className="page-header">
            <div>
              <h1>Submit an Issue</h1>
              <p>Describe your problem and our AI will help find a solution</p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Step 1: Form */}
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
                    placeholder="Describe your issue in detail. Include any error messages, when it started, and what you've already tried."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    id="ticket-description"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full" id="submit-check-btn">
                  <Search size={16} /> Check for Solutions
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Checking */}
          {step === 'checking' && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner spinner-lg" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Searching for similar issues...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Our AI is analyzing your issue against our knowledge base
              </p>
            </div>
          )}

          {/* Step 3: Recommendation */}
          {step === 'recommendation' && recommendation && (
            <div className="fade-in">
              <div className="recommendation-card">
                <h3>
                  <Sparkles size={18} />
                  AI-Powered Solution Found
                  <span className="similarity-score">
                    {Math.round((recommendation.similarity_score || 0) * 100)}% match
                  </span>
                </h3>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Similar issue: <em>"{recommendation.similar_ticket?.title}"</em>
                </div>

                <div className="ai-response">
                  {recommendation.ai_response}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Did this solve your issue?
                </p>

                <div className="recommendation-actions">
                  <button className="btn btn-success" onClick={handleSolved} id="solved-yes-btn">
                    <ThumbsUp size={16} /> Yes, this solved it!
                  </button>
                  <button className="btn btn-secondary" onClick={handleNotSolved} id="solved-no-btn">
                    <ThumbsDown size={16} /> No, create a ticket
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Creating */}
          {step === 'creating' && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner spinner-lg" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Creating your ticket...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Auto-classifying and assigning to the right team
              </p>
            </div>
          )}

          {/* Step 5: Done */}
          {step === 'done' && createdTicket && (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Send size={24} style={{ color: 'var(--success)' }} />
              </div>
              <h2 style={{ marginBottom: '0.5rem' }}>Ticket Created!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Your ticket #{createdTicket.id} has been submitted and assigned.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxWidth: 360, margin: '0 auto 1.5rem', textAlign: 'left' }}>
                <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Category</div>
                  <div style={{ fontSize: '0.85rem' }}>{createdTicket.category}</div>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Priority</div>
                  <span className={`badge badge-${createdTicket.priority}`}>{createdTicket.priority}</span>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Sentiment</div>
                  <span className={`badge badge-${createdTicket.sentiment}`}>{createdTicket.sentiment}</span>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Department</div>
                  <div style={{ fontSize: '0.85rem' }}>{createdTicket.department}</div>
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
