import { useState } from 'react';
import axios from 'axios';
import RatingChart from './components/RatingChart';
import TagChart from './components/TagChart';
import Suggestions from './components/Suggestions';
import PracticeSet from './components/PracticeSet';
import './index.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [practiceSet, setPracticeSet] = useState(null);

  const analyze = async (e) => {
    e.preventDefault();
    const h = handle.trim();
    if (!h) return;

    setLoading(true);
    setError('');
    setData(null);
    setPracticeSet(null);

    try {
      // Fetch analysis; also try to load existing practice set (best-effort)
      const [analysisRes, practiceRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/analyze/${encodeURIComponent(h)}`),
        axios.get(`${API_BASE}/api/practice/${encodeURIComponent(h)}`),
      ]);

      if (analysisRes.status === 'rejected') {
        throw analysisRes.reason;
      }

      setData(analysisRes.value.data);
      if (practiceRes.status === 'fulfilled') {
        setPracticeSet(practiceRes.value.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const weakTag = data?.tagStats?.[0]?.tag ?? '';

  return (
    <div className="app">
      <header>
        <h1>CF Analytics</h1>
        <p>Discover your weak Codeforces topics and get targeted practice problems.</p>
      </header>

      <form className="search-bar" onSubmit={analyze}>
        <input
          type="text"
          placeholder="Enter Codeforces handle…"
          value={handle}
          onChange={e => setHandle(e.target.value)}
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" disabled={loading || !handle.trim()}>
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>

      {loading && (
        <div className="loader">
          <span className="spinner" />
          Fetching data from Codeforces…
        </div>
      )}

      {error && <div className="error-box">⚠️ {error}</div>}

      {data && (
        <>
          <div className="meta">
            <span>Handle: <b style={{ color: 'var(--text)' }}>{data.handle}</b></span>
            {data.cached && <span className="badge cached">⚡ cached</span>}
            <span style={{ marginLeft: 'auto' }}>
              {data.tagStats?.length} tags analysed
            </span>
          </div>

          <RatingChart data={data.ratingHistory} />
          <TagChart data={data.tagStats} />
          <Suggestions data={data.suggestions} weakTag={weakTag} />
          <PracticeSet
            suggestions={data.suggestions}
            weakTag={weakTag}
            handle={data.handle}
            apiBase={API_BASE}
            initialSet={practiceSet}
          />
        </>
      )}
    </div>
  );
}
