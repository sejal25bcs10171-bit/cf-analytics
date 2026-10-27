import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';

const WEAK_COLOR   = '#ef4444';
const STRONG_COLOR = '#6366f1';
const ATT_COLOR    = '#475569';
const WEAK_THRESH  = 0.5;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const pct = (d.ratio * 100).toFixed(0);
  return (
    <div style={{
      background: '#1a1d27', border: '1px solid #2e3250',
      borderRadius: 8, padding: '8px 12px', fontSize: '.82rem',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#e2e8f0' }}>{d.fullTag}</div>
      <div style={{ color: STRONG_COLOR }}>Solved: {d.Solved}</div>
      <div style={{ color: ATT_COLOR }}>Attempted: {d.Attempted}</div>
      <div style={{ color: d.isWeak ? WEAK_COLOR : '#94a3b8', marginTop: 3 }}>
        Solve rate: {pct}%
      </div>
    </div>
  );
};

// Custom legend that shows correct swatch colours
const CustomLegend = () => (
  <div style={{
    display: 'flex', gap: '1.2rem', justifyContent: 'center',
    fontSize: '.82rem', color: '#94a3b8', paddingBottom: '4px',
  }}>
    <span>
      <span style={{
        display: 'inline-block', width: 12, height: 12,
        background: STRONG_COLOR, borderRadius: 2, marginRight: 5, verticalAlign: 'middle',
      }} />
      Solved
    </span>
    <span>
      <span style={{
        display: 'inline-block', width: 12, height: 12,
        background: ATT_COLOR, borderRadius: 2, marginRight: 5, verticalAlign: 'middle',
      }} />
      Attempted
    </span>
  </div>
);

export default function TagChart({ data }) {
  if (!data?.length) return null;

  // top 15 weakest (data is already sorted weakest-first)
  const chartData = data.slice(0, 15).map((d, i) => ({
    tag: d.tag.length > 18 ? d.tag.slice(0, 16) + '…' : d.tag,
    fullTag: d.tag,
    Solved: d.solved,
    Attempted: d.attempted,
    ratio: d.ratio,
    // first 3 entries OR ratio < 50% → weak
    isWeak: i < 3 || d.ratio < WEAK_THRESH,
  }));

  return (
    <div className="card">
      <h2>
        🏷️ Solved vs Attempted by Tag
        <span className="badge weak" style={{ marginLeft: '.5rem' }}>
          ● Weakest tags in red
        </span>
      </h2>
      <CustomLegend />
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, bottom: 0, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2e3250" />
          <XAxis
            dataKey="tag"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            angle={-40}
            textAnchor="end"
            interval={0}
            height={90}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={35} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Solved" name="Solved" radius={[4, 4, 0, 0]} fill={STRONG_COLOR}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.isWeak ? WEAK_COLOR : STRONG_COLOR} />
            ))}
          </Bar>
          <Bar dataKey="Attempted" name="Attempted" fill={ATT_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
