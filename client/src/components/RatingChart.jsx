import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const fmtTick = (ts) => {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const diff = d.newRating - d.oldRating;
  return (
    <div style={{
      background: '#1a1d27', border: '1px solid #2e3250',
      borderRadius: 8, padding: '8px 12px', fontSize: '.82rem',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{d.contestName}</div>
      <div style={{ color: '#e2e8f0' }}>Rating: <b>{d.newRating}</b></div>
      <div style={{ color: diff >= 0 ? '#22c55e' : '#ef4444' }}>
        {diff >= 0 ? '+' : ''}{diff}
      </div>
    </div>
  );
};

export default function RatingChart({ data }) {
  if (!data?.length) {
    return (
      <div className="card">
        <h2>📈 Rating History</h2>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
          No rating history found (unrated or no contests yet).
        </p>
      </div>
    );
  }

  const minTs = data[0].ratingUpdateTimeSeconds;
  const maxTs = data[data.length - 1].ratingUpdateTimeSeconds;

  return (
    <div className="card">
      <h2>📈 Rating History</h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e3250" />
          <XAxis
            dataKey="ratingUpdateTimeSeconds"
            type="number"
            scale="time"
            domain={[minTs, maxTs]}
            tickFormatter={fmtTick}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickCount={6}
          />
          <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="newRating"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#6366f1' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
