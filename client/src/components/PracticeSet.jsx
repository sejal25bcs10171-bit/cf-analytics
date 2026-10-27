import { useState } from 'react';
import axios from 'axios';

export default function PracticeSet({ suggestions, weakTag, handle, apiBase, initialSet }) {
  const [set, setSet] = useState(initialSet || null);
  const [starting, setStarting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  if (!suggestions?.length) return null;

  const start = async () => {
    setStarting(true);
    setError('');
    try {
      const res = await axios.post(
        `${apiBase}/api/practice/${encodeURIComponent(handle)}`,
        { tag: weakTag, problems: suggestions }
      );
      setSet(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start practice set.');
    } finally {
      setStarting(false);
    }
  };

  const check = async () => {
    setChecking(true);
    setError('');
    try {
      const res = await axios.post(
        `${apiBase}/api/practice/${encodeURIComponent(handle)}/check`
      );
      setSet(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check progress.');
    } finally {
      setChecking(false);
    }
  };

  const isComplete = set?.completionPct === 100;

  return (
    <div className="card">
      <h2>🎯 Practice Set
        <span style={{ color: 'var(--weak)', fontWeight: 400, fontSize: '.88rem' }}>
          &nbsp;— {weakTag}
        </span>
      </h2>

      {!set ? (
        <>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1rem' }}>
            Save these problems as a practice set. Come back and hit <b style={{ color: 'var(--text)' }}>Check Progress</b> after
            submitting them on Codeforces — the server verifies your accepted submissions directly.
          </p>
          <button className="btn-action" onClick={start} disabled={starting}>
            {starting ? 'Starting…' : '▶ Start Practice Set'}
          </button>
        </>
      ) : (
        <>
          <div className="ps-meta">
            <span>Started: <b style={{ color: 'var(--text)' }}>{new Date(set.startTime).toLocaleString()}</b></span>
            <span
              className="ps-completion"
              style={{
                background: isComplete ? 'rgba(34,197,94,.15)' : 'var(--accent-soft)',
                color: isComplete ? '#22c55e' : 'var(--accent)',
              }}
            >
              {isComplete ? '🏆' : '⏳'} {set.completionPct}% complete
            </span>
          </div>

          <ul className="ps-list">
            {set.problems.map((p, i) => (
              <li key={i} className={p.solved ? 'ps-solved' : ''}>
                <span className="ps-icon">{p.solved ? '✅' : '⬜'}</span>
                <a href={p.url} target="_blank" rel="noopener noreferrer">{p.name}</a>
                <span style={{ marginLeft: 'auto', fontSize: '.8rem' }}>
                  {p.solved
                    ? <span style={{ color: '#22c55e' }}>solved {new Date(p.solvedAt).toLocaleTimeString()}</span>
                    : <span className="rating-chip">⭐ {p.rating}</span>
                  }
                </span>
              </li>
            ))}
          </ul>

          {error && <div className="error-box" style={{ marginTop: '1rem' }}>⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.1rem', flexWrap: 'wrap' }}>
            <button className="btn-action" onClick={check} disabled={checking}>
              {checking ? 'Checking…' : '🔄 Check Progress'}
            </button>
            <button className="btn-secondary" onClick={start} disabled={starting}>
              {starting ? '…' : '↺ New Set'}
            </button>
          </div>
        </>
      )}

      {error && !set && (
        <div className="error-box" style={{ marginTop: '1rem' }}>⚠️ {error}</div>
      )}
    </div>
  );
}

